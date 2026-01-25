import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { homedir } from "node:os";
import { join } from "node:path";
import { run } from "./helpers";

const CONFIG_FILE = join(homedir(), ".browser", "config.json");

async function getConfig(): Promise<Record<string, unknown>> {
    try {
        return await Bun.file(CONFIG_FILE).json();
    } catch {
        return {};
    }
}

async function setConfig(config: Record<string, unknown>): Promise<void> {
    await Bun.write(CONFIG_FILE, JSON.stringify(config, null, 2));
}

describe("telemetry", () => {
    let originalConfig: Record<string, unknown>;

    beforeAll(async () => {
        originalConfig = await getConfig();
        await setConfig({ ...originalConfig, telemetryPrompted: true });
    });

    afterAll(async () => {
        await setConfig(originalConfig);
    });

    test("config telemetry shows status", async () => {
        await setConfig({ ...originalConfig, telemetryPrompted: true, telemetry: true });
        const { stdout: on } = await run("config telemetry");
        expect(on).toBe("on");

        await setConfig({ ...originalConfig, telemetryPrompted: true, telemetry: false });
        const { stdout: off } = await run("config telemetry");
        expect(off).toBe("off");
    });

    test("config telemetry on/off sets value", async () => {
        await run("config telemetry on");
        let config = await getConfig();
        expect(config.telemetry).toBe(true);

        await run("config telemetry off");
        config = await getConfig();
        expect(config.telemetry).toBe(false);
    });

    test("--no-telemetry flag is available", async () => {
        const { stdout } = await run("--help");
        expect(stdout).toContain("--no-telemetry");
        expect(stdout).toContain("Disable telemetry");
    });
});
