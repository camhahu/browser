import type { RegisterCommand } from "./common";
import { ensureRunning, exitWithError } from "./common";
import { setViewport, VIEWPORT_PRESETS } from "../viewport";

export const registerViewportCommand: RegisterCommand = (program) => {
  const viewport = program
    .command("viewport")
    .description("Set viewport size for the active tab (applies to active tab only)");

  viewport
    .command("desktop")
    .description("Set viewport to desktop size (1920x1080)")
    .action(async () => {
      await ensureRunning();
      await setViewport("desktop");
      const { width, height } = VIEWPORT_PRESETS.desktop;
      console.log(`Viewport set to desktop (${width}x${height})`);
    });

  viewport
    .command("tablet")
    .description("Set viewport to tablet size (768x1024)")
    .action(async () => {
      await ensureRunning();
      await setViewport("tablet");
      const { width, height } = VIEWPORT_PRESETS.tablet;
      console.log(`Viewport set to tablet (${width}x${height})`);
    });

  viewport
    .command("mobile")
    .description("Set viewport to mobile size (375x667)")
    .action(async () => {
      await ensureRunning();
      await setViewport("mobile");
      const { width, height } = VIEWPORT_PRESETS.mobile;
      console.log(`Viewport set to mobile (${width}x${height})`);
    });

  viewport
    .command("set <width> <height>")
    .description("Set viewport to custom dimensions")
    .action(async (widthStr, heightStr) => {
      const width = parseInt(widthStr, 10);
      const height = parseInt(heightStr, 10);
      if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        exitWithError("Width and height must be positive integers");
      }
      await ensureRunning();
      await setViewport({ width, height });
      console.log(`Viewport set to ${width}x${height}`);
    });
};
