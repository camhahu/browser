import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, TEST_URL } from "./helpers";

describe("navigation", () => {
  setupBrowser();

  test("url and title", async () => {
    await browser(`open ${TEST_URL}`);
    expect(await browser("url")).toBe("https://camhahu.com/");
    expect(await browser("title")).toBe("Cameron Harder-Hutton");
  });

  test("navigate", async () => {
    await browser(`navigate ${TEST_URL}/blog`);
    await browser('wait "main ul"');
    expect(await browser("url")).toContain("/blog");
  });

  test("back, forward, refresh", async () => {
    await browser(`navigate ${TEST_URL}`);
    await browser('wait "main p"');
    
    await browser("back");
    await browser('wait "main ul"');
    expect(await browser("url")).toContain("/blog");
    
    await browser("forward");
    await browser('wait "main p"');
    expect(await browser("url")).toBe("https://camhahu.com/");
    
    await browser("refresh");
    expect(await browser("url")).toBe("https://camhahu.com/");
  });
});
