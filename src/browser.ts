import CDP from "chrome-remote-interface";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import { Socket } from "node:net";

const STATE_FILE = "/tmp/browser-cli.json";
const DEFAULT_PROFILE = join(homedir(), ".browser");
const CDP_PORT = 9222;
const LAUNCH_TIMEOUT_MS = 5000;
const LAUNCH_POLL_INTERVAL_MS = 100;
const DAEMON_STATE_FILE = "/tmp/browser-network-daemon.json";
const DAEMON_SOCKET_PATH = "/tmp/browser-network.sock";

interface State {
  activeTabId: string;
}

interface DaemonState {
  pid: number;
  socketPath: string;
}

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

async function readState(): Promise<State | null> {
  try {
    return await Bun.file(STATE_FILE).json();
  } catch {
    return null;
  }
}

async function writeState(state: State): Promise<void> {
  await Bun.write(STATE_FILE, JSON.stringify(state));
}

async function clearState(): Promise<void> {
  await Bun.$`rm -f ${STATE_FILE}`.quiet();
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
  await Bun.$`pkill -f "network-daemon" 2>/dev/null || true`.quiet();
  await Bun.$`rm -f ${DAEMON_STATE_FILE} ${DAEMON_SOCKET_PATH}`.quiet();
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

async function sendDaemonRequest(req: IPCRequest): Promise<IPCResponse> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    let data = "";

    socket.connect(DAEMON_SOCKET_PATH, () => {
      socket.write(JSON.stringify(req));
    });

    socket.on("data", (chunk) => {
      data += chunk.toString();
    });

    socket.on("end", () => {
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error("Invalid response from daemon"));
      }
    });

    socket.on("error", (err) => {
      reject(err);
    });

    socket.setTimeout(5000, () => {
      socket.destroy();
      reject(new Error("Daemon request timeout"));
    });
  });
}

