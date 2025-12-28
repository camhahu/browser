import { withActivePage } from "./cdp";

export const USERAGENT_PRESETS = {
    macos: {
        userAgent:
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        platform: "macOS",
    },
    windows: {
        userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        platform: "Win32",
    },
    iphone: {
        userAgent:
            "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        platform: "iPhone",
    },
    android: {
        userAgent:
            "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
        platform: "Linux armv8l",
    },
} as const;

export type UseragentPreset = keyof typeof USERAGENT_PRESETS;

export async function setUseragent(preset: UseragentPreset): Promise<void> {
    const config = USERAGENT_PRESETS[preset];
    await withActivePage((client) =>
        client.Emulation.setUserAgentOverride({
            userAgent: config.userAgent,
            platform: config.platform,
        }),
    );
}

export async function setCustomUseragent(userAgent: string): Promise<void> {
    await withActivePage((client) =>
        client.Emulation.setUserAgentOverride({
            userAgent,
            platform: "",
        }),
    );
}
