import { homedir } from "node:os";
import { join } from "node:path";
import { existsSync } from "node:fs";

const CONFIG_FILE = join(homedir(), ".browser", "config.json");

const CHROME_PATHS: Record<string, string[]> = {
    darwin: [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
    ],
    win32: [
        join(process.env.PROGRAMFILES ?? "C:\\Program Files", "Google/Chrome/Application/chrome.exe"),
        join(process.env["PROGRAMFILES(X86)"] ?? "C:\\Program Files (x86)", "Google/Chrome/Application/chrome.exe"),
        join(homedir(), "AppData/Local/Google/Chrome/Application/chrome.exe"),
    ],
    linux: [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/snap/bin/chromium",
    ],
};

export interface Config {
    browserPath?: string;
    persistentProfile?: boolean;
    profileDir?: string;
    telemetry?: boolean;
    telemetryId?: string;
}

export async function getConfig(): Promise<Config> {
    try {
        return await Bun.file(CONFIG_FILE).json();
    } catch {
        return {};
    }
}

export async function setConfig<K extends keyof Config>(key: K, value: Config[K]): Promise<void> {
    if (key === "browserPath" && !existsSync(value as string)) {
        throw new Error(`Browser path does not exist: ${value}`);
    }
    if (key === "profileDir" && !existsSync(value as string)) {
        throw new Error(`Profile directory does not exist: ${value}`);
    }
    const config = await getConfig();
    config[key] = value;
    await Bun.write(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function unsetConfig(key: keyof Config): Promise<void> {
    const config = await getConfig();
    delete config[key];
    await Bun.write(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export async function getBrowserPath(): Promise<string> {
    const config = await getConfig();
    if (config.browserPath) return config.browserPath;

    const platform = process.platform === "win32" ? "win32" : process.platform === "darwin" ? "darwin" : "linux";
    for (const p of CHROME_PATHS[platform]!) {
        if (existsSync(p)) return p;
    }

    throw new Error(
        "Chrome not found. Install Google Chrome or set a custom browser path:\n  browser config set browserPath /path/to/browser",
    );
}

const PERSISTENT_PROFILE_DIR = join(homedir(), ".browser", "profile");
const TEMP_PROFILE_DIR = "/tmp/browser-cli-profile";

export async function getProfileDir(): Promise<{ dir: string; persistent: boolean }> {
    const config = await getConfig();
    if (config.persistentProfile === false) {
        return { dir: TEMP_PROFILE_DIR, persistent: false };
    }
    return { dir: config.profileDir ?? PERSISTENT_PROFILE_DIR, persistent: true };
}

export async function clearProfile(): Promise<string> {
    const { dir } = await getProfileDir();
    await Bun.$`rm -rf ${dir}`.quiet();
    return dir;
}
