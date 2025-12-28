import type { RegisterCommand } from "./common";
import { ensureRunning } from "./common";
import { console as browserConsole, html, text, outline, interactiveOutline } from "../page";

export const registerContentCommands: RegisterCommand = (program) => {
  program
    .command("console")
    .description("Stream console output from the active tab (tip: run detached with `browser console > /tmp/console.log 2>&1 &`)")
    .action(async () => {
      await ensureRunning();
      const stop = await browserConsole((t, args) => {
        const prefix = t === "log" ? "" : `[${t}] `;
        console.log(`${prefix}${args.join(" ")}`);
      });
      process.on("SIGINT", async () => {
        await stop();
        process.exit(0);
      });
      console.error("Listening for console output... (Ctrl+C to stop)");
    });

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
    .description("Get structural outline of the page (default: body)")
    .option("-d, --depth <levels>", "Maximum depth", "6")
    .option("-i, --interactive", "Show only interactive elements (links, buttons, inputs) within landmarks")
    .action(async (selector = "body", options) => {
      await ensureRunning();
      if (options.interactive) {
        const result = await interactiveOutline(selector);
        console.log(result);
      } else {
        const depth = parseInt(options.depth, 10);
        const result = await outline(selector, depth);
        console.log(result);
      }
    });
};
