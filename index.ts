#!/usr/bin/env bun

import * as browser from "./src/browser";

const [cmd, ...args] = process.argv.slice(2);
const noStart = args.includes("--no-start");

const needsBrowser = !["start", "stop"].includes(cmd ?? "");

async function main() {
  if (needsBrowser && !noStart && !await browser.isRunning()) {
    await browser.launch({});
  }

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
      const tabId = args[0];
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
      const tabId = args[0];
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

    case "url": {
      const url = await browser.getUrl();
      console.log(url);
      break;
    }

    case "title": {
      const title = await browser.getTitle();
      console.log(title);
      break;
    }

    case "find": {
      const selector = args[0];
      if (!selector) {
        console.log("Usage: browser find <selector>");
        process.exit(1);
      }
      const count = await browser.find(selector);
      console.log(`Found ${count} match${count === 1 ? "" : "es"} for: ${selector}`);
      break;
    }

    case "click": {
      const selector = args[0];
      if (!selector) {
        console.log("Usage: browser click <selector>");
        process.exit(1);
      }
      await browser.click(selector);
      console.log(`Clicked: ${selector}`);
      break;
    }

    case "type": {
      const text = args[0];
      const selector = args[1];
      if (!text || !selector) {
        console.log("Usage: browser type <text> <selector>");
        process.exit(1);
      }
      await browser.type(text, selector);
      console.log(`Typed into: ${selector}`);
      break;
    }

    case "wait": {
      const selector = args[0];
      if (!selector) {
        console.log("Usage: browser wait <selector>");
        process.exit(1);
      }
      await browser.wait(selector);
      console.log(`Visible: ${selector}`);
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
