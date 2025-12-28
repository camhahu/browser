import type { RegisterCommand } from "./common";
import { launch, close, getActiveTabId, toShortId } from "../cdp";
import { exitWithError } from "./common";

export const registerBrowserCommands: RegisterCommand = (program) => {
  program
    .command("start")
    .description("Start the browser")
    .option("--headless", "Run in headless mode")
    .action(async (options) => {
      const tabId = await launch({ headless: options.headless });
      console.log(`Started Chromium. Active tab: ${toShortId(tabId)}`);
    });

  program
    .command("stop")
    .description("Stop the browser")
    .action(async () => {
      await close();
      console.log("Stopped Chromium.");
    });

  program
    .command("active")
    .description("Print the active tab ID")
    .action(async () => {
      const tabId = await getActiveTabId();
      if (tabId !== null) {
        console.log(toShortId(tabId));
      } else {
        exitWithError("No browser session");
      }
    });
};
