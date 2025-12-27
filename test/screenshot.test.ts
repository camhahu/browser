import { describe, test, expect, afterAll } from "bun:test";
import { browser, setupBrowser, TEST_URL } from "./helpers";
import { existsSync, unlinkSync, rmdirSync } from "fs";

const SCREENSHOTS_DIR = ".screenshots";

describe("screenshot", () => {
  setupBrowser();

  afterAll(() => {
    if (existsSync(SCREENSHOTS_DIR)) {
      const files = new Bun.Glob("*.{png,jpeg,webp}").scanSync(SCREENSHOTS_DIR);
      for (const file of files) {
        unlinkSync(`${SCREENSHOTS_DIR}/${file}`);
      }
      rmdirSync(SCREENSHOTS_DIR);
    }
  });

  test("captures screenshot with default name", async () => {
    await browser(`open ${TEST_URL}`);
    const output = await browser("screenshot");
    expect(output).toMatch(/^\.screenshots\/\d{4}-\d{2}-\d{2}-\d{2}-\d{2}-\d{2}\.png$/);
    expect(existsSync(output)).toBe(true);
  });

  test("captures screenshot with custom name", async () => {
    const output = await browser("screenshot test-capture");
    expect(output).toBe(".screenshots/test-capture.png");
    expect(existsSync(output)).toBe(true);
  });

  test("captures screenshot as jpeg", async () => {
    const output = await browser("screenshot jpeg-test -f jpeg");
    expect(output).toBe(".screenshots/jpeg-test.jpeg");
    expect(existsSync(output)).toBe(true);
  });

  test("captures screenshot as webp", async () => {
    const output = await browser("screenshot webp-test -f webp");
    expect(output).toBe(".screenshots/webp-test.webp");
    expect(existsSync(output)).toBe(true);
  });
});
