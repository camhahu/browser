import { describe, test, expect, beforeAll, afterAll } from "bun:test";

const BROWSER = "./dist/browser";
const TEST_URL = "https://camhahu.com";

async function run(args: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(["sh", "-c", `${BROWSER} ${args}`], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);
  const exitCode = await proc.exited;
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode };
}

async function browser(args: string): Promise<string> {
  const { stdout, stderr, exitCode } = await run(args);
  if (exitCode !== 0) {
    throw new Error(`browser ${args} failed (exit ${exitCode}): ${stderr || stdout}`);
  }
  return stdout;
}

describe("browser CLI", () => {
  beforeAll(async () => {
    await run("stop").catch(() => {});
    await browser("start --headless");
  });

  afterAll(async () => {
    await run("stop");
  });

  test("full integration", async () => {
    // Version
    const pkg = await Bun.file("package.json").json();
    expect(await browser("--version")).toBe(pkg.version);

    // Open page and verify navigation
    await browser(`open ${TEST_URL}`);
    expect(await browser("url")).toBe("https://camhahu.com/");
    expect(await browser("title")).toBe("Cameron Harder-Hutton");

    // Page content
    expect(await browser("find a")).toContain("Found");
    expect(await browser("text nav")).toContain("Cameron");
    expect(await browser("text main")).toContain("Hey there");
    expect(await browser("html nav -l 100")).toContain("<nav");
    const outline = await browser("outline");
    expect(outline).toContain("body");
    expect(outline).toContain("nav");

    // Network requests
    const network = await browser("network");
    expect(network).toContain("camhahu.com");
    expect(network).toContain("200");

    // Click (just verify it doesn't error on a valid element)
    await browser('click "nav a"');

    // Navigate via eval to build history, then test back/forward
    await browser(`eval "location.href = '${TEST_URL}/blog'"`);
    await browser('wait "main ul"');
    expect(await browser("url")).toContain("/blog");
    
    // Navigate (same tab navigation)
    await browser(`navigate ${TEST_URL}`);
    await browser('wait "main p"');
    expect(await browser("url")).toBe("https://camhahu.com/");

    // Back/forward/refresh
    await browser("back");
    await browser('wait "main ul"');
    expect(await browser("url")).toContain("/blog");
    await browser("forward");
    await browser('wait "main p"');
    expect(await browser("url")).toBe("https://camhahu.com/");
    await browser("refresh");
    expect(await browser("url")).toBe("https://camhahu.com/");

    // Tab management
    await browser(`open ${TEST_URL}`);
    const tabs = await browser("tabs");
    expect(tabs.split("\n").length).toBeGreaterThan(2);
    const activeTab = await browser("active");
    expect(activeTab).toBeTruthy();
    await browser("close");

    // Cookies
    await browser(`open ${TEST_URL}`);
    await browser("cookies set test_cookie test_value");
    const cookie = await browser("cookies test_cookie");
    expect(cookie).toBe("test_value");
    await browser("cookies delete test_cookie");
    const { exitCode } = await run("cookies test_cookie");
    expect(exitCode).toBe(1);

    // Storage
    await browser("storage set test_key test_value");
    const stored = await browser("storage test_key");
    expect(stored).toBe("test_value");
    await browser("storage delete test_key");
    const { exitCode: storageExit } = await run("storage test_key");
    expect(storageExit).toBe(1);

    // Eval
    const evalResult = await browser('eval "1 + 1"');
    expect(evalResult).toBe("2");

    // Console (just verify it starts, can't easily test streaming)
    // Type command needs an input element - skip for now since camhahu.com has no forms
  }, 60000);
});
