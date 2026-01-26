#!/usr/bin/env bun

import { mkdir } from "node:fs/promises";
import { benchmarks, getBenchmark, type Benchmark } from "../src/benchmarks";

const CLAUDE_PATH = "claude";
const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const TOOL_DISCIPLINE_PROMPT =
    "Tool use rules: call exactly one tool at a time. Never emit multiple tool_use blocks in a single assistant message. Always wait for tool results before calling the next tool.";

let activeProcess: ReturnType<typeof Bun.spawn> | null = null;
let shuttingDown = false;

function registerSignalHandlers(): void {
    const shutdown = (signal: NodeJS.Signals) => {
        if (shuttingDown) return;
        shuttingDown = true;
        if (activeProcess) {
            activeProcess.kill(signal);
        }
        process.exit(signal === "SIGINT" ? 130 : 143);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}
const DEFAULT_RUNS = 3;
const DEFAULT_BASE_URL = "http://localhost:4244";

const packageRoot = new URL("..", import.meta.url);
const repoRoot = new URL("../../..", import.meta.url);
const resultsDir = new URL("benchmark-results/", packageRoot);
const browserBinaryUrl = new URL("dist/browser", repoRoot);
const skillFileUrl = new URL(".claude/skills/browser/SKILL.md", repoRoot);

type ParsedArgs = {
    benchmarkKey?: string;
    runs: number;
    baseUrl: string;
    list: boolean;
    model: string;
};

function printUsage(): void {
    console.log("Usage: bun run scripts/benchmark.ts [options]");
    console.log("");
    console.log("Options:");
    console.log("  --benchmark <key>   Run a specific benchmark");
    console.log("  --runs <count>      Number of runs per benchmark (default: 3)");
    console.log("  --base-url <url>    Base URL for the benchmark site");
    console.log("  --model <name>      Claude model (default: claude-sonnet-4-5-20250929)");
    console.log("  --list              List available benchmarks");
    console.log("");
    console.log(`Available benchmarks: ${benchmarks.map((b) => b.key).join(", ")}`);
}

function parseArgs(args: string[]): ParsedArgs {
    let benchmarkKey: string | undefined;
    let runs = DEFAULT_RUNS;
    let baseUrl = DEFAULT_BASE_URL;
    let list = false;
    let model = DEFAULT_MODEL;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const nextArg = args[i + 1];
        if (arg === "--benchmark" && nextArg !== undefined) {
            benchmarkKey = nextArg;
            i++;
            continue;
        }
        if (arg === "--runs" && nextArg !== undefined) {
            const value = Number.parseInt(nextArg, 10);
            if (!Number.isFinite(value) || value < 1) {
                throw new Error("--runs must be a positive integer");
            }
            runs = value;
            i++;
            continue;
        }
        if (arg === "--base-url" && nextArg !== undefined) {
            baseUrl = nextArg;
            i++;
            continue;
        }
        if (arg === "--model" && nextArg !== undefined) {
            model = nextArg;
            i++;
            continue;
        }
        if (arg === "--list") {
            list = true;
            continue;
        }
        if (arg === "--help" || arg === "-h") {
            printUsage();
            process.exit(0);
        }
        throw new Error(`Unknown argument: ${arg}`);
    }

    return { benchmarkKey, runs, baseUrl, list, model };
}

async function ensureBrowserBinary(): Promise<string> {
    const exists = await Bun.file(browserBinaryUrl).exists();
    const browserPath = Bun.fileURLToPath(browserBinaryUrl);
    if (!exists) {
        throw new Error(
            `Missing ${browserPath}. Build it with \"bun run build\" before running benchmarks.`
        );
    }
    return browserPath;
}

async function ensureSkill(browserPath: string): Promise<void> {
    const exists = await Bun.file(skillFileUrl).exists();
    if (exists) {
        return;
    }

    console.log("Installing browser skill...");
    const proc = Bun.spawn([browserPath, "add-skill", "claude"], {
        cwd: Bun.fileURLToPath(repoRoot),
        stdout: "inherit",
        stderr: "inherit",
    });
    const exitCode = await proc.exited;
    if (exitCode !== 0) {
        throw new Error("Failed to install browser skill for Claude");
    }
}

