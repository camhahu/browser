import type { RegisterCommand } from "./common";
import { ensureRunning } from "./common";
import { setUseragent, setCustomUseragent, USERAGENT_PRESETS } from "../useragent";

export const registerUseragentCommand: RegisterCommand = (program) => {
    const useragent = program
        .command("useragent")
        .description("Set user agent for the active tab (applies to active tab only)");

    useragent
        .command("macos")
        .description("Set user agent to macOS Chrome")
        .action(async () => {
            await ensureRunning();
            await setUseragent("macos");
            console.log(`User agent set to macOS Chrome`);
        });

    useragent
        .command("windows")
        .description("Set user agent to Windows Chrome")
        .action(async () => {
            await ensureRunning();
            await setUseragent("windows");
            console.log(`User agent set to Windows Chrome`);
        });

    useragent
        .command("iphone")
        .description("Set user agent to iPhone Safari")
        .action(async () => {
            await ensureRunning();
            await setUseragent("iphone");
            console.log(`User agent set to iPhone Safari`);
        });

    useragent
        .command("android")
        .description("Set user agent to Android Chrome")
        .action(async () => {
            await ensureRunning();
            await setUseragent("android");
            console.log(`User agent set to Android Chrome`);
        });

    useragent
        .command("custom <useragent-string>")
        .description("Set a custom user agent string")
        .action(async (useragentString) => {
            await ensureRunning();
            await setCustomUseragent(useragentString);
            console.log(`User agent set to: ${useragentString}`);
        });

    useragent
        .command("list")
        .description("List available user agent presets")
        .action(() => {
            console.log("Available presets:");
            for (const [name, config] of Object.entries(USERAGENT_PRESETS)) {
                console.log(`  ${name}: ${config.userAgent.slice(0, 60)}...`);
            }
        });
};
