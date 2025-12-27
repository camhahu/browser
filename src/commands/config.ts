import type { RegisterCommand } from "./common";
import { exitWithError } from "./common";
import { getConfig, setConfig, unsetConfig, type Config } from "../config";

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
      await setConfig(key as keyof Config, value);
      console.log(`Set ${key}: ${value}`);
    });

  configCmd
    .command("unset <key>")
    .description("Remove a config value")
    .action(async (key) => {
      await unsetConfig(key as keyof Config);
      console.log(`Unset ${key}`);
    });
};
