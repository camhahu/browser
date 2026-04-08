import CDP from "chrome-remote-interface";
import { spawn } from "node:child_process";
import { openSync, closeSync } from "node:fs";
import { join } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { getBrowserPath, getProfileDir, BROWSER_DIR } from "./config";

const STATE_FILE = join(BROWSER_DIR, "state.json");
const LAUNCH_ERROR_FILE = join(BROWSER_DIR, "launch-error.log");
export const CDP_PORT = 9222;
const LAUNCH_TIMEOUT_MS = 5000;
const LAUNCH_POLL_INTERVAL_MS = 100;

interface State {
    activeTabId: string;
    sessionId: string;
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
    await rm(STATE_FILE, { force: true });
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

export async function getActiveTarget(): Promise<CDP.Target | null> {
    const state = await readState();
    if (!state?.activeTabId) return null;
    const targets = await listTargets();
    const target = targets.find((t) => t.id === state.activeTabId);
    if (!target) {
        throw new Error(
            "Active tab was closed. Use `browser tabs` to see available tabs and `browser use <id>` to select one.",
        );
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
    const done = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    client.Page.navigatedWithinDocument(() => resolve());
    client.Page.frameNavigated(() => {
        navigating = true;
    });
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
    if (!(await isRunning())) {
        await launch({ headless: true });
    }
}

export type OnLaunchCallback = () => Promise<void>;
export type OnCloseCallback = () => Promise<void>;

const onLaunchCallbacks: OnLaunchCallback[] = [];
const onCloseCallbacks: OnCloseCallback[] = [];

export function addOnLaunch(cb: OnLaunchCallback): void {
    onLaunchCallbacks.push(cb);
}

export function addOnClose(cb: OnCloseCallback): void {
    onCloseCallbacks.push(cb);
}

const SOFTWARE_RENDERING_ARGS = ["--disable-gpu", "--use-gl=swiftshader"];
const MANAGED_CHROME_ARGS = ["--remote-debugging-port", "--remote-debugging-pipe", "--user-data-dir"];

function needsNoSandbox(): boolean {
    return process.platform === "linux" && typeof process.getuid === "function" && process.getuid() === 0;
}

export function findManagedChromeArg(args: string[]): string | null {
    for (const arg of args) {
        const flag = arg.split("=")[0];
        if (MANAGED_CHROME_ARGS.includes(flag)) return flag;
    }

    return null;
}

export async function launch(options: {
    headless?: boolean;
    softwareRendering?: boolean;
    extraArgs?: string[];
}): Promise<string> {
    if (await isRunning()) {
        const state = await readState();
        return state?.activeTabId ?? "1";
    }

    const { dir: profileDir } = await getProfileDir();
    await mkdir(profileDir, { recursive: true });

    const browserPath = await getBrowserPath();
    const args = [
        `--remote-debugging-port=${CDP_PORT}`,
        `--user-data-dir=${profileDir}`,
        "--no-first-run",
        "--no-default-browser-check",
    ];
    if (options.headless) args.push("--headless=new");
    if (options.softwareRendering) args.push(...SOFTWARE_RENDERING_ARGS);
    if (needsNoSandbox()) args.push("--no-sandbox");
    if (options.extraArgs?.length) args.push(...options.extraArgs);

    await rm(LAUNCH_ERROR_FILE, { force: true });
    const launchErrorFd = openSync(LAUNCH_ERROR_FILE, "w");
    spawn(browserPath, args, {
        detached: true,
        stdio: ["ignore", "ignore", launchErrorFd],
    }).unref();
    closeSync(launchErrorFd);

    const maxAttempts = LAUNCH_TIMEOUT_MS / LAUNCH_POLL_INTERVAL_MS;
    for (let i = 0; i < maxAttempts; i++) {
        await Bun.sleep(LAUNCH_POLL_INTERVAL_MS);
        if (await isRunning()) {
            const targets = await listTargets();
            const page = targets.find((t) => t.type === "page");
            if (page) {
                await writeState({ activeTabId: page.id, sessionId: crypto.randomUUID() });
                const client = await CDP({ port: CDP_PORT, target: page.id });
                await client.Emulation.setDeviceMetricsOverride({
                    width: 1920,
                    height: 1080,
                    deviceScaleFactor: 1,
                    mobile: false,
                });
                await client.close();
                await rm(LAUNCH_ERROR_FILE, { force: true });
                for (const cb of onLaunchCallbacks) await cb();
                return page.id;
            }
        }
    }

    const launchError = (await Bun.file(LAUNCH_ERROR_FILE).text()).trim();
    await rm(LAUNCH_ERROR_FILE, { force: true });
    throw new Error(launchError ? `Failed to start browser:\n${launchError}` : "Failed to start browser");
}

export async function close(): Promise<string | null> {
    const state = await readState();
    const sessionId = state?.sessionId ?? null;
    for (const cb of onCloseCallbacks) await cb();
    const targets = await listTargets().catch(() => []);
    if (targets.length > 0) {
        const client = await CDP({ port: CDP_PORT, target: targets[0] });
        await client.Browser.close();
        await Bun.sleep(100);
    }
    await clearState();
    const { dir: profileDir, persistent } = await getProfileDir();
    if (!persistent) {
        await rm(profileDir, { recursive: true, force: true });
    }
    return sessionId;
}

export async function openTab(url: string): Promise<{ tabId: string; url: string }> {
    const target = await CDP.New({ port: CDP_PORT });
    const state = await readState();
    await writeState({ activeTabId: target.id, sessionId: state?.sessionId ?? "" });

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

export async function getTabs(): Promise<{
    activeTabId: string;
    tabs: { id: string; url: string; title: string }[];
}> {
    const state = await readState();
    const targets = await listTargets();
    const tabs = targets.filter((t) => t.type === "page").map((t) => ({ id: t.id, url: t.url, title: t.title }));
    return { activeTabId: state?.activeTabId ?? tabs[0]?.id ?? "", tabs };
}

export async function useTab(tabId: string): Promise<boolean> {
    const targets = await listTargets();
    const target = targets.find((t) => t.id === tabId);
    if (!target) return false;
    const state = await readState();
    await writeState({ activeTabId: tabId, sessionId: state?.sessionId ?? "" });
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
            const next = targets.find((t) => t.type === "page" && t.id !== id);
            await writeState({ activeTabId: next?.id ?? "", sessionId: state?.sessionId ?? "" });
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

export async function getSessionId(): Promise<string | null> {
    const state = await readState();
    return state?.sessionId ?? null;
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
    const matches = targets.filter((t) => t.type === "page" && t.id.toLowerCase().startsWith(normalized));
    if (matches.length === 1) return matches[0]!.id;
    return null;
}
