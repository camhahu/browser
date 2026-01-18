import { beforeAll, afterAll } from "bun:test";

const REPO_ROOT = Bun.fileURLToPath(new URL("../../..", import.meta.url));
const BROWSER = Bun.fileURLToPath(new URL("../../../dist/browser", import.meta.url));
export const TEST_URL = "http://localhost:5173/test/page";

export async function run(args: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const proc = Bun.spawn(["sh", "-c", `${BROWSER} ${args}`], {
        stdout: "pipe",
        stderr: "pipe",
        cwd: REPO_ROOT,
        env: {
            ...process.env,
            PATH: `${REPO_ROOT}/dist:${process.env.PATH ?? ""}`,
        },
    });
    const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
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

export async function browserFails(args: string): Promise<string> {
    const { stdout, stderr, exitCode } = await run(args);
    if (exitCode === 0) {
        throw new Error(`browser ${args} was expected to fail but succeeded: ${stdout}`);
    }
    return stderr || stdout;
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
