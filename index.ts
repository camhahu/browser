#!/usr/bin/env bun

import { Command } from "commander";
import * as browser from "./src/browser";
import { runDaemon } from "./src/network-daemon";

const program = new Command();

program
  .name("browser")
  .description("CLI tool for controlling a Chromium browser via CDP")
  .version("1.0.0");

program
  .command("start")
  .description("Start the browser")
  .option("--headless", "Run in headless mode")
  .action(async (options) => {
    const tabId = await browser.launch({ headless: options.headless });
    console.log(`Started Chromium. Active tab: ${tabId}`);
  });

program
  .command("stop")
  .description("Stop the browser")
  .action(async () => {
    await browser.close();
    console.log("Stopped Chromium.");
  });

program
  .command("open <url>")
  .description("Open a new tab with the given URL")
  .action(async (url) => {
    await browser.ensureRunning();
    const { tabId } = await browser.openTab(url);
    console.log(`Opened tab ${tabId}: ${url}`);
  });

program
  .command("tabs")
  .description("List all open tabs")
  .action(async () => {
    await browser.ensureRunning();
    const { activeTabId, tabs } = await browser.getTabs();
    console.log(`Active tab: ${activeTabId}`);
    for (const tab of tabs) {
      console.log(`${tab.id}  ${tab.url}  ${tab.title}`);
    }
  });

program
  .command("use <tab-id>")
  .description("Switch to a specific tab")
  .action(async (tabId) => {
    await browser.ensureRunning();
    const ok = await browser.useTab(tabId);
    if (ok) {
      console.log(`Active tab is now ${tabId}`);
    } else {
      console.error(`No such tab: ${tabId}`);
      process.exit(1);
    }
  });

program
  .command("close [tab-id]")
  .description("Close a tab (defaults to active tab)")
  .action(async (tabId) => {
    await browser.ensureRunning();
    const closed = await browser.closeTab(tabId);
    if (closed !== null) {
      console.log(`Closed tab ${closed}`);
    } else {
      console.error(tabId ? `No such tab: ${tabId}` : "No active tab");
      process.exit(1);
    }
  });

program
  .command("active")
  .description("Print the active tab ID")
  .action(async () => {
    const tabId = await browser.getActiveTabId();
    if (tabId !== null) {
      console.log(tabId);
    } else {
      console.error("No browser session");
      process.exit(1);
    }
  });

program
  .command("url")
  .description("Print the URL of the active tab")
  .action(async () => {
    await browser.ensureRunning();
    const url = await browser.getUrl();
    console.log(url);
  });

program
  .command("title")
  .description("Print the title of the active tab")
  .action(async () => {
    await browser.ensureRunning();
    const title = await browser.getTitle();
    console.log(title);
  });

program
  .command("find <selector>")
  .description("Find elements matching a CSS selector")
  .action(async (selector) => {
    await browser.ensureRunning();
    const count = await browser.find(selector);
    console.log(`Found ${count} match${count === 1 ? "" : "es"} for: ${selector}`);
  });

program
  .command("click <selector>")
  .description("Click an element matching a CSS selector")
  .action(async (selector) => {
    await browser.ensureRunning();
    await browser.click(selector);
    console.log(`Clicked: ${selector}`);
  });

program
  .command("type <text> <selector>")
  .description("Type text into an element matching a CSS selector")
  .action(async (text, selector) => {
    await browser.ensureRunning();
    await browser.type(text, selector);
    console.log(`Typed into: ${selector}`);
  });

program
  .command("wait <selector>")
  .description("Wait for an element matching a CSS selector to appear")
  .action(async (selector) => {
    await browser.ensureRunning();
    await browser.wait(selector);
    console.log(`Visible: ${selector}`);
  });

program
  .command("eval <js>")
  .description("Evaluate JavaScript in the active tab")
  .action(async (js) => {
    await browser.ensureRunning();
    const result = await browser.evaluate(js);
    if (result !== undefined) {
      console.log(typeof result === "object" ? JSON.stringify(result, null, 2) : result);
    }
  });

program
  .command("back")
  .description("Go back in history")
  .action(async () => {
    await browser.ensureRunning();
    const ok = await browser.back();
    if (!ok) {
      console.error("No previous page");
      process.exit(1);
    }
  });

program
  .command("forward")
  .description("Go forward in history")
  .action(async () => {
    await browser.ensureRunning();
    const ok = await browser.forward();
    if (!ok) {
      console.error("No next page");
      process.exit(1);
    }
  });

program
  .command("refresh")
  .description("Reload the active tab")
  .action(async () => {
    await browser.ensureRunning();
    await browser.refresh();
  });

