import { beforeAll, afterAll } from "bun:test";

export const BROWSER = "./dist/browser";
export const TEST_URL = "https://camhahu.com";

export async function run(args: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
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

export async function browser(args: string): Promise<string> {
  const { stdout, stderr, exitCode } = await run(args);
  if (exitCode !== 0) {
    throw new Error(`browser ${args} failed (exit ${exitCode}): ${stderr || stdout}`);
  }
  return stdout;
}

export function setupBrowser() {
  beforeAll(async () => {
    await run("stop").catch(() => {});
    await browser("start --headless");
  });

  afterAll(async () => {
    await run("stop");
  });
}
