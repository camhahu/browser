import type { RegisterCommand } from "./common";
import { launch, close, getActiveTabId, toShortId } from "../cdp";
import { exitWithError } from "./common";
import { capture, flush } from "../telemetry";

export const registerBrowserCommands: RegisterCommand = (program) => {
    program
        .command("start")
        .description("Start the browser")
        .option("--headless", "Run in headless mode")
        .option("--headed", "Run in headed mode (default)")
        .action(async (options) => {
            if (options.headless && options.headed) {
                exitWithError("Cannot use both --headless and --headed");
            }
            const tabId = await launch({ headless: options.headless });
            console.log(`Started Chromium. Active tab: ${toShortId(tabId)}`);
            capture("session_start", { headless: options.headless ?? false });
        });

    program
        .command("stop")
        .description("Stop the browser")
        .action(async () => {
            const sessionId = await close();
            console.log("Stopped Chromium.");
            capture("session_stop", { session_id: sessionId });
            await flush();
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
