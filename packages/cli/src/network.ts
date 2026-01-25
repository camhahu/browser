import { spawn } from "node:child_process";
import { join } from "node:path";
import { rm } from "node:fs/promises";
import { getActiveTarget, addOnLaunch, addOnClose } from "./cdp";
import { BROWSER_DIR } from "./config";

const DAEMON_STATE_FILE = join(BROWSER_DIR, "network-daemon.json");
const IPC_HOST = "127.0.0.1";

export interface NetworkRequest {
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

export interface NetworkFilter {
    pattern?: string;
    type?: string[];
    failed?: boolean;
}

export interface NetworkListResult {
    requests: NetworkRequest[];
}

interface DaemonState {
    pid: number;
    port: number;
    token: string;
}

interface IPCRequest {
    type: "list" | "get" | "clear" | "ping";
    tabId?: string;
    requestId?: number;
}

interface IPCResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}

async function readDaemonState(): Promise<DaemonState | null> {
    try {
        const state = (await Bun.file(DAEMON_STATE_FILE).json()) as DaemonState;
        if (!state || typeof state.port !== "number" || typeof state.token !== "string") return null;
        return state;
    } catch {
        return null;
    }
}

async function pingDaemon(state: DaemonState): Promise<boolean> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 500);
    try {
        const res = await fetch(`http://${IPC_HOST}:${state.port}/`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-browser-token": state.token,
            },
            body: JSON.stringify({ type: "ping" }),
            signal: controller.signal,
        } as RequestInit);
        const data = (await res.json()) as IPCResponse;
        return res.ok && data.success === true;
    } catch {
        return false;
    } finally {
        clearTimeout(timeout);
    }
}

async function isDaemonRunning(): Promise<boolean> {
    const state = await readDaemonState();
    if (!state) return false;
    return pingDaemon(state);
}

async function startDaemon(): Promise<void> {
    if (await isDaemonRunning()) return;

    spawn(process.execPath, ["_network-daemon"], {
        detached: true,
        stdio: "ignore",
    }).unref();

    for (let i = 0; i < 30; i++) {
        await Bun.sleep(100);
        if (await isDaemonRunning()) return;
    }
}

async function stopDaemon(): Promise<void> {
    const state = await readDaemonState();
    if (state) {
        try {
            process.kill(state.pid, "SIGTERM");
        } catch {}
    }
    await rm(DAEMON_STATE_FILE, { force: true });
}

async function sendDaemonRequest(req: IPCRequest): Promise<IPCResponse> {
    const state = await readDaemonState();
    if (!state) return { success: false, error: "Daemon not running" };
    try {
        const res = await fetch(`http://${IPC_HOST}:${state.port}/`, {
            method: "POST",
            headers: {
                "content-type": "application/json",
                "x-browser-token": state.token,
            },
            body: JSON.stringify(req),
        } as RequestInit);
        return res.json() as Promise<IPCResponse>;
    } catch {
        return { success: false, error: "Daemon not running" };
    }
}

export async function network(filter?: NetworkFilter): Promise<NetworkListResult> {
    const target = await getActiveTarget();
    if (!target) throw new Error("No active tab");

    if (!(await isDaemonRunning())) {
        await startDaemon();
    }

    try {
        let response = await sendDaemonRequest({ type: "list", tabId: target.id });
        if (!response.success && response.error === "Daemon not running") {
            await startDaemon();
            response = await sendDaemonRequest({ type: "list", tabId: target.id });
        }
        if (!response.success) return { requests: [] };

        let requests = response.data as NetworkRequest[];

        if (filter?.pattern) {
            const pattern = filter.pattern.toLowerCase();
            requests = requests.filter((r) => r.url.toLowerCase().includes(pattern));
        }
        if (filter?.type && filter.type.length > 0) {
            const types = new Set(filter.type.map((t) => t.toLowerCase()));
            requests = requests.filter((r) => types.has(r.type.toLowerCase()));
        }
        if (filter?.failed) {
            requests = requests.filter((r) => r.failed);
        }

        return { requests };
    } catch {
        return { requests: [] };
    }
}

export async function networkRequest(id: number): Promise<NetworkRequest | null> {
    const target = await getActiveTarget();
    if (!target) throw new Error("No active tab");
    if (!(await isDaemonRunning())) return null;

    try {
        const response = await sendDaemonRequest({ type: "get", tabId: target.id, requestId: id });
        if (!response.success) return null;
        return response.data as NetworkRequest;
    } catch {
        return null;
    }
}

export async function clearNetwork(): Promise<void> {
    const target = await getActiveTarget();
    if (!target) throw new Error("No active tab");
    if (!(await isDaemonRunning())) return;

    try {
        await sendDaemonRequest({ type: "clear", tabId: target.id });
    } catch {}
}

addOnLaunch(startDaemon);
addOnClose(stopDaemon);
