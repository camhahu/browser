import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { removeMacosDownloadAttributes } from "../src/commands/update";
import { run, browser, browserFails } from "./helpers";

async function writeFakeBrowser(path: string, message: string): Promise<void> {
    if (process.platform === "win32") {
        await Bun.write(path, `@echo off\r\necho ${message} 1>&2\r\nexit /b 1\r\n`);
        return;
    }

    await Bun.write(path, `#!/bin/sh\nprintf "%s\\n" "${message}" >&2\nexit 1\n`);
    await Bun.spawn(["chmod", "+x", path]).exited;
}

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

    test("shows browser launch stderr when Chromium exits immediately", async () => {
        const dir = join(tmpdir(), `browser-cli-launch-${crypto.randomUUID()}`);
        const fakeBrowserPath = join(dir, process.platform === "win32" ? "fake-browser.cmd" : "fake-browser");
        const configuredBrowserPath = await run("config browserPath");
        const message = "Running as root without --no-sandbox is not supported.";

        await mkdir(dir, { recursive: true });
        await writeFakeBrowser(fakeBrowserPath, message);

        try {
            await browser(`config set browserPath ${fakeBrowserPath}`);
            const output = await browserFails("start --headless");
            expect(output).toContain(message);
        } finally {
            if (configuredBrowserPath.exitCode === 0 && configuredBrowserPath.stdout) {
                await browser(`config set browserPath ${configuredBrowserPath.stdout}`);
            } else {
                await run("config unset browserPath");
            }
            await rm(dir, { recursive: true, force: true });
        }
    }, 10000);
});

describe("add-skill", () => {
    test("global install unsupported target", async () => {
        const { exitCode, stderr } = await run("add-skill --global cursor");
        expect(exitCode).toBe(1);
        expect(stderr).toContain("not supported");
    });
});

describe("update", () => {
    if (process.platform === "darwin") {
        test("removes macOS download attributes", async () => {
            const target = Bun.fileURLToPath(new URL("../../../dist/browser-test", import.meta.url));
            const content = await Bun.file(
                Bun.fileURLToPath(new URL("../../../dist/browser", import.meta.url)),
            ).arrayBuffer();
            await Bun.write(target, content);
            await Bun.spawn(["chmod", "+x", target]).exited;
            await Bun.spawn(["xattr", "-w", "com.apple.provenance", "test", target]).exited;

            await removeMacosDownloadAttributes(target);

            const { exitCode, stdout } = await run("--version");
            expect(exitCode).toBe(0);
            expect(stdout).toBeTruthy();
        });
    } else {
        test("removeMacosDownloadAttributes is a no-op on non-macOS", async () => {
            await removeMacosDownloadAttributes("/tmp/browser-test");
            expect(true).toBe(true);
        });
    }
});
