import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { removeMacosDownloadAttributes } from "../src/commands/update";
import { run, browser, browserFails } from "./helpers";

async function expectBrowserStarts(args: string): Promise<void> {
    await browser(args);
    expect(await browser("active")).toBeTruthy();
    await browser("stop");
}

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

    test("start with software rendering", async () => {
        await expectBrowserStarts("start --headless --software-rendering");
    });

    test("start with extra chrome arg", async () => {
        await expectBrowserStarts("start --headless --chrome-arg --disable-dev-shm-usage");
    });

    test("start with software rendering and extra chrome arg", async () => {
        await expectBrowserStarts("start --headless --software-rendering --chrome-arg --disable-dev-shm-usage");
    });

    test("rejects reserved chrome arg --remote-debugging-port", async () => {
        const output = await browserFails("start --headless --chrome-arg --remote-debugging-port=9333");
        expect(output).toContain("--remote-debugging-port");
    });

    test("rejects reserved chrome arg --user-data-dir", async () => {
        const output = await browserFails("start --headless --chrome-arg --user-data-dir=/tmp/evil");
        expect(output).toContain("--user-data-dir");
    });
});

describe("add-skill", () => {
    test("global install unsupported target", async () => {
        const { exitCode, stderr } = await run("add-skill --global cursor");
        expect(exitCode).toBe(1);
        expect(stderr).toContain("not supported");
    });
});

describe("update", () => {
    test("removes macOS download attributes", async () => {
        const target = Bun.fileURLToPath(new URL("../../../dist/browser-test", import.meta.url));
        const content = await Bun.file(Bun.fileURLToPath(new URL("../../../dist/browser", import.meta.url))).arrayBuffer();
        await Bun.write(target, content);
        await Bun.spawn(["chmod", "+x", target]).exited;
        await Bun.spawn(["xattr", "-w", "com.apple.provenance", "test", target]).exited;

        await removeMacosDownloadAttributes(target);

        const { exitCode, stdout } = await run("--version");
        expect(exitCode).toBe(0);
        expect(stdout).toBeTruthy();
    });
});
