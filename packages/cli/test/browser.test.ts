import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { run, browser } from "./helpers";

describe("browser", () => {
    beforeAll(async () => {
        await run("stop").catch(() => {});
    });

    afterAll(async () => {
        await run("stop");
    });

    test("version", async () => {
        const pkg = await Bun.file(Bun.fileURLToPath(new URL("../package.json", import.meta.url))).json();
        const version = typeof pkg.version === "string" ? pkg.version : "";
        expect(await browser("--version")).toBe(version);
    });

    test("start and stop", async () => {
        await browser("start --headless");
        const active = await browser("active");
        expect(active).toBeTruthy();

        await browser("stop");
        const { exitCode } = await run("active");
        expect(exitCode).toBe(1);
    });
});

describe("add-skill", () => {
    test("global install unsupported target", async () => {
        const { exitCode, stderr } = await run("add-skill --global cursor");
        expect(exitCode).toBe(1);
        expect(stderr).toContain("not supported");
    });
});
