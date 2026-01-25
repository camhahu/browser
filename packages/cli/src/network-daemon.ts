#!/usr/bin/env bun

import CDP from "chrome-remote-interface";
import { join } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { captureError, flush } from "./telemetry";
import { BROWSER_DIR } from "./config";

const CDP_PORT = 9222;
const IPC_HOST = "127.0.0.1";
const STATE_FILE = join(BROWSER_DIR, "network-daemon.json");
const HEALTH_CHECK_MS = 60_000;
let server: ReturnType<typeof Bun.serve> | null = null;

interface NetworkRequest {
    id: number;
    tabId: string;
    url: string;
    method: string;
    status?: number;
    statusText?: string;
    type: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    requestHeaders: Record<string, string>;
    responseHeaders?: Record<string, string>;
    requestBody?: string;
    responseBody?: string;
    error?: string;
    failed: boolean;
}

interface PendingRequest {
    id: number;
    tabId: string;
    cdpRequestId: string;
    url: string;
    method: string;
    type: string;
    startTime: number;
    requestHeaders: Record<string, string>;
    postData?: string;
}

const requests = new Map<string, NetworkRequest[]>();
const pending = new Map<string, PendingRequest>();
const sessions = new Map<string, string>(); // sessionId -> targetId
let nextId = 1;
let client: CDP.Client | null = null;

function getRequests(tabId: string): NetworkRequest[] {
    if (!requests.has(tabId)) requests.set(tabId, []);
    return requests.get(tabId)!;
}

async function enableNetworkForSession(sessionId: string, targetId: string): Promise<void> {
    if (!client) return;
    sessions.set(sessionId, targetId);

    await client.send(
        "Network.enable",
        {
            maxTotalBufferSize: 100 * 1024 * 1024,
            maxResourceBufferSize: 10 * 1024 * 1024,
        },
        sessionId,
    );
}

async function setupAutoAttach(): Promise<void> {
    if (!client) return;

    const { targetInfos } = await client.Target.getTargets();
    for (const target of targetInfos) {
        if (target.type === "page") {
            const { sessionId } = await client.Target.attachToTarget({
                targetId: target.targetId,
                flatten: true,
            });
            await enableNetworkForSession(sessionId, target.targetId);
        }
    }

    client.on("Target.targetCreated", async (params) => {
        if (params.targetInfo.type === "page" && !isAttached(params.targetInfo.targetId)) {
            try {
                const { sessionId } = await client!.Target.attachToTarget({
                    targetId: params.targetInfo.targetId,
                    flatten: true,
                });
                await enableNetworkForSession(sessionId, params.targetInfo.targetId);
            } catch {}
        }
    });

    await client.Target.setDiscoverTargets({ discover: true });
    await client.Target.setAutoAttach({
        autoAttach: true,
        waitForDebuggerOnStart: false,
        flatten: true,
    });
}

function setupNetworkHandlers(): void {
    if (!client) return;

    client.on("Network.requestWillBeSent", (params, sessionId) => {
        const targetId = sessions.get(sessionId ?? "");
        if (!targetId) return;

        pending.set(params.requestId, {
            id: nextId++,
            tabId: targetId,
            cdpRequestId: params.requestId,
            url: params.request.url,
            method: params.request.method,
            type: params.type ?? "Other",
            startTime: params.timestamp * 1000,
            requestHeaders: params.request.headers as Record<string, string>,
            postData: params.request.postData,
        });
    });

    client.on("Network.responseReceived", (params, sessionId) => {
        const p = pending.get(params.requestId);
        if (!p) return;

        getRequests(p.tabId).push({
            id: p.id,
            tabId: p.tabId,
            url: p.url,
            method: p.method,
            status: params.response.status,
            statusText: params.response.statusText,
            type: p.type,
            startTime: p.startTime,
            requestHeaders: p.requestHeaders,
            responseHeaders: params.response.headers as Record<string, string>,
            requestBody: p.postData,
            failed: false,
        });
    });

    client.on("Network.loadingFinished", async (params, sessionId) => {
        const p = pending.get(params.requestId);
        if (!p) return;

        const req = getRequests(p.tabId).find((r) => r.id === p.id);
        if (req) {
            req.endTime = params.timestamp * 1000;
            req.duration = req.endTime - req.startTime;

            try {
                const { body, base64Encoded } = await client!.send(
                    "Network.getResponseBody",
                    { requestId: params.requestId },
                    sessionId,
                );
                req.responseBody = base64Encoded ? `[base64] ${body.slice(0, 100)}...` : body;
            } catch {}
        }
        pending.delete(params.requestId);
    });

    client.on("Network.loadingFailed", (params) => {
        const p = pending.get(params.requestId);
        if (!p) return;

        const existing = getRequests(p.tabId).find((r) => r.id === p.id);
        if (existing) {
            existing.endTime = params.timestamp * 1000;
            existing.duration = existing.endTime - existing.startTime;
            if (params.errorText && params.errorText !== "net::ERR_ABORTED") {
                existing.error = params.errorText;
                existing.failed = true;
            }
        } else {
            const endTime = params.timestamp * 1000;
            getRequests(p.tabId).push({
                id: p.id,
                tabId: p.tabId,
                url: p.url,
                method: p.method,
                type: p.type,
                startTime: p.startTime,
                endTime,
                duration: endTime - p.startTime,
                requestHeaders: p.requestHeaders,
                requestBody: p.postData,
                error: params.errorText,
                failed: true,
            });
        }
        pending.delete(params.requestId);
    });

    client.on("Target.attachedToTarget", async (params) => {
        if (params.targetInfo.type === "page") {
            await enableNetworkForSession(params.sessionId, params.targetInfo.targetId);
            await client!.send("Runtime.runIfWaitingForDebugger", undefined, params.sessionId).catch(() => {});
        }
    });

    client.on("Target.detachedFromTarget", (params) => {
        sessions.delete(params.sessionId);
    });
}

