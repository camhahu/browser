import { chromium, type Browser, type Page } from "playwright";
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const STATE_FILE = "/tmp/browser-cli.json";
const DEFAULT_PROFILE = join(homedir(), ".browser");
const CDP_PORT = 9222;

// Maps our stable tab IDs to CDP target IDs
interface State {
  activeTabId: number;
  nextTabId: number;
  tabs: Record<number, string>; // tabId -> targetId
}

function readState(): State | null {
  try {
    return JSON.parse(readFileSync(STATE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

function writeState(state: State): void {
  writeFileSync(STATE_FILE, JSON.stringify(state));
}

export function clearState(): void {
  if (existsSync(STATE_FILE)) unlinkSync(STATE_FILE);
}

function getChromiumPath(): string {
  const cacheDir = join(homedir(), "Library/Caches/ms-playwright");
  const dirs = Bun.spawnSync(["ls", cacheDir]).stdout.toString().split("\n");
  const chromiumDir = dirs.find(d => d.startsWith("chromium-") && !d.includes("headless"));
  if (!chromiumDir) throw new Error("Chromium not found");
  return join(cacheDir, chromiumDir, "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
}

function getTargetId(page: Page): string {
  // Extract target ID from internal Playwright structure
  // @ts-expect-error accessing internal property
  return page._mainFrame._page._delegate._targetId;
}

export async function launch(options: { headless?: boolean; profile?: string }): Promise<number> {
  const existing = await connect();
  if (existing) {
    return existing.state.activeTabId;
  }

  const profile = options.profile ?? DEFAULT_PROFILE;
  if (!existsSync(profile)) mkdirSync(profile, { recursive: true });

  const chromiumPath = getChromiumPath();
  const args = [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
  ];
  if (options.headless) args.push("--headless=new");

  const child = spawn(chromiumPath, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  // Wait for CDP to be ready
  let browser: Browser | null = null;
  for (let i = 0; i < 50; i++) {
    await Bun.sleep(100);
    try {
      browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
      break;
    } catch {
      // Keep waiting
    }
  }

  if (!browser) throw new Error("Failed to connect to browser");

  const pages = browser.contexts()[0]?.pages() ?? [];
  const firstPage = pages[0];
  if (!firstPage) throw new Error("No page found");

  const targetId = getTargetId(firstPage);
  writeState({ activeTabId: 1, nextTabId: 2, tabs: { 1: targetId } });

  return 1;
}

export async function connect(): Promise<{ browser: Browser; state: State } | null> {
  const state = readState();
  if (!state) return null;

  try {
    const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
    return { browser, state };
  } catch {
    clearState();
    return null;
  }
}

function findPageByTargetId(browser: Browser, targetId: string): Page | null {
  const pages = browser.contexts()[0]?.pages() ?? [];
  return pages.find(p => getTargetId(p) === targetId) ?? null;
}

export async function close(): Promise<void> {
  try {
    const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
    await browser.close();
  } catch {
    // Already closed
  }
  clearState();
}

export async function openTab(url: string): Promise<{ tabId: number; url: string }> {
  const conn = await connect();
  if (!conn) throw new Error("No browser session");

  const context = conn.browser.contexts()[0];
  if (!context) throw new Error("No browser context");

  const page = await context.newPage();
  await page.goto(url);

  const tabId = conn.state.nextTabId;
  const targetId = getTargetId(page);

  conn.state.tabs[tabId] = targetId;
  conn.state.activeTabId = tabId;
  conn.state.nextTabId = tabId + 1;
  writeState(conn.state);

  return { tabId, url };
}

export async function getTabs(): Promise<{ activeTabId: number; tabs: { id: number; url: string; title: string }[] }> {
  const conn = await connect();
  if (!conn) throw new Error("No browser session");

  const tabs: { id: number; url: string; title: string }[] = [];

  for (const [idStr, targetId] of Object.entries(conn.state.tabs)) {
    const page = findPageByTargetId(conn.browser, targetId);
    if (page) {
      tabs.push({
        id: Number(idStr),
        url: page.url(),
        title: await page.title(),
      });
    }
  }

  tabs.sort((a, b) => a.id - b.id);
  return { activeTabId: conn.state.activeTabId, tabs };
}

export async function useTab(tabId: number): Promise<boolean> {
  const conn = await connect();
  if (!conn) throw new Error("No browser session");

  const targetId = conn.state.tabs[tabId];
  if (!targetId) return false;

  const page = findPageByTargetId(conn.browser, targetId);
  if (!page) return false;

  conn.state.activeTabId = tabId;
  writeState(conn.state);
  return true;
}

export async function closeTab(tabId?: number): Promise<number | null> {
  const conn = await connect();
  if (!conn) throw new Error("No browser session");

  const targetId = tabId ?? conn.state.activeTabId;
  const targetIdStr = conn.state.tabs[targetId];
  if (!targetIdStr) return null;

  const page = findPageByTargetId(conn.browser, targetIdStr);
  if (!page) return null;

  await page.close();
  delete conn.state.tabs[targetId];

  // Update active tab if we closed it
  if (conn.state.activeTabId === targetId) {
    const remainingIds = Object.keys(conn.state.tabs).map(Number).sort((a, b) => a - b);
    conn.state.activeTabId = remainingIds[0] ?? 0;
  }

  writeState(conn.state);
  return targetId;
}

export async function getActivePage(): Promise<Page> {
  const conn = await connect();
  if (!conn) throw new Error("No browser session");

  const targetId = conn.state.tabs[conn.state.activeTabId];
  if (!targetId) throw new Error("No active tab");

  const page = findPageByTargetId(conn.browser, targetId);
  if (!page) throw new Error("Active tab not found");

  return page;
}

export function getActiveTabId(): number | null {
  const state = readState();
  return state?.activeTabId ?? null;
}
