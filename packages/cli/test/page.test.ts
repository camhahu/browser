import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, TEST_URL } from "./helpers";

describe("page", () => {
    setupBrowser();

    test("find", async () => {
        await browser(`open ${TEST_URL}`);
        expect(await browser("find a")).toContain("Found");
    });

    test("click outputs outline", async () => {
        const output = await browser("click \"nav a.test-link\"");
        expect(output).toContain("Clicked");
        expect(output).toMatch(/\[l\d+\] link/);
    });

    test("click with text", async () => {
        await browser(`navigate ${TEST_URL}`);
        await browser('click "Blog"');
        expect(await browser("url")).toContain("/test/page/blog");
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
        await browser(`navigate ${TEST_URL.replace("/page", "/navigation")}/blog`);
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

    test("drag", async () => {
        await browser(`navigate ${TEST_URL}`);
        await browser(
            `eval "document.body.innerHTML = '<style>body{margin:0;padding:40px;}#source,#target{width:120px;height:120px;display:inline-flex;align-items:center;justify-content:center;border:2px solid #111;background:#eee;}#target{margin-left:200px;background:#fafafa;}</style><div id=source>Source</div><div id=target>Target</div>';const source=document.querySelector('#source');const target=document.querySelector('#target');let dragging=false;target.dataset.dropped='false';source.addEventListener('mousedown',()=>{dragging=true;});document.addEventListener('mouseup',(event)=>{if(dragging&&target.contains(event.target)){target.dataset.dropped='true';}dragging=false;});"`,
        );
        await browser('drag "#source" "#target"');
        const dropped = await browser(`eval "document.querySelector('#target').dataset.dropped"`);
        expect(dropped).toBe("true");
    });

    test("click with accessibility label", async () => {
        await browser(`navigate ${TEST_URL}`);
        const outline = await browser("outline");
        expect(outline).toContain("[l1]");
        expect(outline).toContain("[l2]");
        await browser("click l2");
        const url = await browser("url");
        expect(url).toContain("/test/page/blog");
    });

    test("type with accessibility label", async () => {
        await browser(`navigate ${TEST_URL}`);
        await browser(`eval "document.body.innerHTML = '<input type=text placeholder=Name>'"`);
        const outline = await browser("outline");
        const match = outline.match(/\[(i\d+)\] textbox/);
        expect(match).not.toBeNull();
        await browser(`type "Test User" ${match![1]}`);
        const value = await browser(`eval "document.querySelector('input').value"`);
        expect(value).toBe("Test User");
    });

    test("scroll with accessibility label", async () => {
        await browser(`navigate ${TEST_URL}`);
        const outline = await browser("outline");
        const match = outline.match(/\[(l\d+)\] link "Blog"/);
        expect(match).not.toBeNull();
        await browser(`scroll ${match![1]}`);
    });

    test("hover with accessibility label", async () => {
        await browser(`navigate ${TEST_URL}`);
        const outline = await browser("outline");
        const match = outline.match(/\[(l\d+)\] link/);
        expect(match).not.toBeNull();
        await browser(`hover ${match![1]}`);
    });

    test("wait with accessibility label", async () => {
        await browser(`navigate ${TEST_URL}`);
        const outline = await browser("outline");
        const match = outline.match(/\[(l\d+)\] link/);
        expect(match).not.toBeNull();
        await browser(`wait ${match![1]}`);
    });

    test("find with accessibility label", async () => {
        await browser(`navigate ${TEST_URL}`);
        await browser("outline");
        const result = await browser("find l1");
        expect(result).toContain("Found 1");
        expect(result).toContain("(label)");
    });
});
