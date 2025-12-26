#!/usr/bin/env bun

import { $ } from "bun";

const version = (await $`bun pm pkg get version`.text()).trim().replace(/"/g, "");

console.log(`Building browser v${version}`);

await $`bun build --compile index.ts --outfile dist/browser --define "process.env.VERSION='${version}'"`;
