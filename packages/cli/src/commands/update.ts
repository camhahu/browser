import type { RegisterCommand } from "./common";
import { exitWithError } from "./common";
import { homedir } from "node:os";
import { join } from "node:path";
import { chmod, mkdir } from "node:fs/promises";

const DOWNLOAD_ATTRIBUTES = ["com.apple.provenance", "com.apple.quarantine"];

type CommandResult = {
    exitCode: number;
    stdout: string;
    stderr: string;
};

async function runCommand(args: string[]): Promise<CommandResult> {
    const proc = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" });
    const [stdout, stderr, exitCode] = await Promise.all([
        new Response(proc.stdout).text(),
        new Response(proc.stderr).text(),
        proc.exited,
    ]);
    return { exitCode, stdout: stdout.trim(), stderr: stderr.trim() };
}

export async function removeMacosDownloadAttributes(path: string): Promise<void> {
    if (process.platform !== "darwin") {
        return;
    }

    for (const attribute of DOWNLOAD_ATTRIBUTES) {
        const check = await runCommand(["xattr", "-p", attribute, path]);
        if (check.exitCode !== 0) {
            continue;
        }

        const removal = await runCommand(["xattr", "-d", attribute, path]);
        if (removal.exitCode !== 0) {
            throw new Error(`Failed to remove ${attribute} from ${path}: ${removal.stderr || removal.stdout}`);
        }
    }
}

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
            const release = (await res.json()) as { tag_name: string };
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
            const platformMap: Record<string, string> = {
                darwin: "darwin",
                linux: "linux",
                win32: "windows",
            };
            const archMap: Record<string, string> = {
                arm64: "arm64",
                x64: "x64",
            };
            const platform = platformMap[process.platform];
            if (!platform) {
                exitWithError(`Unsupported platform: ${process.platform}`);
            }
            const arch = archMap[process.arch];
            if (!arch) {
                exitWithError(`Unsupported architecture: ${process.arch}`);
            }
            const ext = platform === "windows" ? ".exe" : "";
            const filename = `browser-${platform}-${arch}${ext}`;
            const downloadUrl = `https://github.com/${repo}/releases/download/v${latestVersion}/${filename}`;

            // Get install location
            const installDir = join(homedir(), ".browser", "bin");
            const installPath = join(installDir, `browser${ext}`);

            console.log(`\nDownloading ${filename}...`);

            try {
                await mkdir(installDir, { recursive: true });
            } catch (error) {
                exitWithError(`Failed to create install directory: ${(error as Error).message}`);
            }

            const download = await fetch(downloadUrl);
            if (!download.ok) {
                exitWithError("Download failed");
            }

            const payload = new Uint8Array(await download.arrayBuffer());
            await Bun.write(installPath, payload);

            if (platform !== "windows") {
                try {
                    await chmod(installPath, 0o755);
                } catch (error) {
                    exitWithError(`Failed to set executable bit: ${(error as Error).message}`);
                }
            }

            try {
                await removeMacosDownloadAttributes(installPath);
            } catch (error) {
                exitWithError((error as Error).message);
            }

            console.log(`Updated to v${latestVersion}`);
        });
};
