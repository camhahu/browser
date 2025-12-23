#!/usr/bin/env bun

import * as browser from "./src/browser";

const [cmd, ...args] = process.argv.slice(2);

async function main() {
  switch (cmd) {
    case "start": {
      const headless = args.includes("--headless");
      const tabId = await browser.launch({ headless });
      console.log(`Started Chromium. Active tab: ${tabId}`);
      break;
    }

    case "stop": {
      await browser.close();
      console.log("Stopped Chromium.");
      break;
    }

    case "open": {
      const url = args[0];
      if (!url) {
        console.log("Usage: browser open <url>");
        process.exit(1);
      }
      const { tabId } = await browser.openTab(url);
      console.log(`Opened tab ${tabId}: ${url}`);
      break;
    }

    case "tabs": {
      const { activeTabId, tabs } = await browser.getTabs();
      console.log(`Active tab: ${activeTabId}`);
      for (const tab of tabs) {
        console.log(`${tab.id}  ${tab.url}  ${tab.title}`);
      }
      break;
    }

    case "use": {
      const tabId = Number(args[0]);
      if (!tabId) {
        console.log("Usage: browser use <tab-id>");
        process.exit(1);
      }
      const ok = await browser.useTab(tabId);
      if (ok) {
        console.log(`Active tab is now ${tabId}`);
      } else {
        console.log(`No such tab: ${tabId}`);
        process.exit(1);
      }
      break;
    }

    case "close": {
      const tabId = args[0] ? Number(args[0]) : undefined;
      const closed = await browser.closeTab(tabId);
      if (closed !== null) {
        console.log(`Closed tab ${closed}`);
      } else {
        console.log(`No such tab: ${tabId}`);
        process.exit(1);
      }
      break;
    }

    case "active": {
      const tabId = await browser.getActiveTabId();
      if (tabId !== null) {
        console.log(tabId);
      } else {
        console.log("No browser session");
        process.exit(1);
      }
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
