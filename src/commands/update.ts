import type { RegisterCommand } from "./common";
import { exitWithError } from "./common";

export const registerUpdateCommand: RegisterCommand = (program) => {
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
        exitWithError("Failed to check for updates");
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
        exitWithError("Download failed");
      }

      // Make executable
      if (platform !== "windows") {
        fs.chmodSync(installPath, 0o755);
      }

      console.log(`Updated to v${latestVersion}`);
    });
};
