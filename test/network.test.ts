import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, TEST_URL } from "./helpers";

describe("network", () => {
  setupBrowser();

  test("network requests", async () => {
    await browser(`open ${TEST_URL}`);
    const network = await browser("network");
    expect(network).toContain("camhahu.com");
    expect(network).toContain("200");
  });
});