interface IPCRequest {
    type: "list" | "get" | "clear" | "ping";
    tabId?: string;
    requestId?: number;
}

function getSessionId(targetId: string): string | undefined {
    for (const [sessionId, tid] of sessions) {
        if (tid === targetId) return sessionId;
    }
}

function isAttached(targetId: string): boolean {
    return getSessionId(targetId) !== undefined;
}

async function attachToNewTargets(): Promise<void> {
    if (!client) return;
    const { targetInfos } = await client.Target.getTargets();
    for (const target of targetInfos) {
        if (target.type === "page" && !isAttached(target.targetId)) {
            try {
                const { sessionId } = await client.Target.attachToTarget({
                    targetId: target.targetId,
                    flatten: true,
                });
                await enableNetworkForSession(sessionId, target.targetId);
            } catch {}
        }
    }
}

async function handleIPC(req: IPCRequest): Promise<{ success: boolean; data?: unknown; error?: string }> {
    await attachToNewTargets();

    switch (req.type) {
        case "ping":
            return { success: true };
        case "list":
            if (!req.tabId) {
                const all: NetworkRequest[] = [];
                for (const reqs of requests.values()) all.push(...reqs);
                return { success: true, data: all };
            }
            return { success: true, data: requests.get(req.tabId) ?? [] };
        case "get":
            if (!req.tabId || req.requestId === undefined) {
                return { success: false, error: "tabId and requestId required" };
            }
            const tabReqs = requests.get(req.tabId) ?? [];
            const request = tabReqs.find((r) => r.id === req.requestId);
            return request ? { success: true, data: request } : { success: false, error: "Not found" };
        case "clear":
            if (req.tabId) requests.delete(req.tabId);
            else requests.clear();
            return { success: true };
        default:
            return { success: false, error: "Unknown type" };
    }
}

async function startIPC(): Promise<void> {
    server = Bun.serve({
        hostname: IPC_HOST,
        port: 0,
        async fetch(req) {
            if (req.method !== "POST") {
                return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
            }
            const token = req.headers.get("x-browser-token");
            if (!token || token !== Bun.env.BROWSER_IPC_TOKEN) {
                return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
            }
            let body: IPCRequest;
            try {
                body = (await req.json()) as IPCRequest;
            } catch {
                return Response.json({ success: false, error: "Invalid JSON" }, { status: 400 });
            }
            return Response.json(await handleIPC(body));
        },
    });
}

async function shutdown(): Promise<void> {
    if (client) await client.close().catch(() => {});
    server?.stop();
    await rm(STATE_FILE, { force: true });
    process.exit(0);
}

export async function runDaemon(): Promise<void> {
    try {
        await CDP.List({ port: CDP_PORT });
    } catch {
        process.exit(1);
    }

    await mkdir(BROWSER_DIR, { recursive: true });
    const token = crypto.randomUUID();
    Bun.env.BROWSER_IPC_TOKEN = token;
    await startIPC();
    if (!server) {
        throw new Error("Failed to start IPC server");
    }
    await Bun.write(STATE_FILE, JSON.stringify({ pid: process.pid, port: server.port, token }));

    client = await CDP({ port: CDP_PORT });
    setupNetworkHandlers();
    await setupAutoAttach();

    setInterval(async () => {
        try {
            await CDP.List({ port: CDP_PORT });
        } catch {
            await shutdown();
        }
    }, HEALTH_CHECK_MS);

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    await new Promise(() => {});
}

if (import.meta.main) {
    runDaemon().catch(async (err) => {
        captureError(err);
        await flush();
        process.exit(1);
    });
}
