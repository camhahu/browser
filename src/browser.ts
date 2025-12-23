import { chromium, type Browser, type Page } from "playwright";
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const STATE_FILE = "/tmp/browser-cli.json";
const DEFAULT_PROFILE = join(homedir(), ".browser");
const CDP_PORT = 9222;

interface State {
  activeTabId: number;
  nextTabId: number;
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

export async function launch(options: { headless?: boolean; profile?: string }): Promise<number> {
  // Check if already running
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

  // Spawn detached so it survives CLI exit
  const child = spawn(chromiumPath, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();

  // Wait for CDP to be ready
  for (let i = 0; i < 50; i++) {
    await Bun.sleep(100);
    try {
      await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
      break;
    } catch {
      // Keep waiting
    }
  }

  writeState({ activeTabId: 1, nextTabId: 2 });
  return 1;
}

export async function connect(): Promise<{ browser: Browser; pages: Page[]; state: State } | null> {
  const state = readState();
  if (!state) return null;

  try {
    const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
    const pages = browser.contexts()[0]?.pages() ?? [];
    return { browser, pages, state };
  } catch {
    clearState();
    return null;
  }
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

export function updateState(state: State): void {
  writeState(state);
}

export function getState(): State | null {
  return readState();
}
