import type { RegisterCommand } from "./common";
import { launch, close, getActiveTabId, toShortId, findManagedChromeArg } from "../cdp";
import { exitWithError } from "./common";
import { capture, flush } from "../telemetry";

function collectChromeArg(value: string, previous: string[]): string[] {
    return [...previous, value];
}

export const registerBrowserCommands: RegisterCommand = (program) => {
    program
        .command("start")
        .description("Start the browser")
        .option("--headless", "Run in headless mode")
        .option("--headed", "Run in headed mode (default)")
        .option("--software-rendering", "Use software rendering (disables GPU, forces SwiftShader)")
        .option(
            "--chrome-arg <arg>",
            "Pass an additional argument to Chrome (can be repeated)",
            collectChromeArg,
            new Array<string>(),
        )
        .action(async (options) => {
            if (options.headless && options.headed) {
                exitWithError("Cannot use both --headless and --headed");
            }
            const extraArgs: string[] = options.chromeArg ?? [];
            const managedArg = findManagedChromeArg(extraArgs);
            if (managedArg) exitWithError(`Cannot override managed Chrome flag: ${managedArg}`);
            const tabId = await launch({
                headless: options.headless,
                softwareRendering: options.softwareRendering,
                extraArgs,
            });
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
