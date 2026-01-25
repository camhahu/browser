import { homedir } from "node:os";
import { join } from "node:path";
import { getConfig, setConfig } from "./config";

const POSTHOG_API_KEY = "phc_z9EynXrTvFcwt62vrYWFCrBXjX6ukIgpk3L4HHVXArk";
const POSTHOG_HOST = "https://us.i.posthog.com";
const EVENTS_FILE = join(homedir(), ".browser", "events.json");

interface Event {
    event: string;
    properties: Record<string, unknown>;
    timestamp: string;
}

async function getTelemetryId(): Promise<string> {
    const config = await getConfig();
    if (config.telemetryId) return config.telemetryId;
    const id = crypto.randomUUID();
    await setConfig("telemetryId", id);
    return id;
}

export async function isTelemetryEnabled(): Promise<boolean> {
    if (process.env.BROWSER_TELEMETRY === "0") return false;
    const config = await getConfig();
    return config.telemetry !== false;
}

export async function setTelemetryEnabled(enabled: boolean): Promise<void> {
    await setConfig("telemetry", enabled);
}

async function readEvents(): Promise<Event[]> {
    try {
        return await Bun.file(EVENTS_FILE).json();
    } catch {
        return [];
    }
}

async function writeEvents(events: Event[]): Promise<void> {
    await Bun.$`mkdir -p ${join(homedir(), ".browser")}`.quiet();
    await Bun.write(EVENTS_FILE, JSON.stringify(events));
}

let pending: Promise<void> | null = null;

export function capture(event: string, properties: Record<string, unknown> = {}): void {
    const promise = captureAsync(event, properties);
    pending = pending ? pending.then(() => promise) : promise;
    pending.catch(() => {});
}

async function captureAsync(event: string, properties: Record<string, unknown>): Promise<void> {
    if (!(await isTelemetryEnabled())) return;
    const events = await readEvents();
    events.push({ event, properties, timestamp: new Date().toISOString() });
    await writeEvents(events);
}

async function waitForPending(): Promise<void> {
    if (pending) await pending.catch(() => {});
}

export async function flush(): Promise<void> {
    await waitForPending();
    if (!(await isTelemetryEnabled())) return;

    const events = await readEvents();
    if (events.length === 0) return;

    const distinctId = await getTelemetryId();
    const batch = events.map((e) => ({
        event: e.event,
        properties: {
            distinct_id: distinctId,
            $lib: "browser-cli",
            $lib_version: process.env.VERSION ?? "0.0.0-dev",
            os: process.platform,
            arch: process.arch,
            ...e.properties,
        },
        timestamp: e.timestamp,
    }));

    try {
        const res = await fetch(`${POSTHOG_HOST}/batch/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ api_key: POSTHOG_API_KEY, batch }),
            signal: AbortSignal.timeout(5000),
        });
        if (res.ok) await writeEvents([]);
    } catch {}
}
