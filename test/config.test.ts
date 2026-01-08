import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { run, browser, browserFails } from "./helpers";

const PERSISTENT_PROFILE_DIR = join(homedir(), ".browser", "profile");
const TEMP_PROFILE_DIR = "/tmp/browser-cli-profile";

describe("config", () => {
    beforeAll(async () => {
        await run("stop").catch(() => {});
        await run("config unset persistentProfile").catch(() => {});
        await run("config unset profileDir").catch(() => {});
    });

    afterAll(async () => {
        await run("stop").catch(() => {});
        await run("config unset persistentProfile").catch(() => {});
        await run("config unset profileDir").catch(() => {});
    });

    test("persistentProfile accepts true/false", async () => {
        await browser("config set persistentProfile true");
        expect(await browser("config persistentProfile")).toBe("true");

        await browser("config set persistentProfile false");
        expect(await browser("config persistentProfile")).toBe("false");

        await browser("config unset persistentProfile");
    });

    test("persistentProfile rejects invalid values", async () => {
        const err = await browserFails("config set persistentProfile invalid");
        expect(err).toContain("'true' or 'false'");
    });

    test("profileDir rejects non-existent path", async () => {
        const err = await browserFails("config set profileDir /nonexistent/path");
        expect(err).toContain("does not exist");
    });

    test("ephemeral profile is deleted on stop", async () => {
        await run("config unset persistentProfile");
        await browser("start --headless");
        expect(existsSync(TEMP_PROFILE_DIR)).toBe(true);

        await browser("stop");
        expect(existsSync(TEMP_PROFILE_DIR)).toBe(false);
    });

    test("persistent profile is preserved on stop", async () => {
        await browser("config set persistentProfile true");
        await browser("start --headless");
        expect(existsSync(PERSISTENT_PROFILE_DIR)).toBe(true);

        await browser("stop");
        expect(existsSync(PERSISTENT_PROFILE_DIR)).toBe(true);

        await browser("config unset persistentProfile");
    });
});
