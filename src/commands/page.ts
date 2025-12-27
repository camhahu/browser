import type { RegisterCommand } from "./common";
import { ensureRunning } from "./common";
import { find, click, type, wait, hover, evaluate } from "../page";

export const registerPageCommands: RegisterCommand = (program) => {
  program
    .command("find <selector>")
    .description("Find elements matching a CSS selector")
    .action(async (selector) => {
      await ensureRunning();
      const count = await find(selector);
      console.log(`Found ${count} match${count === 1 ? "" : "es"} for: ${selector}`);
    });

  program
    .command("click <selector>")
    .description("Click an element matching a CSS selector")
    .action(async (selector) => {
      await ensureRunning();
      await click(selector);
      console.log(`Clicked: ${selector}`);
    });

  program
    .command("type <text> [selector]")
    .description("Type text into an element, or send keys to the page (e.g. 'type ctrl+c' for shortcuts)")
    .action(async (txt, selector) => {
      await ensureRunning();
      await type(txt, selector);
      if (selector) {
        console.log(`Typed into: ${selector}`);
      } else {
        console.log(`Sent keys: ${txt}`);
      }
    });

  program
    .command("wait <selector>")
    .description("Wait for an element matching a CSS selector to appear")
    .action(async (selector) => {
      await ensureRunning();
      await wait(selector);
      console.log(`Visible: ${selector}`);
    });

  program
    .command("hover <selector>")
    .description("Move mouse to element matching a CSS selector")
    .action(async (selector) => {
      await ensureRunning();
      await hover(selector);
      console.log(`Hovered: ${selector}`);
    });

  program
    .command("eval <js>")
    .description("Evaluate JavaScript in the active tab")
    .action(async (js) => {
      await ensureRunning();
      const result = await evaluate(js);
      if (result !== undefined) {
        console.log(typeof result === "object" ? JSON.stringify(result, null, 2) : result);
      }
    });
};
