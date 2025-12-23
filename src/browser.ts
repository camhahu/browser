import { chromium, type Browser, type Page } from "playwright";
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";

const STATE_FILE = "/tmp/browser-cli.json";

interface State {
  wsEndpoint: string;
  activeTabId: number;
}

async function readState(): Promise<State | null> {
  try {
    const file = Bun.file(STATE_FILE);
    return await file.json();
  } catch {
    return null;
  }
}

async function writeState(state: State): Promise<void> {
  await Bun.write(STATE_FILE, JSON.stringify(state));
}

export async function clearState(): Promise<void> {
  try {
    const { unlink } = await import("node:fs/promises");
    await unlink(STATE_FILE);
  } catch {
    // File doesn't exist
  }
}

async function connectToBrowser(wsEndpoint: string): Promise<Browser | null> {
  try {
    return await chromium.connect(wsEndpoint);
  } catch {
    return null;
  }
}

function getPages(browser: Browser): Page[] {
  return browser.contexts()[0]?.pages() ?? [];
}

export async function launch(options: { headless?: boolean }): Promise<number> {
  // Check if already running
  const state = await readState();
  if (state) {
    const browser = await connectToBrowser(state.wsEndpoint);
    if (browser) {
      return state.activeTabId;
    }
    await clearState();
  }

  // Launch daemon process
  const daemonPath = join(dirname(import.meta.path), "daemon.ts");
  const args = options.headless ? ["--headless"] : [];
  
  const child = spawn("bun", ["run", daemonPath, ...args], {
    detached: true,
    stdio: ["ignore", "pipe", "ignore"],
  });
  child.unref();

  // Wait for daemon to write state file
  return new Promise((resolve, reject) => {
    let output = "";
    const cleanup = () => {
      child.stdout!.destroy();
    };
    child.stdout!.on("data", (data) => {
      output += data.toString();
      if (output.includes("READY")) {
        cleanup();
        resolve(1);
      }
    });
    child.on("error", (err) => {
      cleanup();
      reject(err);
    });
    child.on("exit", (code) => {
      cleanup();
      if (code !== 0) reject(new Error(`Daemon exited with code ${code}`));
    });
    setTimeout(() => {
      cleanup();
      reject(new Error("Timeout waiting for browser"));
    }, 10000);
  });
}

export async function connect(): Promise<{ browser: Browser; pages: Page[]; state: State } | null> {
  const state = await readState();
  if (!state) return null;

  const browser = await connectToBrowser(state.wsEndpoint);
  if (!browser) {
    await clearState();
    return null;
  }

  return { browser, pages: getPages(browser), state };
}

export async function close(): Promise<void> {
  const state = await readState();
  if (state) {
    const browser = await connectToBrowser(state.wsEndpoint);
    if (browser) {
      await browser.close();
    }
  }
  await clearState();
}

export async function openTab(url: string): Promise<{ tabId: number; url: string }> {
  const conn = await connect();
  if (!conn) throw new Error("No browser session");

  const context = conn.browser.contexts()[0] ?? await conn.browser.newContext();
  const page = await context.newPage();
  await page.goto(url);

  const tabId = getPages(conn.browser).length;
  await writeState({ ...conn.state, activeTabId: tabId });

  return { tabId, url };
}

export async function getTabs(): Promise<{ activeTabId: number; tabs: { id: number; url: string; title: string }[] }> {
  const conn = await connect();
  if (!conn) throw new Error("No browser session");

  const tabs = await Promise.all(
    conn.pages.map(async (page, i) => ({
      id: i + 1,
      url: page.url(),
      title: await page.title(),
    }))
  );

  return { activeTabId: conn.state.activeTabId, tabs };
}

export async function useTab(tabId: number): Promise<boolean> {
  const conn = await connect();
  if (!conn) throw new Error("No browser session");

  if (tabId < 1 || tabId > conn.pages.length) {
    return false;
  }

  await writeState({ ...conn.state, activeTabId: tabId });
  return true;
}

export async function closeTab(tabId?: number): Promise<number | null> {
  const conn = await connect();
  if (!conn) throw new Error("No browser session");

  const id = tabId ?? conn.state.activeTabId;
  const page = conn.pages[id - 1];
  if (!page) return null;

  await page.close();

  const remaining = conn.pages.length - 1;
  let newActive = conn.state.activeTabId;
  if (id === conn.state.activeTabId) {
    newActive = Math.min(id, remaining) || 1;
  } else if (id < conn.state.activeTabId) {
    newActive = conn.state.activeTabId - 1;
  }

  await writeState({ ...conn.state, activeTabId: newActive });
  return id;
}

export async function getActivePage(): Promise<Page> {
  const conn = await connect();
  if (!conn) throw new Error("No browser session");

  const page = conn.pages[conn.state.activeTabId - 1];
  if (!page) throw new Error("No active tab");

  return page;
}

export async function getActiveTabId(): Promise<number | null> {
  const state = await readState();
  return state?.activeTabId ?? null;
}
