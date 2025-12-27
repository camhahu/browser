import type { RegisterCommand } from "./common";
import { ensureRunning, exitWithError } from "./common";
import { getUrl, getTitle } from "../cdp";
import { back, forward, refresh, navigate } from "../page";

export const registerNavigationCommands: RegisterCommand = (program) => {
  program
    .command("url")
    .description("Print the URL of the active tab")
    .action(async () => {
      await ensureRunning();
      const url = await getUrl();
      console.log(url);
    });

  program
    .command("title")
    .description("Print the title of the active tab")
    .action(async () => {
      await ensureRunning();
      const title = await getTitle();
      console.log(title);
    });

  program
    .command("back")
    .description("Go back in history")
    .action(async () => {
      await ensureRunning();
      const ok = await back();
      if (!ok) {
        exitWithError("No previous page");
      }
    });

  program
    .command("forward")
    .description("Go forward in history")
    .action(async () => {
      await ensureRunning();
      const ok = await forward();
      if (!ok) {
        exitWithError("No next page");
      }
    });

  program
    .command("refresh")
    .description("Reload the active tab")
    .action(async () => {
      await ensureRunning();
      await refresh();
    });

  program
    .command("navigate <url>")
    .description("Navigate the active tab to a URL")
    .action(async (url) => {
      await ensureRunning();
      await navigate(url);
      console.log(`Navigated to: ${url}`);
    });
};
