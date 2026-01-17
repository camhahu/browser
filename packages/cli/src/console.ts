import { spawn } from "node:child_process";
import { getActiveTarget, addOnLaunch, addOnClose } from "./cdp";

const DAEMON_STATE_FILE = "/tmp/browser-console-daemon.json";
const DAEMON_SOCKET_PATH = "/tmp/browser-console.sock";

export interface ConsoleMessage {
    id: number;
    tabId: string;
    type: string;
    args: string[];
    timestamp: number;
}

export interface ConsoleFilter {
    type?: string[];
}

export interface ConsoleListResult {
    messages: ConsoleMessage[];
}

interface DaemonState {
    pid: number;
    socketPath: string;
}

interface IPCRequest {
    type: "list" | "clear";
    tabId?: string;
}

interface IPCResponse {
    success: boolean;
    data?: unknown;
    error?: string;
}

async function readDaemonState(): Promise<DaemonState | null> {
    try {
        return await Bun.file(DAEMON_STATE_FILE).json();
    } catch {
        return null;
    }
}

async function isDaemonRunning(): Promise<boolean> {
    const state = await readDaemonState();
    if (!state) return false;
    try {
        process.kill(state.pid, 0);
        return true;
    } catch {
        return false;
    }
}

async function startDaemon(): Promise<void> {
    if (await isDaemonRunning()) return;

    spawn(process.execPath, ["_console-daemon"], {
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
    await Bun.$`pkill -f "console-daemon" 2>/dev/null || true`.quiet();
    await Bun.$`rm -f ${DAEMON_STATE_FILE} ${DAEMON_SOCKET_PATH}`.quiet();
}

async function sendDaemonRequest(req: IPCRequest): Promise<IPCResponse> {
    const res = await fetch(`http://localhost${DAEMON_SOCKET_PATH}`, {
        method: "POST",
        unix: DAEMON_SOCKET_PATH,
        body: JSON.stringify(req),
    } as RequestInit);
    return res.json() as Promise<IPCResponse>;
}

export async function consoleMessages(filter?: ConsoleFilter): Promise<ConsoleListResult> {
    const target = await getActiveTarget();
    if (!target) throw new Error("No active tab");

    if (!(await isDaemonRunning())) {
        await startDaemon();
    }

    try {
        const response = await sendDaemonRequest({ type: "list", tabId: target.id });
        if (!response.success) return { messages: [] };

        let messages = response.data as ConsoleMessage[];

        if (filter?.type && filter.type.length > 0) {
            const types = new Set(filter.type.map((t) => t.toLowerCase()));
            messages = messages.filter((m) => types.has(m.type.toLowerCase()));
        }

        return { messages };
    } catch {
        return { messages: [] };
    }
}

export async function clearConsole(): Promise<void> {
    const target = await getActiveTarget();
    if (!target) throw new Error("No active tab");
    if (!(await isDaemonRunning())) return;

    try {
        await sendDaemonRequest({ type: "clear", tabId: target.id });
    } catch {}
}

addOnLaunch(startDaemon);
addOnClose(stopDaemon);
