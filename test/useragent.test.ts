import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, run } from "./helpers";

describe("useragent", () => {
    setupBrowser();

    test("macos preset", async () => {
        const output = await browser("useragent macos");
        expect(output).toContain("macOS Chrome");
    });

    test("windows preset", async () => {
        const output = await browser("useragent windows");
        expect(output).toContain("Windows Chrome");
    });

    test("iphone preset", async () => {
        const output = await browser("useragent iphone");
        expect(output).toContain("iPhone Safari");
    });

    test("android preset", async () => {
        const output = await browser("useragent android");
        expect(output).toContain("Android Chrome");
    });

    test("custom useragent", async () => {
        const customUA = "MyCustomAgent/1.0";
        const output = await browser(`useragent custom "${customUA}"`);
        expect(output).toContain(customUA);
    });

    test("list presets", async () => {
        const output = await browser("useragent list");
        expect(output).toContain("macos");
        expect(output).toContain("windows");
        expect(output).toContain("iphone");
        expect(output).toContain("android");
    });
});
