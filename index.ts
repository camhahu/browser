#!/usr/bin/env bun

import * as browser from "./src/browser";

const [cmd, ...args] = process.argv.slice(2);

async function main() {
  switch (cmd) {
    case "start": {
      const headless = args.includes("--headless");
      const profileIdx = args.indexOf("--profile");
      const profile = profileIdx >= 0 ? args[profileIdx + 1] : undefined;
      
      const tabId = await browser.launch({ headless, profile });
      console.log(`Started Chromium. Active tab: ${tabId}`);
      break;
    }

    case "stop": {
      await browser.close();
      console.log("Stopped Chromium.");
      break;
    }

    default:
      console.log("Unknown command:", cmd);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
