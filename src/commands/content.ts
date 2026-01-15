import type { RegisterCommand } from "./common";
import { ensureRunning } from "./common";
import { html, text, outline, interactiveOutline } from "../page";
import { consoleMessages, clearConsole, type ConsoleFilter } from "../console";
import { runDaemon } from "../console-daemon";

export const registerContentCommands: RegisterCommand = (program) => {
    program
        .command("console")
        .description("Show console output from the active tab")
        .option("-l, --limit <count>", "Maximum number of messages to show", "50")
        .option("-t, --type <types>", "Filter by type (comma-separated: log,warn,error,info,debug)")
        .option("--clear", "Clear captured console messages for active tab")
        .action(async (options) => {
            await ensureRunning();

            if (options.clear) {
                await clearConsole();
                console.log("Console messages cleared");
                return;
            }

            const filter: ConsoleFilter = {};
            if (options.type) filter.type = options.type.split(",");

            const { messages } = await consoleMessages(filter);

            if (messages.length === 0) {
                console.log("No console messages captured");
                return;
            }

            const limit = parseInt(options.limit, 10);
            const toShow = messages.slice(-limit);
            if (messages.length > limit) {
                console.log(`[showing last ${limit} of ${messages.length} messages]`);
            }

            for (const msg of toShow) {
                const prefix = msg.type === "log" ? "" : `[${msg.type}] `;
                console.log(`${prefix}${msg.args.join(" ")}`);
            }
        });

    program.command("_console-daemon", { hidden: true }).action(runDaemon);

    program
        .command("html [selector]")
        .description("Get HTML content of an element (default: body)")
        .option("-l, --limit <chars>", "Character limit", "2000")
        .action(async (selector = "body", options) => {
            await ensureRunning();
            const limit = parseInt(options.limit, 10);
            const result = await html(selector, limit);
            if (result.truncated) {
                console.log(`[truncated: showing ${limit} of ${result.originalLength} chars]`);
            }
            console.log(result.content);
        });

    program
        .command("text [selector]")
        .description("Get text content of an element (default: body)")
        .option("-l, --limit <chars>", "Character limit", "2000")
        .option("--include-invisible", "Include text from hidden elements")
        .action(async (selector = "body", options) => {
            await ensureRunning();
            const limit = parseInt(options.limit, 10);
            const result = await text(selector, limit, !options.includeInvisible);
            if (result.truncated) {
                console.log(`[truncated: showing ${limit} of ${result.originalLength} chars]`);
            }
            console.log(result.content);
        });

    program
        .command("outline [selector]")
        .description("Get structural outline of the page (default: body, interactive elements only)")
        .option("-a, --all [depth]", "Show all elements with optional depth (default: 6)")
        .action(async (selector = "body", options) => {
            await ensureRunning();
            if (options.all !== undefined) {
                const depth = options.all === true ? 6 : parseInt(options.all, 10);
                const result = await outline(selector, depth);
                console.log(result);
            } else {
                const { outline: result, timedOut } = await interactiveOutline(selector);
                console.log(result);
                if (timedOut) console.log("\n[timed out waiting for page to stabilize]");
            }
        });
};
