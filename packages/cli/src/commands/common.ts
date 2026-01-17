import type { Command } from "commander";
import { interactiveOutline } from "../page";

export { ensureRunning } from "../cdp";

export function exitWithError(message: string): never {
    console.error(message);
    process.exit(1);
}

export async function printOutline(): Promise<void> {
    const { outline, timedOut } = await interactiveOutline();
    console.log(outline);
    if (timedOut) console.log("\n[timed out waiting for page to stabilize]");
}

export type RegisterCommand = (program: Command) => void;
