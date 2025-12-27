import type { Command } from "commander";

export { ensureRunning } from "../cdp";

export function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

export type RegisterCommand = (program: Command) => void;