async function ensureServer(baseUrl: string): Promise<void> {
    let response: Response;
    try {
        response = await fetch(baseUrl, { method: "GET" });
    } catch (err) {
        throw new Error(
            `Unable to reach ${baseUrl}. Start the site with "bun run --filter ./packages/site dev".`
        );
    }
    if (!response.ok) {
        throw new Error(
            `Server at ${baseUrl} responded with ${response.status}. Ensure the site is running.`
        );
    }
}

async function buildPrompt(benchmark: Benchmark, baseUrl: string): Promise<string> {
    const promptUrl = new URL(benchmark.promptFile, repoRoot);
    const promptText = await Bun.file(promptUrl).text();
    const targetUrl = `${baseUrl}${benchmark.route}`;

    return [
        "You are running a benchmark using the local browser CLI.",
        "",
        "Rules:",
        "- Load the browser skill at the start if available.",
        "- Use ./dist/browser for all browser commands (not the global browser command).",
        "- Do not pass --json flags to ./dist/browser.",
        "- Do not use Playwright, MCP, or other automation tools.",
        `- Assume the site is already running at ${baseUrl}.`,
        `- Start by opening ${targetUrl}.`,
        "- Prefer outline/text commands over screenshots unless layout is required.",
        "- When finished, run ./dist/browser stop.",
        "",
        "Benchmark steps:",
        promptText.trim(),
        "",
    ].join("\n");
}

async function runBenchmark(
    benchmark: Benchmark,
    run: number,
    baseUrl: string,
    model: string
): Promise<void> {
    const outputPath = new URL(
        `${benchmark.key}-browser-run${run}.jsonl`,
        resultsDir
    );
    const prompt = await buildPrompt(benchmark, baseUrl);

    const outputFile = Bun.file(outputPath);
    const writer = outputFile.writer();

    const args = [
        CLAUDE_PATH,
        "--model",
        model,
        "--append-system-prompt",
        TOOL_DISCIPLINE_PROMPT,
        "-p",
        prompt,
        "--dangerously-skip-permissions",
        "--output-format",
        "stream-json",
        "--verbose",
    ];

    const proc = Bun.spawn(args, {
        cwd: Bun.fileURLToPath(repoRoot),
        stdout: "pipe",
        stderr: "inherit",
    });
    activeProcess = proc;

    const reader = proc.stdout.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        process.stdout.write(text);
        writer.write(text);
    }

    writer.end();
    const exitCode = await proc.exited;
    if (activeProcess === proc) {
        activeProcess = null;
    }
    if (exitCode !== 0) {
        throw new Error(`Claude exited with code ${exitCode}`);
    }

    console.log("");
    console.log(`Saved: ${Bun.fileURLToPath(outputPath)}`);
}

async function main(): Promise<void> {
    registerSignalHandlers();
    const args = parseArgs(process.argv.slice(2));

    if (args.list) {
        console.log(benchmarks.map((b) => b.key).join("\n"));
        return;
    }

    const benchmarksToRun = args.benchmarkKey
        ? [getBenchmark(args.benchmarkKey)]
        : benchmarks;

    await mkdir(Bun.fileURLToPath(resultsDir), { recursive: true });

    const browserPath = await ensureBrowserBinary();
    await ensureSkill(browserPath);
    await ensureServer(args.baseUrl);

    for (const benchmark of benchmarksToRun) {
        console.log("");
        console.log(`======= Benchmark: ${benchmark.name} (${benchmark.key}) =======`);

        for (let run = 1; run <= args.runs; run++) {
            console.log("");
            console.log(`--- Run ${run} of ${args.runs} ---`);
            await runBenchmark(benchmark, run, args.baseUrl, args.model);
        }
    }
}

main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
});
