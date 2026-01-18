import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, TEST_URL } from "./helpers";

describe("content", () => {
    setupBrowser();

    test("console", async () => {
        await browser(`open ${TEST_URL}`);
        await browser("console --clear");
        await browser('eval "console.log(\'test message\'); console.warn(\'test warning\');"');
        const output = await browser("console");
        expect(output).toContain("test message");
        expect(output).toContain("[warning] test warning");
    });

    test("console --type filter", async () => {
        const output = await browser("console -t warning");
        expect(output).not.toContain("test message");
        expect(output).toContain("[warning] test warning");
    });

    test("text", async () => {
        await browser(`open ${TEST_URL}`);
        expect(await browser("text nav")).toContain("browser CLI");
        expect(await browser("text main")).toContain("Hey there");
    });

    test("html", async () => {
        expect(await browser("html nav -l 100")).toContain("<nav");
    });

    test("outline (interactive by default)", async () => {
        const outline = await browser("outline");
        expect(outline).toContain("banner");
        expect(outline).toContain("main");
        expect(outline).toContain("link");
        expect(outline).toMatch(/\[l\d+\]/);
        expect(outline).toMatch(/\[e\d+\]/);
        expect(outline).not.toContain("div");
    });

    test("outline --node expands a group", async () => {
        const outline = await browser("outline");
        const match = outline.match(/\[(e\d+)\]/);
        expect(match).not.toBeNull();
        const nodeOutline = await browser(`outline --node ${match?.[1] ?? ""}`);
        expect(nodeOutline).toContain(`[${match?.[1]}]`);
    });

    test("outline -a (all elements)", async () => {
        const outline = await browser("outline -a");
        expect(outline).toContain("body");
        expect(outline).toContain("nav");
    });
});
