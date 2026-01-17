import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, TEST_URL } from "./helpers";

describe("navigation", () => {
    setupBrowser();

    test("url and title", async () => {
        await browser(`open ${TEST_URL}`);
        expect(await browser("url")).toBe("https://camhahu.com/");
        expect(await browser("title")).toBe("Cameron Harder-Hutton");
    });

    test("navigate outputs outline", async () => {
        const output = await browser(`navigate ${TEST_URL}/blog`);
        expect(output).toContain("Navigated to:");
        expect(output).toMatch(/\[l\d+\] link/);
        expect(await browser("url")).toContain("/blog");
    });

    test("back outputs outline", async () => {
        await browser(`navigate ${TEST_URL}`);
        const output = await browser("back");
        expect(output).toMatch(/\[l\d+\] link/);
        expect(await browser("url")).toContain("/blog");
    });

    test("forward outputs outline", async () => {
        const output = await browser("forward");
        expect(output).toMatch(/\[l\d+\] link/);
        expect(await browser("url")).toBe("https://camhahu.com/");
    });

    test("refresh outputs outline", async () => {
        const output = await browser("refresh");
        expect(output).toMatch(/\[l\d+\] link/);
        expect(await browser("url")).toBe("https://camhahu.com/");
    });
});
