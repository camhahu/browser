import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, TEST_URL } from "./helpers";

describe("page", () => {
    setupBrowser();

    test("find", async () => {
        await browser(`open ${TEST_URL}`);
        expect(await browser("find a")).toContain("Found");
    });

    test("click outputs outline", async () => {
        const output = await browser("click \"nav a[href='/blog']\"");
        expect(output).toContain("Clicked");
        expect(output).toMatch(/\[l\d+\] link/);
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

    test("select by value", async () => {
        await browser(`navigate ${TEST_URL}`);
        await browser(`eval "document.body.innerHTML = '<select id=color><option value=r>Red</option><option value=g>Green</option></select>'"`);
        const result = await browser('select "#color" "g"');
        expect(result).toBe("Selected: g");
        const value = await browser(`eval "document.querySelector('#color').value"`);
        expect(value).toBe("g");
    });

    test("select by label", async () => {
        await browser(`eval "document.body.innerHTML = '<select id=color><option value=r>Red</option><option value=g>Green</option></select>'"`);
        const result = await browser('select "#color" "Red"');
        expect(result).toBe("Selected: r");
    });

    test("click with accessibility label", async () => {
        await browser(`navigate ${TEST_URL}`);
        const outline = await browser("outline");
        expect(outline).toContain("[l1]");
        expect(outline).toContain("[l2]");
        await browser("click l2");
        const url = await browser("url");
        expect(url).toContain("/blog");
    });
});
