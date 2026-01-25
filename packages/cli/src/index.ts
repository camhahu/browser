#!/usr/bin/env bun

import { Command } from "commander";
import { registerBrowserCommands } from "./commands/browser";
import { registerTabCommands } from "./commands/tabs";
import { registerPageCommands } from "./commands/page";
import { registerNavigationCommands } from "./commands/navigation";
import { registerContentCommands } from "./commands/content";
import { registerNetworkCommands } from "./commands/network";
import { registerCookiesCommand } from "./commands/cookies";
import { registerStorageCommand } from "./commands/storage";
import { registerConfigCommand } from "./commands/config";
import { registerSkillCommand } from "./commands/skill";
import { registerUpdateCommand } from "./commands/update";
import { registerScreenshotCommand } from "./commands/screenshot";
import { registerViewportCommand } from "./commands/viewport";
import { registerUseragentCommand } from "./commands/useragent";
import { capture, captureError, flush, setNoTelemetryFlag } from "./telemetry";
import { maybeShowTelemetryPrompt } from "./telemetry-prompt";

const program = new Command();

const SKIP_TELEMETRY = new Set(["start", "stop", "add-skill"]);

program.hook("preAction", async (thisCommand, actionCommand) => {
    if (thisCommand.opts().noTelemetry) {
        setNoTelemetryFlag(true);
    }
    await maybeShowTelemetryPrompt();
    const name = actionCommand.name();
    if (!name.startsWith("_") && !SKIP_TELEMETRY.has(name)) {
        capture("command", { name });
    }
});

program
    .name("browser")
    .description("CLI tool for controlling a Chromium browser via CDP")
    .version(process.env.VERSION ?? "0.0.0-dev")
    .option("--no-telemetry", "Disable telemetry for this session");

registerBrowserCommands(program);
registerTabCommands(program);
registerPageCommands(program);
registerNavigationCommands(program);
registerContentCommands(program);
registerNetworkCommands(program);
registerCookiesCommand(program);
registerStorageCommand(program);
registerConfigCommand(program);
registerSkillCommand(program);
registerUpdateCommand(program);
registerScreenshotCommand(program);
registerViewportCommand(program);
registerUseragentCommand(program);

program.parseAsync(process.argv).catch(async (err) => {
    captureError(err);
    await flush();
    console.error(err.message);
    process.exitCode = 1;
});
