import { describe, test, expect } from "bun:test";
import { browser, run, setupBrowser, TEST_URL } from "./helpers";

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

  test("error when active tab is closed externally", async () => {
    await browser(`open ${TEST_URL}`);
    await Bun.write("/tmp/browser-cli.json", JSON.stringify({ activeTabId: "nonexistent" }));
    
    const { stderr, exitCode } = await run("url");
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Active tab was closed");
    expect(stderr).toContain("browser tabs");
    expect(stderr).toContain("browser use");
  });
});
