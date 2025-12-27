import { describe, test, expect } from "bun:test";
import { browser, setupBrowser, run } from "./helpers";

describe("viewport", () => {
  setupBrowser();

  test("desktop preset", async () => {
    const output = await browser("viewport desktop");
    expect(output).toContain("1920x1080");
  });

  test("tablet preset", async () => {
    const output = await browser("viewport tablet");
    expect(output).toContain("768x1024");
  });

  test("mobile preset", async () => {
    const output = await browser("viewport mobile");
    expect(output).toContain("375x667");
  });

  test("custom dimensions", async () => {
    const output = await browser("viewport set 1280 720");
    expect(output).toContain("1280x720");
  });

  test("invalid dimensions", async () => {
    const { exitCode } = await run("viewport set abc 720");
    expect(exitCode).toBe(1);
  });
});
