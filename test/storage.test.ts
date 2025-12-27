import { describe, test, expect } from "bun:test";
import { run, browser, setupBrowser, TEST_URL } from "./helpers";

describe("storage", () => {
  setupBrowser();

  test("set, get, delete", async () => {
    await browser(`open ${TEST_URL}`);
    
    await browser("storage set test_key test_value");
    const stored = await browser("storage test_key");
    expect(stored).toBe("test_value");
    
    await browser("storage delete test_key");
    const { exitCode } = await run("storage test_key");
    expect(exitCode).toBe(1);
  });
});