program
  .command("console")
  .description("Stream console output from the active tab (tip: run detached with `browser console > /tmp/console.log 2>&1 &`)")
  .action(async () => {
    await browser.ensureRunning();
    const close = await browser.console((type, args) => {
      const prefix = type === "log" ? "" : `[${type}] `;
      console.log(`${prefix}${args.join(" ")}`);
    });
    process.on("SIGINT", async () => {
      await close();
      process.exit(0);
    });
    console.error("Listening for console output... (Ctrl+C to stop)");
  });

program
  .command("html [selector]")
  .description("Get HTML content of an element (default: body)")
  .option("-l, --limit <chars>", "Character limit", "2000")
  .action(async (selector = "body", options) => {
    await browser.ensureRunning();
    const limit = parseInt(options.limit, 10);
    const result = await browser.html(selector, limit);
    if (result.truncated) {
      console.log(`[truncated: showing ${limit} of ${result.originalLength} chars]`);
    }
    console.log(result.content);
  });

program
  .command("text [selector]")
  .description("Get text content of an element (default: body)")
  .option("-l, --limit <chars>", "Character limit", "2000")
  .action(async (selector = "body", options) => {
    await browser.ensureRunning();
    const limit = parseInt(options.limit, 10);
    const result = await browser.text(selector, limit);
    if (result.truncated) {
      console.log(`[truncated: showing ${limit} of ${result.originalLength} chars]`);
    }
    console.log(result.content);
  });

program
  .command("outline [selector]")
  .description("Get structural outline of the page (default: body)")
  .option("-d, --depth <levels>", "Maximum depth", "6")
  .action(async (selector = "body", options) => {
    await browser.ensureRunning();
    const depth = parseInt(options.depth, 10);
    const result = await browser.outline(selector, depth);
    console.log(result);
  });

program
  .command("network [id]")
  .description("List network requests or show details of a specific request")
  .option("-f, --filter <pattern>", "Filter by URL pattern")
  .option("-t, --type <types>", "Filter by type (comma-separated: xhr,fetch,document,script,stylesheet,image,font,websocket,other)")
  .option("--failed", "Show only failed requests")
  .option("--headers", "Show headers (when viewing specific request)")
  .option("--body", "Show response body (when viewing specific request)")
  .option("--request-body", "Show request body (when viewing specific request)")
  .option("--clear", "Clear captured network requests for active tab")
  .action(async (id, options) => {
    await browser.ensureRunning();

    if (options.clear) {
      await browser.clearNetwork();
      console.log("Network requests cleared");
      return;
    }

    if (id) {
      const requestId = parseInt(id, 10);
      const request = await browser.networkRequest(requestId);
      if (!request) {
        console.error(`Request #${requestId} not found`);
        process.exit(1);
      }

      const duration = request.duration ? `${Math.round(request.duration)}ms` : "pending";
      const status = request.status ?? (request.failed ? "FAILED" : "...");
      console.log(`${request.method} ${status} ${request.url}  ${duration}`);
      if (request.error) console.log(`Error: ${request.error}`);
      console.log();

      if (options.headers || (!options.body && !options.requestBody)) {
        console.log("Request Headers:");
        for (const [key, value] of Object.entries(request.requestHeaders)) {
          console.log(`  ${key}: ${value}`);
        }
        console.log();

        if (request.responseHeaders) {
          console.log("Response Headers:");
          for (const [key, value] of Object.entries(request.responseHeaders)) {
            console.log(`  ${key}: ${value}`);
          }
          console.log();
        }
      }

      if (options.requestBody && request.requestBody) {
        console.log("Request Body:");
        console.log(request.requestBody);
        console.log();
      }

      if (options.body) {
        if (request.responseBody) {
          console.log("Response Body:");
          console.log(request.responseBody);
        } else {
          console.log("Response Body: (not captured)");
        }
      }
    } else {
      const filter: browser.NetworkFilter = {};
      if (options.filter) filter.pattern = options.filter;
      if (options.type) filter.type = options.type.split(",");
      if (options.failed) filter.failed = true;

      const { requests } = await browser.network(filter);

      if (requests.length === 0) {
        console.log("No requests captured");
        return;
      }

      for (const req of requests) {
        const duration = req.duration ? `${Math.round(req.duration)}ms`.padStart(6) : "...".padStart(6);
        const status = req.status?.toString() ?? (req.failed ? "ERR" : "...");
        const method = req.method.padEnd(6);
        const failed = req.failed ? "  FAILED" : "";
        const url = req.url.length > 60 ? req.url.slice(0, 60) + "..." : req.url;
        console.log(`#${req.id.toString().padEnd(4)} ${method} ${status.padEnd(3)} ${url}  ${duration}${failed}`);
      }
    }
  });

program
  .command("_network-daemon", { hidden: true })
  .action(runDaemon);

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
