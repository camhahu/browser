import path from "node:path";
import { mkdir } from "node:fs/promises";
import type { RegisterCommand } from "./common";
import { ensureRunning, exitWithError } from "./common";
import { captureScreenshot, type ScreenshotFormat } from "../cdp";

const SCREENSHOTS_DIR = ".screenshots";

function generateFilename(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

function parseFormat(ext: string): ScreenshotFormat | null {
    if (ext === "jpg" || ext === "jpeg") return "jpeg";
    if (ext === "png") return "png";
    if (ext === "webp") return "webp";
    return null;
}

export const registerScreenshotCommand: RegisterCommand = (program) => {
    program
        .command("screenshot [name]")
        .description("Capture a screenshot of the active tab")
        .option("-f, --format <format>", "Image format: png, jpeg, webp", "png")
        .option("-o, --output <path>", "Output path (format detected from extension)")
        .action(async (name, options) => {
            await ensureRunning();

            if (name && options.output) {
                exitWithError("Cannot use both [name] and --output");
            }

            if (options.output && options.format !== "png") {
                exitWithError("Cannot use --format with --output");
            }

            let outputPath: string;
            let format: ScreenshotFormat;

            if (options.output) {
                const ext = path.extname(options.output).slice(1).toLowerCase();
                if (ext) {
                    format = parseFormat(ext) ?? exitWithError(`Unsupported format: .${ext}`);
                    outputPath = path.resolve(options.output);
                } else {
                    format = "png";
                    outputPath = path.resolve(`${options.output}.png`);
                }
                await mkdir(path.dirname(outputPath), { recursive: true });
            } else {
                format = parseFormat(options.format) ?? exitWithError(`Invalid format: ${options.format}`);
                const filename = name?.replace(/\.(png|jpe?g|webp)$/i, "") || generateFilename();
                outputPath = path.resolve(`${SCREENSHOTS_DIR}/${filename}.${format}`);
                await mkdir(SCREENSHOTS_DIR, { recursive: true });
            }

            const base64Data = await captureScreenshot(format);
            const buffer = Buffer.from(base64Data, "base64");
            await Bun.write(outputPath, buffer);

            console.log(outputPath);
        });
};
