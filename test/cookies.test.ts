import { describe, test, expect } from "bun:test";
import { run, browser, setupBrowser, TEST_URL } from "./helpers";

describe("cookies", () => {
  setupBrowser();

  test("set, get, delete", async () => {
    await browser(`open ${TEST_URL}`);
    
    await browser("cookies set test_cookie test_value");
    const cookie = await browser("cookies test_cookie");
    expect(cookie).toBe("test_value");
    
    await browser("cookies delete test_cookie");
    const { exitCode } = await run("cookies test_cookie");
    expect(exitCode).toBe(1);
  });
});
