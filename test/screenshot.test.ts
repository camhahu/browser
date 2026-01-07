import { describe, test, expect, afterAll } from "bun:test";
import { browser, browserFails, setupBrowser, TEST_URL } from "./helpers";
import { existsSync, unlinkSync, rmdirSync } from "fs";
import { tmpdir } from "os";

const SCREENSHOTS_DIR = ".screenshots";

describe("screenshot", () => {
    setupBrowser();

    afterAll(() => {
        if (existsSync(SCREENSHOTS_DIR)) {
            const files = new Bun.Glob("*.{png,jpeg,webp}").scanSync(SCREENSHOTS_DIR);
            for (const file of files) {
                unlinkSync(`${SCREENSHOTS_DIR}/${file}`);
            }
            rmdirSync(SCREENSHOTS_DIR);
        }
    });

    test("captures screenshot with default name", async () => {
        await browser(`open ${TEST_URL}`);
        const output = await browser("screenshot");
        expect(output).toMatch(/\.screenshots\/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.png$/);
        expect(existsSync(output)).toBe(true);
    });

    test("captures screenshot with custom name", async () => {
        const output = await browser("screenshot test-capture");
        expect(output).toEndWith(".screenshots/test-capture.png");
        expect(existsSync(output)).toBe(true);
    });

    test("captures screenshot as jpeg", async () => {
        const output = await browser("screenshot jpeg-test -f jpeg");
        expect(output).toEndWith(".screenshots/jpeg-test.jpeg");
        expect(existsSync(output)).toBe(true);
    });

    test("captures screenshot as webp", async () => {
        const output = await browser("screenshot webp-test -f webp");
        expect(output).toEndWith(".screenshots/webp-test.webp");
        expect(existsSync(output)).toBe(true);
    });

    test("--output saves to specified path", async () => {
        const outputPath = `${tmpdir()}/browser-test-${Date.now()}.png`;
        const output = await browser(`screenshot --output ${outputPath}`);
        expect(output).toBe(outputPath);
        expect(existsSync(output)).toBe(true);
        unlinkSync(outputPath);
    });

    test("--output detects format from extension", async () => {
        const outputPath = `${tmpdir()}/browser-test-${Date.now()}.webp`;
        const output = await browser(`screenshot -o ${outputPath}`);
        expect(output).toBe(outputPath);
        expect(existsSync(output)).toBe(true);
        unlinkSync(outputPath);
    });

    test("--output appends .png when no extension", async () => {
        const basePath = `${tmpdir()}/browser-test-${Date.now()}`;
        const output = await browser(`screenshot -o ${basePath}`);
        expect(output).toBe(`${basePath}.png`);
        expect(existsSync(output)).toBe(true);
        unlinkSync(output);
    });

    test("--output with unsupported format fails", async () => {
        const output = await browserFails(`screenshot -o /tmp/test.gif`);
        expect(output).toContain("Unsupported format");
    });

    test("--output and --format together fails", async () => {
        const output = await browserFails(`screenshot -o /tmp/test.png -f webp`);
        expect(output).toContain("Cannot use --format with --output");
    });

    test("name and --output together fails", async () => {
        const output = await browserFails(`screenshot myname -o /tmp/test.png`);
        expect(output).toContain("Cannot use both [name] and --output");
    });
});
