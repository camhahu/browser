import { PostHog } from "posthog-node";
import { getConfig, setConfig } from "./config";

const POSTHOG_API_KEY = "phc_z9EynXrTvFcwt62vrYWFCrBXjX6ukIgpk3L4HHVXArk";
const POSTHOG_HOST = "https://us.i.posthog.com";

let client: PostHog | null = null;

function getClient(): PostHog {
    if (!client) {
        client = new PostHog(POSTHOG_API_KEY, {
            host: POSTHOG_HOST,
            flushAt: 1,
            flushInterval: 0,
        });
    }
    return client;
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

async function send(event: string, properties: Record<string, unknown>): Promise<void> {
    if (!(await isTelemetryEnabled())) return;
    const distinctId = await getTelemetryId();
    getClient().capture({
        distinctId,
        event,
        properties: {
            $lib: "browser-cli",
            $lib_version: process.env.VERSION ?? "0.0.0-dev",
            os: process.platform,
            arch: process.arch,
            ...properties,
        },
    });
}

export function capture(event: string, properties: Record<string, unknown> = {}): void {
    send(event, properties).catch(() => {});
}

export function captureError(error: Error): void {
    send("error", {
        error_message: error.message,
        error_name: error.name,
        error_stack: error.stack,
    }).catch(() => {});
}

export async function flush(): Promise<void> {
    if (!(await isTelemetryEnabled())) return;
    if (client) {
        await client.shutdown();
        client = null;
    }
}
