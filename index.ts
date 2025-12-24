#!/usr/bin/env bun

import { Command } from "commander";
import * as browser from "./src/browser";

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

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
