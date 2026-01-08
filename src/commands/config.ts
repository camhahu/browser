import type { RegisterCommand } from "./common";
import { exitWithError } from "./common";
import { getConfig, setConfig, unsetConfig, clearProfile, type Config } from "../config";

export const registerConfigCommand: RegisterCommand = (program) => {
    const configCmd = program
        .command("config [key]")
        .description("Show config or get a specific value")
        .action(async (key) => {
            const config = await getConfig();
            if (key) {
                const value = config[key as keyof Config];
                if (value === undefined) {
                    exitWithError(`Config key not set: ${key}`);
                }
                console.log(value);
            } else {
                if (Object.keys(config).length === 0) {
                    console.log("No config set");
                    return;
                }
                for (const [k, v] of Object.entries(config)) {
                    console.log(`${k}: ${v}`);
                }
            }
        });

    configCmd
        .command("set <key> <value>")
        .description("Set a config value")
        .action(async (key, value) => {
            let parsedValue: string | boolean = value;
            if (key === "persistentProfile") {
                if (value === "true") parsedValue = true;
                else if (value === "false") parsedValue = false;
                else exitWithError("persistentProfile must be 'true' or 'false'");
            }
            await setConfig(key as keyof Config, parsedValue);
            console.log(`Set ${key}: ${parsedValue}`);
        });

    configCmd
        .command("unset <key>")
        .description("Remove a config value")
        .action(async (key) => {
            await unsetConfig(key as keyof Config);
            console.log(`Unset ${key}`);
        });

    configCmd
        .command("clear-profile")
        .description("Delete the browser profile directory (clears cookies, logins, cache)")
        .action(async () => {
            const dir = await clearProfile();
            console.log(`Cleared profile: ${dir}`);
        });
};
