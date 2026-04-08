#!/usr/bin/env bun

import { $ } from "bun";

const cliRoot = Bun.fileURLToPath(new URL("..", import.meta.url));
const version = (await $`bun pm pkg get version --cwd ${cliRoot}`.text()).trim().replace(/"/g, "");
const target = process.argv[2];

const outfile = target ? `dist/browser-${target.replace("bun-", "")}` : "dist/browser";
const entrypoint = Bun.fileURLToPath(new URL("../src/index.ts", import.meta.url));
const outfilePath = Bun.fileURLToPath(new URL(`../../../${outfile}`, import.meta.url));

console.log(`Building browser v${version}${target ? ` for ${target}` : ""}`);

const proc = Bun.spawn(
    [
        "bun",
        "build",
        "--compile",
        entrypoint,
        "--outfile",
        outfilePath,
        ...(target ? [`--target=${target}`] : []),
        "--define",
        `process.env.VERSION='${version}'`,
    ],
    {
        stdout: "inherit",
        stderr: "inherit",
    },
);

const exitCode = await proc.exited;
if (exitCode !== 0) process.exit(exitCode);
