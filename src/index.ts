#!/usr/bin/env bun

import { Command } from "commander";
import { ensureRunning } from "./cdp";
import { registerBrowserCommands } from "./commands/browser";
import { registerTabCommands } from "./commands/tabs";
import { registerPageCommands } from "./commands/page";
import { registerNavigationCommands } from "./commands/navigation";
import { registerContentCommands } from "./commands/content";
import { registerNetworkCommands } from "./commands/network";
import { registerCookiesCommand } from "./commands/cookies";
import { registerStorageCommand } from "./commands/storage";
import { getConfig, setConfig, unsetConfig, type Config } from "./config";
import { fetchSkillFiles, AGENT_TARGETS, SUPPORTED_TARGETS } from "./skill-files";

const program = new Command();

program
  .name("browser")
  .description("CLI tool for controlling a Chromium browser via CDP")
  .version(process.env.VERSION ?? "0.0.0-dev");

registerBrowserCommands(program);
registerTabCommands(program);
registerPageCommands(program);
registerNavigationCommands(program);
registerContentCommands(program);
registerNetworkCommands(program);
registerCookiesCommand(program);
registerStorageCommand(program);

const configCmd = program
  .command("config [key]")
  .description("Show config or get a specific value")
  .action(async (key) => {
    const config = await getConfig();
    if (key) {
      const value = config[key as keyof Config];
      if (value === undefined) {
        console.error(`Config key not set: ${key}`);
        process.exit(1);
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

program
  .command("add-skill <target>")
  .description(`Install the browser skill for an AI agent. Targets: ${SUPPORTED_TARGETS.join(", ")}`)
  .action(async (target: string) => {
    const targetPath = AGENT_TARGETS[target];
    if (!targetPath) {
      console.error(`Unknown target: ${target}`);
      console.error(`Supported targets: ${SUPPORTED_TARGETS.join(", ")}`);
      process.exit(1);
    }

    console.log(`Fetching skill files...`);
    const { skillMd, commandsMd } = await fetchSkillFiles();

    const fs = await import("fs");
    const path = await import("path");

    const skillDir = path.join(process.cwd(), targetPath);
    const referencesDir = path.join(skillDir, "references");

    fs.mkdirSync(referencesDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillMd);
    fs.writeFileSync(path.join(referencesDir, "COMMANDS.md"), commandsMd);

    console.log(`Installed browser skill to ${targetPath}/`);
  });

program
  .command("update")
  .description("Update browser to the latest version")
  .option("--check", "Only check for updates, don't install")
  .action(async (options) => {
    const currentVersion = process.env.VERSION ?? "0.0.0-dev";
    const repo = "camhahu/browser";
    
    // Get latest version from GitHub
    const res = await fetch(`https://api.github.com/repos/${repo}/releases/latest`);
    if (!res.ok) {
      console.error("Failed to check for updates");
      process.exit(1);
    }
    const release = await res.json() as { tag_name: string };
    const latestVersion = release.tag_name.replace(/^v/, "");
    
    if (currentVersion === latestVersion) {
      console.log(`Already on latest version (${currentVersion})`);
      return;
    }
    
    console.log(`Current version: ${currentVersion}`);
    console.log(`Latest version:  ${latestVersion}`);
    
    if (options.check) {
      console.log("\nRun 'browser update' to install the update");
      return;
    }
    
    // Detect platform
    const platform = process.platform === "darwin" ? "darwin" : process.platform === "win32" ? "windows" : "linux";
    const arch = process.arch === "arm64" ? "arm64" : "x64";
    const ext = platform === "windows" ? ".exe" : "";
    const filename = `browser-${platform}-${arch}${ext}`;
    const downloadUrl = `https://github.com/${repo}/releases/download/v${latestVersion}/${filename}`;
    
    // Get install location
    const installDir = `${process.env.HOME}/.browser/bin`;
    const installPath = `${installDir}/browser${ext}`;
    
    console.log(`\nDownloading ${filename}...`);
    
    const { spawnSync } = await import("child_process");
    const fs = await import("fs");
    
    // Ensure install directory exists
    fs.mkdirSync(installDir, { recursive: true });
    
    // Download with curl (follows redirects, shows progress)
    const result = spawnSync("curl", ["-fSL", downloadUrl, "-o", installPath], {
      stdio: "inherit",
    });
    
    if (result.status !== 0) {
      console.error("Download failed");
      process.exit(1);
    }
    
    // Make executable
    if (platform !== "windows") {
      fs.chmodSync(installPath, 0o755);
    }
    
    console.log(`Updated to v${latestVersion}`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
