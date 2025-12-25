#!/usr/bin/env bun

import CDP from "chrome-remote-interface";

const CDP_PORT = 9222;
const SOCKET_PATH = "/tmp/browser-network.sock";
const STATE_FILE = "/tmp/browser-network-daemon.json";
const HEALTH_CHECK_INTERVAL_MS = 60_000;

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

interface PendingRequest {
  id: number;
  tabId: string;
  requestId: string;
  url: string;
  method: string;
  type: string;
  startTime: number;
  requestHeaders: Record<string, string>;
  postData?: string;
}

interface DaemonState {
  pid: number;
  socketPath: string;
}

const requests = new Map<string, NetworkRequest[]>();
const pending = new Map<string, PendingRequest>();
const tabClients = new Map<string, CDP.Client>();
let nextId = 1;

async function writeDaemonState(): Promise<void> {
  const state: DaemonState = { pid: process.pid, socketPath: SOCKET_PATH };
  await Bun.write(STATE_FILE, JSON.stringify(state));
}

async function clearDaemonState(): Promise<void> {
  await Bun.$`rm -f ${STATE_FILE}`.quiet();
}

export async function getDaemonState(): Promise<DaemonState | null> {
  try {
    return await Bun.file(STATE_FILE).json();
  } catch {
    return null;
  }
}

function getTabRequests(tabId: string): NetworkRequest[] {
  if (!requests.has(tabId)) {
    requests.set(tabId, []);
  }
  return requests.get(tabId)!;
}

const NETWORK_BUFFER_SIZE = 100 * 1024 * 1024;
const RESOURCE_BUFFER_SIZE = 10 * 1024 * 1024;

