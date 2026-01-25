import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, TEST_URL } from "./helpers";

describe("navigation", () => {
    setupBrowser();

    test("url and title", async () => {
        await browser(`open ${TEST_URL}`);
        expect(await browser("url")).toBe(TEST_URL);
        expect(await browser("title")).toBe("browser CLI benchmarks");
    });

    test("navigate outputs outline", async () => {
        const output = await browser(`navigate ${TEST_URL}/blog`);
        expect(output).toContain("Navigated to:");
        expect(output).toMatch(/\[l\d+\] link/);
        expect(await browser("url")).toContain("/test/page/blog");
    });

    test("back outputs outline", async () => {
        await browser(`navigate ${TEST_URL}/blog`);
        const output = await browser("back");
        expect(output).toMatch(/\[l\d+\] link/);
        expect(await browser("url")).toBe(TEST_URL);
    });

    test("forward outputs outline", async () => {
        const output = await browser("forward");
        expect(output).toMatch(/\[l\d+\] link/);
        expect(await browser("url")).toBe(`${TEST_URL}/blog`);
    });

    test("refresh outputs outline", async () => {
        const output = await browser("refresh");
        expect(output).toMatch(/\[l\d+\] link/);
        expect(await browser("url")).toBe(`${TEST_URL}/blog`);
    });
});
