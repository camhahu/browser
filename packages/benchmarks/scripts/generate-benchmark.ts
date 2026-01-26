#!/usr/bin/env bun

import { readdir } from "node:fs/promises";
import { benchmarks } from "../src/benchmarks";

interface BenchmarkResult {
    duration_ms: number;
    num_turns: number;
    total_cost_usd: number;
}

interface RunData {
    time_ms: number;
    cost: number;
    turns: number;
    success: boolean;
}

interface MethodData {
    name: string;
    key: string;
    runs: RunData[];
    time_ms: number;
    cost: number;
    turns: number;
    successRate: string;
}

interface BenchmarkData {
    key: string;
    name: string;
    methods: MethodData[];
}

const METHOD_DISPLAY_NAMES: Record<string, string> = {
    browser: "Browser CLI",
};

const METHOD_ORDER = ["browser"];

const packageRoot = new URL("..", import.meta.url);
const resultsDir = new URL("benchmark-results/", packageRoot);
const outputPath = new URL("benchmark-comparison.md", packageRoot);

const benchmarkNameByKey = new Map<string, string>(
    benchmarks.map((benchmark) => [benchmark.key, benchmark.name])
);

function formatTime(ms: number): string {
    const totalSeconds = Math.round(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function formatCost(cost: number): string {
    return `$${cost.toFixed(2)}`;
}

function average(nums: number[]): number {
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function calcSuccessRate(runs: RunData[]): string {
    const successes = runs.filter((run) => run.success).length;
    const total = runs.length;
    const pct = Math.round((successes / total) * 100);
    return `${pct}% (${successes}/${total})`;
}

function parseFilename(filename: string): { benchmark: string; method: string } | null {
    const match = filename.match(/^(.+)-run\d+\.jsonl$/);
    if (!match) return null;

    const prefix = match[1];
    if (!prefix) return null;

    for (const method of METHOD_ORDER) {
        if (prefix.endsWith(`-${method}`)) {
            return {
                benchmark: prefix.slice(0, -(method.length + 1)),
                method,
            };
        }
    }

    return null;
}

function generateMethodTable(methods: MethodData[]): string {
    if (methods.length === 0) return "";

    let md = "| Method | Time | Cost (USD) | Turns | Success Rate |\n";
    md += "|--------|------|------------|-------|--------------|\n";

    for (const method of methods) {
        md += `| ${method.name} | ${formatTime(method.time_ms)} | ${formatCost(
            method.cost
        )} | ${method.turns} | ${method.successRate} |\n`;
    }

    return md;
}

function buildBenchmarkData(
    runsByBenchmark: Record<string, Record<string, RunData[]>>
): BenchmarkData[] {
    const orderedKeys = [
        ...benchmarks.map((benchmark) => benchmark.key),
        ...Object.keys(runsByBenchmark)
            .filter((key) => !benchmarkNameByKey.has(key))
            .sort(),
    ];

    const data: BenchmarkData[] = [];

    for (const key of orderedKeys) {
        const methodRuns = runsByBenchmark[key];
        if (!methodRuns) {
            continue;
        }

        const methods: MethodData[] = [];
        for (const [methodKey, runs] of Object.entries(methodRuns)) {
            const name = METHOD_DISPLAY_NAMES[methodKey] ?? methodKey;
            methods.push({
                name,
                key: methodKey,
                runs,
                time_ms: average(runs.map((run) => run.time_ms)),
                cost: average(runs.map((run) => run.cost)),
                turns: Math.round(average(runs.map((run) => run.turns))),
                successRate: calcSuccessRate(runs),
            });
        }

        methods.sort((a, b) => a.time_ms - b.time_ms);

        data.push({
            key,
            name: benchmarkNameByKey.get(key) ?? key,
            methods,
        });
    }

    return data;
}

function buildOverallSummary(data: BenchmarkData[]): MethodData[] {
    const aggregated: Record<string, RunData[]> = {};

    for (const benchmark of data) {
        for (const method of benchmark.methods) {
            const bucket = aggregated[method.key] ?? [];
            bucket.push(...method.runs);
            aggregated[method.key] = bucket;
        }
    }

    const methods: MethodData[] = [];
    for (const [methodKey, runs] of Object.entries(aggregated)) {
        const name = METHOD_DISPLAY_NAMES[methodKey] ?? methodKey;
        methods.push({
            name,
            key: methodKey,
            runs,
            time_ms: average(runs.map((run) => run.time_ms)),
            cost: average(runs.map((run) => run.cost)),
            turns: Math.round(average(runs.map((run) => run.turns))),
            successRate: calcSuccessRate(runs),
        });
    }

    methods.sort((a, b) => a.time_ms - b.time_ms);
    return methods;
}

async function main(): Promise<void> {
    let files: string[];
    try {
        files = await readdir(Bun.fileURLToPath(resultsDir));
    } catch {
        console.error("No benchmark-results directory found.");
        process.exit(1);
    }

    const benchmarkFiles = files.filter((file) => file.endsWith(".jsonl"));
    if (benchmarkFiles.length === 0) {
        console.error("No benchmark results found in benchmark-results/");
        process.exit(1);
    }

    const runsByBenchmark: Record<string, Record<string, RunData[]>> = {};

    for (const file of benchmarkFiles) {
        const parsed = parseFilename(file);
        if (!parsed) continue;

        const content = await Bun.file(new URL(file, resultsDir)).text();
        const lines = content.trim().split("\n");
        const lastLine = lines[lines.length - 1];
        if (!lastLine) {
            throw new Error(`No data found in ${file}`);
        }

        const data = JSON.parse(lastLine) as BenchmarkResult;

        const benchmarkRuns = runsByBenchmark[parsed.benchmark] ?? {};
        const methodRuns = benchmarkRuns[parsed.method] ?? [];
        methodRuns.push({
            time_ms: data.duration_ms,
            cost: data.total_cost_usd,
            turns: data.num_turns,
            success: true,
        });
        benchmarkRuns[parsed.method] = methodRuns;
        runsByBenchmark[parsed.benchmark] = benchmarkRuns;
    }

    const benchmarkData = buildBenchmarkData(runsByBenchmark);
    const overallSummary = buildOverallSummary(benchmarkData);

    let md = "# Benchmark Comparison\n\n";

    for (const benchmark of benchmarkData) {
        const runCount = benchmark.methods[0]?.runs.length ?? 0;

        md += `## ${benchmark.name}\n\n`;
        if (runCount > 1) {
            md += `*Averaged over ${runCount} runs per method*\n\n`;
        }
        md += generateMethodTable(benchmark.methods);
        md += "\n";
    }

    if (overallSummary.length > 0) {
        const totalRuns = overallSummary[0]?.runs.length ?? 0;
        md += "## Overall Summary\n\n";
        if (totalRuns > 1) {
            md += `*Aggregated across ${benchmarkData.length} benchmarks (${totalRuns} total runs per method)*\n\n`;
        }
        md += generateMethodTable(overallSummary);
    }

    await Bun.write(outputPath, md);
    console.log(`Generated ${Bun.fileURLToPath(outputPath)}`);
}

main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
});
