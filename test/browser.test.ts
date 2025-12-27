import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { run, browser } from "./helpers";

describe("browser", () => {
  beforeAll(async () => {
    await run("stop").catch(() => {});
  });

  afterAll(async () => {
    await run("stop");
  });

  test("version", async () => {
    const pkg = await Bun.file("package.json").json();
    expect(await browser("--version")).toBe(pkg.version);
  });

  test("start and stop", async () => {
    await browser("start --headless");
    const active = await browser("active");
    expect(active).toBeTruthy();

    await browser("stop");
    const { exitCode } = await run("active");
    expect(exitCode).toBe(1);
  });
});
