import { getConfig, setConfig } from "./config";
import { isTelemetryEnabled, setTelemetryEnabled } from "./telemetry";

export async function maybeShowTelemetryPrompt(): Promise<void> {
    if (!process.stdin.isTTY || !process.stdout.isTTY) return;
    if (!(await isTelemetryEnabled())) return;

    const config = await getConfig();
    if (config.telemetryPrompted) return;

    const version = process.env.VERSION ?? "0.0.0-dev";

    console.log(`Welcome to browser v${version}!

We collect anonymous usage data to improve your experience.
This includes: command usage, performance metrics, errors.
We NEVER collect: URLs, page content, file paths, or personal data.

View exactly what we collect: https://github.com/camhahu/browser/blob/main/docs/TELEMETRY.md

Continue with telemetry? [Y/n] `);

    const answer = await readLine();
    const enabled = answer.toLowerCase() !== "n";

    await setTelemetryEnabled(enabled);
    await setConfig("telemetryPrompted", true);

    if (enabled) {
        console.log("Telemetry enabled. Disable anytime: browser config telemetry off\n");
    } else {
        console.log("Telemetry disabled.\n");
    }
}

async function readLine(): Promise<string> {
    const buf = Buffer.alloc(1024);
    const n = await new Promise<number>((resolve) => {
        process.stdin.once("readable", () => {
            const chunk = process.stdin.read();
            if (chunk) {
                chunk.copy(buf);
                resolve(chunk.length);
            } else {
                resolve(0);
            }
        });
    });
    return buf.toString("utf-8", 0, n).trim();
}