function getChromiumPath(): string {
  const cacheDir = join(homedir(), "Library/Caches/ms-playwright");
  const result = Bun.spawnSync(["ls", cacheDir]);
  const dirs = result.stdout.toString().split("\n");
  const chromiumDir = dirs.find(d => d.startsWith("chromium-") && !d.includes("headless"));
  if (!chromiumDir) throw new Error("Chromium not found. Run: bunx playwright install chromium");
  return join(cacheDir, chromiumDir, "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
}

async function listTargets(): Promise<CDP.Target[]> {
  return CDP.List({ port: CDP_PORT });
}

export async function isRunning(): Promise<boolean> {
  try {
    await listTargets();
    return true;
  } catch {
    return false;
  }
}

export async function ensureRunning(): Promise<void> {
  if (!await isRunning()) {
    await launch({});
  }
}

export async function launch(options: { headless?: boolean }): Promise<string> {
  if (await isRunning()) {
    const state = await readState();
    return state?.activeTabId ?? "1";
  }

  await Bun.$`mkdir -p ${DEFAULT_PROFILE}`.quiet();

  const chromiumPath = getChromiumPath();
  const args = [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${DEFAULT_PROFILE}`,
  ];
  if (options.headless) args.push("--headless=new");

  spawn(chromiumPath, args, {
    detached: true,
    stdio: "ignore",
  }).unref();

  const maxAttempts = LAUNCH_TIMEOUT_MS / LAUNCH_POLL_INTERVAL_MS;
  for (let i = 0; i < maxAttempts; i++) {
    await Bun.sleep(LAUNCH_POLL_INTERVAL_MS);
    if (await isRunning()) {
      const targets = await listTargets();
      const page = targets.find(t => t.type === "page");
      if (page) {
        await writeState({ activeTabId: page.id });
        await startDaemon();
        return page.id;
      }
    }
  }

  throw new Error("Failed to start browser");
}

export async function close(): Promise<void> {
  await stopDaemon();
  const targets = await listTargets().catch(() => []);
  if (targets.length > 0) {
    const client = await CDP({ port: CDP_PORT, target: targets[0] });
    await client.Browser.close();
  }
  await clearState();
}

export async function openTab(url: string): Promise<{ tabId: string; url: string }> {
  const target = await CDP.New({ port: CDP_PORT, url });
  await writeState({ activeTabId: target.id });
  return { tabId: target.id, url };
}

export async function getTabs(): Promise<{ activeTabId: string; tabs: { id: string; url: string; title: string }[] }> {
  const state = await readState();
  const targets = await listTargets();
  const tabs = targets
    .filter(t => t.type === "page")
    .map(t => ({ id: t.id, url: t.url, title: t.title }));
  return { activeTabId: state?.activeTabId ?? tabs[0]?.id ?? "", tabs };
}

export async function useTab(tabId: string): Promise<boolean> {
  const targets = await listTargets();
  const target = targets.find(t => t.id === tabId);
  if (!target) return false;
  await writeState({ activeTabId: tabId });
  return true;
}

export async function closeTab(tabId?: string): Promise<string | null> {
  const state = await readState();
  const id = tabId ?? state?.activeTabId;
  if (!id) return null;

  try {
    await CDP.Close({ port: CDP_PORT, id });
    if (state?.activeTabId === id) {
      const targets = await listTargets();
      const next = targets.find(t => t.type === "page" && t.id !== id);
      await writeState({ activeTabId: next?.id ?? "" });
    }
    return id;
  } catch {
    return null;
  }
}

async function withActivePage<T>(fn: (client: CDP.Client) => Promise<T>): Promise<T> {
  const target = await getActiveTarget();
  if (!target) throw new Error("No active tab");
  
  const client = await CDP({ port: CDP_PORT, target: target.id });
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

async function getActiveTarget(): Promise<CDP.Target | null> {
  const state = await readState();
  if (!state?.activeTabId) return null;
  const targets = await listTargets();
  return targets.find(t => t.id === state.activeTabId) ?? null;
}

export async function getUrl(): Promise<string> {
  const target = await getActiveTarget();
  return target?.url ?? "";
}

export async function getTitle(): Promise<string> {
  const target = await getActiveTarget();
  return target?.title ?? "";
}

export async function getActiveTabId(): Promise<string | null> {
  const state = await readState();
  return state?.activeTabId ?? null;
}

export async function find(selector: string): Promise<number> {
  return withActivePage(async (client) => {
    await client.DOM.enable();
    const { root } = await client.DOM.getDocument();
    const { nodeIds } = await client.DOM.querySelectorAll({ nodeId: root.nodeId, selector });
    return nodeIds.length;
  });
}

export async function click(selector: string): Promise<void> {
  return withActivePage(async (client) => {
    await client.Runtime.enable();
    const { result } = await client.Runtime.evaluate({
      expression: `(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error("Element not found");
        el.click();
      })()`,
      awaitPromise: true,
    });
    if (result.subtype === "error") throw new Error(`Element not found: ${selector}`);
  });
}

export async function type(text: string, selector: string): Promise<void> {
  return withActivePage(async (client) => {
    await client.Runtime.enable();
    const { exceptionDetails } = await client.Runtime.evaluate({
      expression: `(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error("Element not found: ${selector}");
        el.focus();
        el.click();
        el.value = '';
      })()`,
    });
    if (exceptionDetails) {
      throw new Error(exceptionDetails.exception?.description ?? `Element not found: ${selector}`);
    }
    for (const char of text) {
      await client.Input.dispatchKeyEvent({ type: "keyDown", text: char });
      await client.Input.dispatchKeyEvent({ type: "keyUp", text: char });
    }
  });
}

export async function wait(selector: string, timeout = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const count = await find(selector);
    if (count > 0) return;
    await Bun.sleep(100);
  }
  throw new Error(`Timed out waiting for: ${selector}`);
}

export async function evaluate(js: string): Promise<unknown> {
  return withActivePage(async (client) => {
    await client.Runtime.enable();
    const { result, exceptionDetails } = await client.Runtime.evaluate({
      expression: js,
      awaitPromise: true,
      returnByValue: true,
    });
    if (exceptionDetails) {
      const msg = exceptionDetails.exception?.description ?? exceptionDetails.text;
      throw new Error(msg);
    }
    return result.value;
  });
}

export async function console(callback: (type: string, args: string[]) => void): Promise<() => Promise<void>> {
  const target = await getActiveTarget();
  if (!target) throw new Error("No active tab");

  const client = await CDP({ port: CDP_PORT, target: target.id });
  await client.Runtime.enable();

  client.Runtime.consoleAPICalled(async (params) => {
    const args: string[] = [];
    for (const arg of params.args) {
      if (arg.value !== undefined) {
        args.push(typeof arg.value === "object" ? JSON.stringify(arg.value) : String(arg.value));
      } else if (arg.objectId) {
        try {
          const { result } = await client.Runtime.callFunctionOn({
            objectId: arg.objectId,
            functionDeclaration: "function() { return JSON.stringify(this); }",
            returnByValue: true,
          });
          args.push(result.value ?? arg.description ?? arg.type);
        } catch {
          args.push(arg.description ?? arg.type);
        }
      } else {
        args.push(arg.description ?? arg.type);
      }
    }
    callback(params.type, args);
  });

  return async () => {
    await client.close();
  };
}

const DEFAULT_LIMIT = 2000;

export interface ContentResult {
  content: string;
  truncated: boolean;
  originalLength: number;
}

function truncate(content: string, limit: number): ContentResult {
  return {
    content: content.slice(0, limit),
    truncated: content.length > limit,
    originalLength: content.length,
  };
}

export async function html(selector = "body", limit = DEFAULT_LIMIT): Promise<ContentResult> {
  const content = await evaluate(`document.querySelector(${JSON.stringify(selector)})?.outerHTML ?? (() => { throw new Error("Element not found: ${selector}") })()`);
  return truncate(content as string, limit);
}

export async function text(selector = "body", limit = DEFAULT_LIMIT): Promise<ContentResult> {
  const content = await evaluate(`document.querySelector(${JSON.stringify(selector)})?.innerText ?? (() => { throw new Error("Element not found: ${selector}") })()`);
  return truncate(content as string, limit);
}

export async function back(): Promise<boolean> {
  return withActivePage(async (client) => {
    const { currentIndex, entries } = await client.Page.getNavigationHistory();
    if (currentIndex <= 0) return false;
    await client.Page.navigateToHistoryEntry({ entryId: entries[currentIndex - 1]!.id });
    return true;
  });
}

export async function forward(): Promise<boolean> {
  return withActivePage(async (client) => {
    const { currentIndex, entries } = await client.Page.getNavigationHistory();
    if (currentIndex >= entries.length - 1) return false;
    await client.Page.navigateToHistoryEntry({ entryId: entries[currentIndex + 1]!.id });
    return true;
  });
}

export async function refresh(): Promise<void> {
  return withActivePage(async (client) => {
    await client.Page.reload({});
  });
}

export async function outline(selector = "body", maxDepth = 6): Promise<string> {
  const result = await evaluate(`(() => {
    const root = document.querySelector(${JSON.stringify(selector)});
    if (!root) throw new Error("Element not found: ${selector}");

    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'PATH', 'BR', 'HR', 'META', 'LINK']);

    function getIdentifier(el) {
      let id = el.tagName.toLowerCase();
      if (el.id) id += '#' + el.id;
      else if (el.className && typeof el.className === 'string') {
        const cls = el.className.trim().split(/\\s+/).slice(0, 2).join('.');
        if (cls) id += '.' + cls;
      }
      return id;
    }

    function getTextPreview(el, maxLen = 50) {
      let text = '';
      for (const child of el.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) text += child.textContent;
      }
      text = text.trim().replace(/\\s+/g, ' ');
      if (text.length > maxLen) return '"' + text.slice(0, maxLen) + '..."';
      if (text.length > 0) return '"' + text + '"';
      return '';
    }

    function getElementInfo(el) {
      const tag = el.tagName;
      if (tag === 'A') return el.getAttribute('href') ? '[href]' : '';
      if (tag === 'IMG') {
        const alt = el.getAttribute('alt');
        return alt ? '"' + alt.slice(0, 30) + '"' : '[img]';
      }
      if (tag === 'INPUT') {
        const type = el.getAttribute('type') || 'text';
        const placeholder = el.getAttribute('placeholder');
        return '[' + type + ']' + (placeholder ? ' "' + placeholder + '"' : '');
      }
      if (tag === 'BUTTON') return getTextPreview(el, 30);
      if (tag === 'SELECT') return '(' + el.options.length + ' options)';
      return '';
    }

    function findRepeatedGroups(children) {
      const groups = [];
      let i = 0;
      while (i < children.length) {
        const sig = getIdentifier(children[i]);
        let count = 1;
        while (i + count < children.length && getIdentifier(children[i + count]) === sig) count++;
        groups.push({ start: i, count });
        i += count;
      }
      return groups;
    }

    function walk(el, depth) {
      if (depth > ${maxDepth}) return '  '.repeat(depth) + '...\\n';
      if (SKIP_TAGS.has(el.tagName)) return '';

      const indent = '  '.repeat(depth);
      const info = getElementInfo(el);
      let line = indent + getIdentifier(el);
      if (info) line += ' ' + info;
      else {
        const preview = getTextPreview(el);
        if (preview) line += ' ' + preview;
      }
      line += '\\n';

      const children = Array.from(el.children).filter(c => !SKIP_TAGS.has(c.tagName));
      if (children.length === 0) return line;

      for (const { start, count } of findRepeatedGroups(children)) {
        if (count > 2) {
          const childOutput = walk(children[start], depth + 1);
          const firstLine = childOutput.split('\\n')[0];
          line += firstLine + ' (×' + count + ')\\n';
          const rest = childOutput.split('\\n').slice(1).join('\\n');
          if (rest.trim()) line += rest;
        } else {
          for (let j = 0; j < count; j++) line += walk(children[start + j], depth + 1);
        }
      }
      return line;
    }

    return walk(root, 0);
  })()`);
  return (result as string).trimEnd();
}

export interface NetworkFilter {
  pattern?: string;
  type?: string[];
  failed?: boolean;
}

export interface NetworkListResult {
  requests: NetworkRequest[];
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
