import type { RegisterCommand } from "./common";
import { ensureRunning, exitWithError } from "./common";
import { openTab, getTabs, useTab, closeTab } from "../cdp";

export const registerTabCommands: RegisterCommand = (program) => {
  program
    .command("open <url>")
    .description("Open a new tab with the given URL")
    .action(async (url) => {
      await ensureRunning();
      const { tabId } = await openTab(url);
      console.log(`Opened tab ${tabId}: ${url}`);
    });

  program
    .command("tabs")
    .description("List all open tabs")
    .action(async () => {
      await ensureRunning();
      const { activeTabId, tabs } = await getTabs();
      console.log(`Active tab: ${activeTabId}`);
      for (const tab of tabs) {
        console.log(`${tab.id}  ${tab.url}  ${tab.title}`);
      }
    });

  program
    .command("use <tab-id>")
    .description("Switch to a specific tab")
    .action(async (tabId) => {
      await ensureRunning();
      const ok = await useTab(tabId);
      if (ok) {
        console.log(`Active tab is now ${tabId}`);
      } else {
        exitWithError(`No such tab: ${tabId}`);
      }
    });

  program
    .command("close [tab-id]")
    .description("Close a tab (defaults to active tab)")
    .action(async (tabId) => {
      await ensureRunning();
      const closed = await closeTab(tabId);
      if (closed !== null) {
        console.log(`Closed tab ${closed}`);
      } else {
        exitWithError(tabId ? `No such tab: ${tabId}` : "No active tab");
      }
    });
};
