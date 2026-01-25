#!/usr/bin/env bun

import CDP from "chrome-remote-interface";
import { homedir } from "node:os";
import { join } from "node:path";
import { captureError, flush } from "./telemetry";

const CDP_PORT = 9222;
const BROWSER_DIR = join(homedir(), ".browser");
const SOCKET_PATH = join(BROWSER_DIR, "console.sock");
const STATE_FILE = join(BROWSER_DIR, "console-daemon.json");
const HEALTH_CHECK_MS = 60_000;

interface ConsoleMessage {
    id: number;
    tabId: string;
    type: string;
    args: string[];
    timestamp: number;
}

const messages = new Map<string, ConsoleMessage[]>();
const sessions = new Map<string, string>(); // sessionId -> targetId
let nextId = 1;
let client: CDP.Client | null = null;

function getMessages(tabId: string): ConsoleMessage[] {
    if (!messages.has(tabId)) messages.set(tabId, []);
    return messages.get(tabId)!;
}

async function enableRuntimeForSession(sessionId: string, targetId: string): Promise<void> {
    if (!client) return;
    sessions.set(sessionId, targetId);
    await client.send("Runtime.enable", undefined, sessionId);
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
            await enableRuntimeForSession(sessionId, target.targetId);
        }
    }

    client.on("Target.targetCreated", async (params) => {
        if (params.targetInfo.type === "page" && !isAttached(params.targetInfo.targetId)) {
            try {
                const { sessionId } = await client!.Target.attachToTarget({
                    targetId: params.targetInfo.targetId,
                    flatten: true,
                });
                await enableRuntimeForSession(sessionId, params.targetInfo.targetId);
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

interface RemoteObject {
    type: string;
    value?: unknown;
    objectId?: string;
    description?: string;
}

async function stringifyArg(arg: RemoteObject, sessionId?: string): Promise<string> {
    if (arg.value !== undefined) {
        return typeof arg.value === "object" ? JSON.stringify(arg.value) : String(arg.value);
    }
    if (arg.objectId && client) {
        try {
            const { result } = await client.send(
                "Runtime.callFunctionOn",
                {
                    objectId: arg.objectId,
                    functionDeclaration: "function() { return JSON.stringify(this); }",
                    returnByValue: true,
                },
                sessionId,
            );
            return result.value ?? arg.description ?? arg.type;
        } catch {
            return arg.description ?? arg.type;
        }
    }
    return arg.description ?? arg.type;
}

function setupConsoleHandlers(): void {
    if (!client) return;

    client.on("Runtime.consoleAPICalled", async (params, sessionId) => {
        const targetId = sessions.get(sessionId ?? "");
        if (!targetId) return;

        const args: string[] = [];
        for (const arg of params.args) {
            args.push(await stringifyArg(arg, sessionId));
        }

        getMessages(targetId).push({
            id: nextId++,
            tabId: targetId,
            type: params.type,
            args,
            timestamp: params.timestamp,
        });
    });

    client.on("Target.attachedToTarget", async (params) => {
        if (params.targetInfo.type === "page") {
            await enableRuntimeForSession(params.sessionId, params.targetInfo.targetId);
            await client!.send("Runtime.runIfWaitingForDebugger", undefined, params.sessionId).catch(() => {});
        }
    });

    client.on("Target.detachedFromTarget", (params) => {
        sessions.delete(params.sessionId);
    });
}

interface IPCRequest {
    type: "list" | "clear";
    tabId?: string;
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
                await enableRuntimeForSession(sessionId, target.targetId);
            } catch {}
        }
    }
}

async function handleIPC(req: IPCRequest): Promise<{ success: boolean; data?: unknown; error?: string }> {
    await attachToNewTargets();

    switch (req.type) {
        case "list":
            if (!req.tabId) {
                const all: ConsoleMessage[] = [];
                for (const msgs of messages.values()) all.push(...msgs);
                return { success: true, data: all };
            }
            return { success: true, data: messages.get(req.tabId) ?? [] };
        case "clear":
            if (req.tabId) messages.delete(req.tabId);
            else messages.clear();
            return { success: true };
        default:
            return { success: false, error: "Unknown type" };
    }
}

async function startIPC(): Promise<void> {
    await Bun.$`rm -f ${SOCKET_PATH}`.quiet();
    Bun.serve({
        unix: SOCKET_PATH,
        async fetch(req) {
            const body = (await req.json()) as IPCRequest;
            return Response.json(await handleIPC(body));
        },
    });
}

async function shutdown(): Promise<void> {
    if (client) await client.close().catch(() => {});
    await Bun.$`rm -f ${SOCKET_PATH} ${STATE_FILE}`.quiet();
    process.exit(0);
}

export async function runDaemon(): Promise<void> {
    try {
        await CDP.List({ port: CDP_PORT });
    } catch {
        process.exit(1);
    }

    await Bun.$`mkdir -p ${BROWSER_DIR}`.quiet();
    await Bun.write(STATE_FILE, JSON.stringify({ pid: process.pid, socketPath: SOCKET_PATH }));

    client = await CDP({ port: CDP_PORT });
    setupConsoleHandlers();
    await setupAutoAttach();
    await startIPC();

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
