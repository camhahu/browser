import type { Command } from "commander";
import type { RegisterCommand } from "./common";
import { ensureRunning, exitWithError } from "./common";
import { getCookies, getCookie, setCookie, deleteCookie, clearCookies } from "../storage";

export const registerCookiesCommand: RegisterCommand = (program) => {
  const cookiesCmd = program
    .command("cookies [name]")
    .description("List cookies or get a specific cookie value")
    .action(async (name) => {
      await ensureRunning();
      if (name) {
        const cookie = await getCookie(name);
        if (!cookie) {
          exitWithError(`Cookie not found: ${name}`);
        }
        console.log(cookie.value);
      } else {
        const cookies = await getCookies();
        if (cookies.length === 0) {
          console.log("No cookies");
          return;
        }
        for (const c of cookies) {
          const expires = c.expires === -1 ? "session" : new Date(c.expires * 1000).toISOString().split("T")[0];
          const value = c.value.length > 30 ? c.value.slice(0, 30) + "..." : c.value;
          console.log(`${c.name.padEnd(24)} ${value.padEnd(34)} ${c.domain.padEnd(20)} ${expires}`);
        }
      }
    });

  cookiesCmd
    .command("set <name> <value>")
    .description("Set a cookie")
    .option("-d, --domain <domain>", "Cookie domain (defaults to current hostname)")
    .action(async function(this: Command, name, value) {
      await ensureRunning();
      const options = this.optsWithGlobals();
      await setCookie(name, value, options.domain);
      console.log(`Set cookie: ${name}`);
    });

  cookiesCmd
    .command("delete <name>")
    .description("Delete a cookie")
    .action(async (name) => {
      await ensureRunning();
      await deleteCookie(name);
      console.log(`Deleted cookie: ${name}`);
    });

  cookiesCmd
    .command("clear")
    .description("Clear all cookies for the current origin")
    .action(async () => {
      await ensureRunning();
      await clearCookies();
      console.log("Cleared all cookies");
    });
};
