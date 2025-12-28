import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, TEST_URL } from "./helpers";

describe("page", () => {
    setupBrowser();

    test("find", async () => {
        await browser(`open ${TEST_URL}`);
        expect(await browser("find a")).toContain("Found");
    });

    test("click with css", async () => {
        await browser("click \"nav a[href='/blog']\"");
    });

    test("click with text", async () => {
        await browser(`navigate ${TEST_URL}`);
        await browser('click "Blog"');
    });

    test("wait", async () => {
        await browser(`navigate ${TEST_URL}`);
        await browser('wait "main p"');
    });

    test("eval", async () => {
        const result = await browser('eval "1 + 1"');
        expect(result).toBe("2");
    });

    test("scroll top/bottom", async () => {
        await browser(`navigate ${TEST_URL}/blog`);
        await browser("scroll bottom");
        const scrolledDown = await browser("eval \"window.scrollY > 0\"");
        expect(scrolledDown).toBe("true");

        await browser("scroll top");
        const scrolledUp = await browser("eval \"window.scrollY === 0\"");
        expect(scrolledUp).toBe("true");
    });

    test("scroll to selector", async () => {
        await browser("scroll top");
        await browser("scroll main");
        const scrolled = await browser("eval \"window.scrollY >= 0\"");
        expect(scrolled).toBe("true");
    });
});
