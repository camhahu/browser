import CDP from "chrome-remote-interface";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const STATE_FILE = "/tmp/browser-cli.json";
const DEFAULT_PROFILE = join(homedir(), ".browser");
const CDP_PORT = 9222;

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
  try {
    await Bun.$`rm -f ${STATE_FILE}`.quiet();
  } catch {}
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

async function isRunning(): Promise<boolean> {
  try {
    await listTargets();
    return true;
  } catch {
    return false;
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

  // Wait for CDP
  for (let i = 0; i < 50; i++) {
    await Bun.sleep(100);
    if (await isRunning()) {
      const targets = await listTargets();
      const page = targets.find(t => t.type === "page");
      if (page) {
        await writeState({ activeTabId: page.id });
        return page.id;
      }
    }
  }

  throw new Error("Failed to start browser");
}

export async function close(): Promise<void> {
  try {
    const targets = await listTargets();
    if (targets.length > 0) {
      const client = await CDP({ port: CDP_PORT, target: targets[0] });
      await client.Browser.close();
    }
  } catch {}
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
      const next = targets.find(t => t.type === "page");
      await writeState({ activeTabId: next?.id ?? "" });
    }
    return id;
  } catch {
    return null;
  }
}

async function withActivePage<T>(fn: (client: CDP.Client) => Promise<T>): Promise<T> {
  const state = await readState();
  if (!state?.activeTabId) throw new Error("No active tab");
  
  const client = await CDP({ port: CDP_PORT, target: state.activeTabId });
  try {
    return await fn(client);
  } finally {
    await client.close();
  }
}

export async function getUrl(): Promise<string> {
  const state = await readState();
  const targets = await listTargets();
  const target = targets.find(t => t.id === state?.activeTabId);
  return target?.url ?? "";
}

export async function getTitle(): Promise<string> {
  const state = await readState();
  const targets = await listTargets();
  const target = targets.find(t => t.id === state?.activeTabId);
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
      expression: `document.querySelector(${JSON.stringify(selector)})?.click()`,
      awaitPromise: true,
    });
    if (result.subtype === "error") throw new Error(`Failed to click: ${selector}`);
  });
}

export async function type(text: string, selector: string): Promise<void> {
  return withActivePage(async (client) => {
    await client.Runtime.enable();
    const { result } = await client.Runtime.evaluate({
      expression: `(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        if (!el) throw new Error("Element not found");
        el.value = ${JSON.stringify(text)};
        el.dispatchEvent(new Event("input", { bubbles: true }));
      })()`,
      awaitPromise: true,
    });
    if (result.subtype === "error") throw new Error(`Failed to type: ${selector}`);
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