async function attachToTab(targetId: string): Promise<void> {
  if (tabClients.has(targetId)) return;

  try {
    const client = await CDP({ port: CDP_PORT, target: targetId });
    tabClients.set(targetId, client);

    await client.Network.enable({
      maxTotalBufferSize: NETWORK_BUFFER_SIZE,
      maxResourceBufferSize: RESOURCE_BUFFER_SIZE,
    });

    client.Network.requestWillBeSent((params) => {
      pending.set(params.requestId, {
        id: nextId++,
        tabId: targetId,
        requestId: params.requestId,
        url: params.request.url,
        method: params.request.method,
        type: params.type ?? "Other",
        startTime: params.timestamp * 1000,
        requestHeaders: params.request.headers as Record<string, string>,
        postData: params.request.postData,
      });
    });

    client.Network.responseReceived((params) => {
      const p = pending.get(params.requestId);
      if (!p) return;

      const tabReqs = getTabRequests(p.tabId);
      tabReqs.push({
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

    client.Network.loadingFinished(async (params) => {
      const p = pending.get(params.requestId);
      if (!p) return;

      const tabReqs = getTabRequests(p.tabId);
      const request = tabReqs.find((r) => r.id === p.id);
      if (request) {
        request.endTime = params.timestamp * 1000;
        request.duration = request.endTime - request.startTime;
        try {
          const { body, base64Encoded } = await client.Network.getResponseBody({
            requestId: params.requestId,
          });
          request.responseBody = base64Encoded ? `[base64] ${body.slice(0, 100)}...` : body;
        } catch {}
      }
      pending.delete(params.requestId);
    });

    client.Network.loadingFailed((params) => {
      const p = pending.get(params.requestId);
      if (!p) return;

      const tabReqs = getTabRequests(p.tabId);
      const existing = tabReqs.find((r) => r.id === p.id);
      if (existing) {
        existing.endTime = params.timestamp * 1000;
        existing.duration = existing.endTime - existing.startTime;
        if (params.errorText && params.errorText !== "net::ERR_ABORTED") {
          existing.error = params.errorText;
          existing.failed = true;
        }
      } else {
        const endTime = params.timestamp * 1000;
        tabReqs.push({
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

    client.on("disconnect", () => tabClients.delete(targetId));
  } catch {}
}

async function detachFromTab(targetId: string): Promise<void> {
  const client = tabClients.get(targetId);
  if (!client) return;
  await client.close().catch(() => {});
  tabClients.delete(targetId);
}

async function discoverAndAttachTabs(): Promise<void> {
  const targets = await CDP.List({ port: CDP_PORT });
  const pageTabs = targets.filter((t) => t.type === "page");

  for (const tab of pageTabs) {
    await attachToTab(tab.id);
  }
}

let browserClient: CDP.Client | null = null;

async function startTargetListener(): Promise<void> {
  const targets = await CDP.List({ port: CDP_PORT });
  const browserTarget = targets.find((t) => t.type === "browser");
  if (!browserTarget) return;

  browserClient = await CDP({ port: CDP_PORT, target: browserTarget.id });
  await browserClient.Target.setDiscoverTargets({ discover: true });

  browserClient.Target.targetCreated(async (params) => {
    if (params.targetInfo.type === "page") {
      await Bun.sleep(100);
      await attachToTab(params.targetInfo.targetId);
    }
  });

  browserClient.Target.targetDestroyed(async (params) => {
    await detachFromTab(params.targetId);
  });
}

async function checkBrowserHealth(): Promise<boolean> {
  try {
    await CDP.List({ port: CDP_PORT });
    return true;
  } catch {
    return false;
  }
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

function handleIPCRequest(req: IPCRequest): IPCResponse {
  switch (req.type) {
    case "list": {
      if (!req.tabId) {
        const all: NetworkRequest[] = [];
        for (const reqs of requests.values()) all.push(...reqs);
        return { success: true, data: all };
      }
      return { success: true, data: requests.get(req.tabId) ?? [] };
    }
    case "get": {
      if (!req.tabId || req.requestId === undefined) {
        return { success: false, error: "tabId and requestId required" };
      }
      const tabReqs = requests.get(req.tabId) ?? [];
      const request = tabReqs.find((r) => r.id === req.requestId);
      if (!request) return { success: false, error: "Request not found" };
      return { success: true, data: request };
    }
    case "clear": {
      if (req.tabId) requests.delete(req.tabId);
      else requests.clear();
      return { success: true };
    }
    default:
      return { success: false, error: "Unknown request type" };
  }
}

async function startIPCServer(): Promise<void> {
  await Bun.$`rm -f ${SOCKET_PATH}`.quiet();
  Bun.listen({
    unix: SOCKET_PATH,
    socket: {
      data(socket, data) {
        try {
          const req: IPCRequest = JSON.parse(data.toString());
          socket.write(JSON.stringify(handleIPCRequest(req)));
        } catch (err) {
          socket.write(JSON.stringify({ success: false, error: String(err) }));
        }
        socket.end();
      },
      open() {},
      close() {},
      error() {},
    },
  });
}

async function startHealthCheck(): Promise<void> {
  setInterval(async () => {
    if (!await checkBrowserHealth()) {
      await shutdown();
    }
    await discoverAndAttachTabs();
  }, HEALTH_CHECK_INTERVAL_MS);
}

async function shutdown(): Promise<void> {
  if (browserClient) {
    await browserClient.close().catch(() => {});
    browserClient = null;
  }
  for (const client of tabClients.values()) {
    await client.close().catch(() => {});
  }
  tabClients.clear();
  await Bun.$`rm -f ${SOCKET_PATH}`.quiet();
  await clearDaemonState();
  process.exit(0);
}

export async function runDaemon(): Promise<void> {
  if (!await checkBrowserHealth()) {
    process.exit(1);
  }

  await writeDaemonState();
  await startIPCServer();
  await discoverAndAttachTabs();
  await startTargetListener();
  await startHealthCheck();

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  await new Promise(() => {});
}

// Run if executed directly
if (import.meta.main) {
  runDaemon().catch((err: Error) => {
    console.error("Daemon error:", err);
    process.exit(1);
  });
}
