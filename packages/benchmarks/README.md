# Benchmarks

Benchmark harness for running Claude Code against the site benchmarks using the local browser CLI.

## Prerequisites

- Build the CLI: `bun run build` (outputs to `./dist/browser`)
- Start the benchmark site: `bun run --filter ./packages/site dev`
- Claude Code CLI available as `claude`

## Run Benchmarks

Run all benchmarks (3 runs each):

```bash
bun run --filter ./packages/benchmarks benchmark
```

Run a single benchmark:

```bash
bun run --filter ./packages/benchmarks benchmark -- --benchmark account-setup
```

Change runs or base URL:

```bash
bun run --filter ./packages/benchmarks benchmark -- --runs 1 --base-url http://localhost:4244
```

Use a specific Claude model:

```bash
bun run --filter ./packages/benchmarks benchmark -- --model claude-sonnet-4-5-20250929
```

Results are written to `packages/benchmarks/benchmark-results/*.jsonl`.

## Generate Report

```bash
bun run --filter ./packages/benchmarks generate
```

This writes `packages/benchmarks/benchmark-comparison.md`.
