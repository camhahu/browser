import { chromium, type Browser, type Page } from "playwright";
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

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

export async function launch(options: { headless?: boolean; profile?: string }): Promise<number> {
  const profile = options.profile ?? DEFAULT_PROFILE;
  if (!existsSync(profile)) mkdirSync(profile, { recursive: true });

  const context = await chromium.launchPersistentContext(profile, {
    headless: options.headless ?? false,
    args: [`--remote-debugging-port=${CDP_PORT}`],
  });

  if (context.pages().length === 0) await context.newPage();

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
  const conn = await connect();
  if (conn) {
    await conn.browser.close();
  }
  clearState();
}

export function updateState(state: State): void {
  writeState(state);
}

export function getState(): State | null {
  return readState();
}
