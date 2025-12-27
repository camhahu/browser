import type { RegisterCommand } from "./common";
import { ensureRunning } from "./common";
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

export const registerScreenshotCommand: RegisterCommand = (program) => {
  program
    .command("screenshot [filename]")
    .description("Capture a screenshot of the active tab (saves to .screenshots/<filename>.<format>)")
    .option("-f, --format <format>", "Image format: png, jpeg, webp", "png")
    .action(async (filename, options) => {
      await ensureRunning();

      const format = options.format as ScreenshotFormat;
      if (!["png", "jpeg", "webp"].includes(format)) {
        throw new Error(`Invalid format: ${format}. Must be png, jpeg, or webp`);
      }

      const name = filename || generateFilename();
      const relativePath = `${SCREENSHOTS_DIR}/${name}.${format}`;

      await Bun.$`mkdir -p ${SCREENSHOTS_DIR}`.quiet();

      const base64Data = await captureScreenshot(format);
      const buffer = Buffer.from(base64Data, "base64");
      await Bun.write(relativePath, buffer);

      console.log(relativePath);
    });
};
