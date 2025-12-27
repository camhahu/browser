import { spawn } from "node:child_process";
import { getActiveTarget, setOnLaunch, setOnClose } from "./cdp";

const DAEMON_STATE_FILE = "/tmp/browser-network-daemon.json";
const DAEMON_SOCKET_PATH = "/tmp/browser-network.sock";

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
  socketPath: string;
}

interface IPCRequest {
  type: "list" | "get" | "clear";
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

export async function startDaemon(): Promise<void> {
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

export async function stopDaemon(): Promise<void> {
  const state = await readDaemonState();
  if (state) {
    try {
      process.kill(state.pid, "SIGTERM");
    } catch {}
  }
  await Bun.$`pkill -f "network-daemon" 2>/dev/null || true`.quiet();
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

export async function network(filter?: NetworkFilter): Promise<NetworkListResult> {
  const target = await getActiveTarget();
  if (!target) throw new Error("No active tab");

  if (!await isDaemonRunning()) {
    await startDaemon();
  }

  try {
    const response = await sendDaemonRequest({ type: "list", tabId: target.id });
    if (!response.success) return { requests: [] };

    let requests = response.data as NetworkRequest[];

    if (filter?.pattern) {
      const pattern = filter.pattern.toLowerCase();
      requests = requests.filter(r => r.url.toLowerCase().includes(pattern));
    }
    if (filter?.type && filter.type.length > 0) {
      const types = new Set(filter.type.map(t => t.toLowerCase()));
      requests = requests.filter(r => types.has(r.type.toLowerCase()));
    }
    if (filter?.failed) {
      requests = requests.filter(r => r.failed);
    }

    return { requests };
  } catch {
    return { requests: [] };
  }
}

export async function networkRequest(id: number): Promise<NetworkRequest | null> {
  const target = await getActiveTarget();
  if (!target) throw new Error("No active tab");
  if (!await isDaemonRunning()) return null;

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
  if (!await isDaemonRunning()) return;

  try {
    await sendDaemonRequest({ type: "clear", tabId: target.id });
  } catch {}
}

setOnLaunch(startDaemon);
setOnClose(stopDaemon);
