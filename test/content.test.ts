import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, TEST_URL } from "./helpers";

describe("content", () => {
  setupBrowser();

  test("text", async () => {
    await browser(`open ${TEST_URL}`);
    expect(await browser("text nav")).toContain("Cameron");
    expect(await browser("text main")).toContain("Hey there");
  });

  test("html", async () => {
    expect(await browser("html nav -l 100")).toContain("<nav");
  });

  test("outline", async () => {
    const outline = await browser("outline");
    expect(outline).toContain("body");
    expect(outline).toContain("nav");
  });
});
