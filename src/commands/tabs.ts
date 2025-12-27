import type { RegisterCommand } from "./common";
import { ensureRunning, exitWithError } from "./common";
import { openTab, getTabs, useTab, closeTab, toShortId, resolveTabId } from "../cdp";

export const registerTabCommands: RegisterCommand = (program) => {
  program
    .command("open <url>")
    .description("Open a new tab with the given URL")
    .action(async (url) => {
      await ensureRunning();
      const { tabId } = await openTab(url);
      console.log(`Opened tab ${toShortId(tabId)}: ${url}`);
    });

  program
    .command("tabs")
    .description("List all open tabs")
    .action(async () => {
      await ensureRunning();
      const { activeTabId, tabs } = await getTabs();
      console.log(`Active tab: ${toShortId(activeTabId)}`);
      for (const tab of tabs) {
        console.log(`${toShortId(tab.id)}  ${tab.url}  ${tab.title}`);
      }
    });

  program
    .command("use <tab-id>")
    .description("Switch to a specific tab")
    .action(async (shortId) => {
      await ensureRunning();
      const fullId = await resolveTabId(shortId);
      if (!fullId) {
        exitWithError(`No such tab: ${shortId}`);
        return;
      }
      const ok = await useTab(fullId);
      if (ok) {
        console.log(`Active tab is now ${toShortId(fullId)}`);
      } else {
        exitWithError(`No such tab: ${shortId}`);
      }
    });

  program
    .command("close [tab-id]")
    .description("Close a tab (defaults to active tab)")
    .action(async (shortId) => {
      await ensureRunning();
      const fullId = shortId ? await resolveTabId(shortId) ?? undefined : undefined;
      if (shortId && !fullId) {
        exitWithError(`No such tab: ${shortId}`);
        return;
      }
      const closed = await closeTab(fullId);
      if (closed !== null) {
        console.log(`Closed tab ${toShortId(closed)}`);
      } else {
        exitWithError(shortId ? `No such tab: ${shortId}` : "No active tab");
      }
    });
};
