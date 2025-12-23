#!/usr/bin/env bun

import { chromium } from "playwright";

const WS_PORT = 9222;
const STATE_FILE = "/tmp/browser-cli.json";

const headless = process.argv.includes("--headless");

const server = await chromium.launchServer({
  headless,
  port: WS_PORT,
});

await Bun.write(STATE_FILE, JSON.stringify({
  wsEndpoint: server.wsEndpoint(),
  activeTabId: 1,
}));

// Signal parent we're ready
console.log("READY");

// Keep running until killed
process.on("SIGTERM", async () => {
  await server.close();
  process.exit(0);
});
