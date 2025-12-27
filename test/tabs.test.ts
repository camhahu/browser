import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, TEST_URL } from "./helpers";

describe("tabs", () => {
  setupBrowser();

  test("open, tabs, active, close", async () => {
    await browser(`open ${TEST_URL}`);
    
    const tabs = await browser("tabs");
    expect(tabs.split("\n").length).toBeGreaterThan(2);
    
    const activeTab = await browser("active");
    expect(activeTab).toBeTruthy();
    
    await browser("close");
  });
});
