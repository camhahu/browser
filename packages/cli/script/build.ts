#!/usr/bin/env bun

import { $ } from "bun";

const cliRoot = Bun.fileURLToPath(new URL("..", import.meta.url));
const version = (await $`bun pm pkg get version --cwd ${cliRoot}`.text()).trim().replace(/"/g, "");
const target = process.argv[2];

const outfile = target ? `dist/browser-${target.replace("bun-", "")}` : "dist/browser";
const targetFlag = target ? `--target=${target}` : "";
const entrypoint = Bun.fileURLToPath(new URL("../src/index.ts", import.meta.url));
const outfilePath = Bun.fileURLToPath(new URL(`../../../${outfile}`, import.meta.url));

console.log(`Building browser v${version}${target ? ` for ${target}` : ""}`);

await $`bun build --compile ${entrypoint} --outfile ${outfilePath} ${targetFlag} --define "process.env.VERSION='${version}'"`;
