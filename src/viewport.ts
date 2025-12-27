import type CDP from "chrome-remote-interface";
import { withActivePage } from "./cdp";

export const VIEWPORT_PRESETS = {
  desktop: { width: 1920, height: 1080, mobile: false },
  tablet: { width: 768, height: 1024, mobile: true },
  mobile: { width: 375, height: 667, mobile: true },
} as const;

export type ViewportPreset = keyof typeof VIEWPORT_PRESETS;

interface ViewportDimensions {
  width: number;
  height: number;
  mobile?: boolean;
}

async function applyViewport(client: CDP.Client, config: { width: number; height: number; mobile: boolean }): Promise<void> {
  await client.Emulation.setDeviceMetricsOverride({
    width: config.width,
    height: config.height,
    deviceScaleFactor: 1,
    mobile: config.mobile,
  });
}

export async function setViewport(preset: ViewportPreset): Promise<void>;
export async function setViewport(dimensions: ViewportDimensions): Promise<void>;
export async function setViewport(presetOrDimensions: ViewportPreset | ViewportDimensions): Promise<void> {
  const config = typeof presetOrDimensions === "string"
    ? VIEWPORT_PRESETS[presetOrDimensions]
    : { mobile: false, ...presetOrDimensions };

  await withActivePage((client) => applyViewport(client, config));
}

export async function setViewportForClient(client: CDP.Client, preset: ViewportPreset): Promise<void> {
  await applyViewport(client, VIEWPORT_PRESETS[preset]);
}
