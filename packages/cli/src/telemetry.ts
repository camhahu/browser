import { getConfig, setConfig } from "./config";
import { getSessionId } from "./cdp";

const POSTHOG_API_KEY = "phc_z9EynXrTvFcwt62vrYWFCrBXjX6ukIgpk3L4HHVXArk";
const POSTHOG_HOST = "https://us.i.posthog.com";

async function getTelemetryId(): Promise<string> {
    const config = await getConfig();
    if (config.telemetryId) return config.telemetryId;
    const id = crypto.randomUUID();
    await setConfig("telemetryId", id);
    return id;
}

let noTelemetryFlag = false;

export function setNoTelemetryFlag(value: boolean): void {
    noTelemetryFlag = value;
}

export async function isTelemetryConfigured(): Promise<boolean> {
    const config = await getConfig();
    return config.telemetry !== false;
}

export async function isTelemetryEnabled(): Promise<boolean> {
    if (noTelemetryFlag) return false;
    if (process.env.BROWSER_TELEMETRY === "0") return false;
    if (process.env.CI) return false;
    return isTelemetryConfigured();
}

export async function setTelemetryEnabled(enabled: boolean): Promise<void> {
    await setConfig("telemetry", enabled);
}

async function send(event: string, properties: Record<string, unknown>): Promise<void> {
    if (!(await isTelemetryEnabled())) return;
    const distinctId = await getTelemetryId();
    const sessionId = await getSessionId();
    fetch(`${POSTHOG_HOST}/capture/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            api_key: POSTHOG_API_KEY,
            event,
            properties: {
                distinct_id: distinctId,
                session_id: sessionId,
                $lib: "browser-cli",
                $lib_version: process.env.VERSION ?? "0.0.0-dev",
                os: process.platform,
                arch: process.arch,
                ...properties,
            },
            timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(5000),
    }).catch(() => {});
}

export function capture(event: string, properties: Record<string, unknown> = {}): void {
    send(event, properties).catch(() => {});
}

export function captureError(error: Error): void {
    send("error", {
        error_name: error.name,
    }).catch(() => {});
}

export async function flush(): Promise<void> {
}
