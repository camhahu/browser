import CDP from "chrome-remote-interface";
import { spawn } from "node:child_process";
import { getBrowserPath } from "./config";

const STATE_FILE = "/tmp/browser-cli.json";
const PROFILE_DIR = "/tmp/browser-cli-profile";
export const CDP_PORT = 9222;
const LAUNCH_TIMEOUT_MS = 5000;
const LAUNCH_POLL_INTERVAL_MS = 100;

interface State {
  activeTabId: string;
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

export async function listTargets(): Promise<CDP.Target[]> {
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

export async function getActiveTarget(): Promise<CDP.Target | null> {
  const state = await readState();
  if (!state?.activeTabId) return null;
  const targets = await listTargets();
  const target = targets.find(t => t.id === state.activeTabId);
  if (!target) {
    throw new Error("Active tab was closed. Use `browser tabs` to see available tabs and `browser use <id>` to select one.");
  }
  return target;
}

export async function withActivePage<T>(fn: (client: CDP.Client) => Promise<T>): Promise<T> {
  const target = await getActiveTarget();
  if (!target) throw new Error("No active tab");
  
  const client = await CDP({ port: CDP_PORT, target: target.id });
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

const PAGE_LOAD_TIMEOUT_MS = 5000;
const NAV_DETECT_MS = 100;

export async function withNavigation<T>(client: CDP.Client, action: () => Promise<T>): Promise<T> {
  await client.Page.enable();

  let navigating = false;
  let resolve: () => void;
  let reject: (err: Error) => void;
  const done = new Promise<void>((res, rej) => { resolve = res; reject = rej; });

  client.Page.navigatedWithinDocument(() => resolve());
  client.Page.frameNavigated(() => { navigating = true; });
  client.Page.loadEventFired(() => resolve());
  client.Page.frameStoppedLoading(() => resolve());

  const result = await action();

  await Promise.race([done, Bun.sleep(NAV_DETECT_MS)]);

  if (navigating) {
    const timeout = setTimeout(() => reject(new Error("Page load timeout")), PAGE_LOAD_TIMEOUT_MS);
    await done.finally(() => clearTimeout(timeout));
  }

  return result;
}

async function navigateWithPageLoad(client: CDP.Client, url: string): Promise<void> {
  await client.Page.enable();
  
  let timeoutId: Timer;
  const loaded = new Promise<void>((resolve, reject) => {
    client.Page.loadEventFired(() => {
      clearTimeout(timeoutId);
      resolve();
    });
    timeoutId = setTimeout(() => reject(new Error("Page load timeout")), PAGE_LOAD_TIMEOUT_MS);
  });

  await client.Page.navigate({ url });
  await loaded;
}

export async function ensureRunning(): Promise<void> {
  if (!await isRunning()) {
    await launch({});
  }
}

export type OnLaunchCallback = () => Promise<void>;
export type OnCloseCallback = () => Promise<void>;

let onLaunchCallback: OnLaunchCallback | null = null;
let onCloseCallback: OnCloseCallback | null = null;

export function setOnLaunch(cb: OnLaunchCallback): void {
  onLaunchCallback = cb;
}

export function setOnClose(cb: OnCloseCallback): void {
  onCloseCallback = cb;
}

export async function launch(options: { headless?: boolean }): Promise<string> {
  if (await isRunning()) {
    const state = await readState();
    return state?.activeTabId ?? "1";
  }

  await Bun.$`mkdir -p ${PROFILE_DIR}`.quiet();

  const browserPath = await getBrowserPath();
  const args = [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    "--no-first-run",
    "--no-default-browser-check",
  ];
  if (options.headless) args.push("--headless=new");

  spawn(browserPath, args, {
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
        if (onLaunchCallback) await onLaunchCallback();
        return page.id;
      }
    }
  }

  throw new Error("Failed to start browser");
}

export async function close(): Promise<void> {
  if (onCloseCallback) await onCloseCallback();
  const targets = await listTargets().catch(() => []);
  if (targets.length > 0) {
    const client = await CDP({ port: CDP_PORT, target: targets[0] });
    await client.Browser.close();
  }
  await clearState();
  await Bun.$`rm -rf ${PROFILE_DIR}`.quiet();
}

export async function openTab(url: string): Promise<{ tabId: string; url: string }> {
  const target = await CDP.New({ port: CDP_PORT });
  await writeState({ activeTabId: target.id });
  
  const client = await CDP({ port: CDP_PORT, target: target.id });
  try {
    await navigateWithPageLoad(client, url);
  } finally {
    await client.close();
  }
  return { tabId: target.id, url };
}

export async function navigate(url: string): Promise<void> {
  return withActivePage((client) => navigateWithPageLoad(client, url));
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

export type ScreenshotFormat = "png" | "jpeg" | "webp";

export async function captureScreenshot(format: ScreenshotFormat = "png"): Promise<string> {
  return withActivePage(async (client) => {
    const result = await client.Page.captureScreenshot({ format });
    return result.data;
  });
}

const SHORT_ID_LENGTH = 4;

export function toShortId(fullId: string): string {
  return fullId.slice(0, SHORT_ID_LENGTH).toLowerCase();
}

export async function resolveTabId(shortId: string): Promise<string | null> {
  const normalized = shortId.toLowerCase();
  const targets = await listTargets();
  const matches = targets.filter(t => t.type === "page" && t.id.toLowerCase().startsWith(normalized));
  if (matches.length === 1) return matches[0]!.id;
  return null;
}
