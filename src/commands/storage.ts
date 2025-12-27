import type { Command } from "commander";
import type { RegisterCommand } from "./common";
import { ensureRunning, exitWithError } from "./common";
import {
  getStorageEntries, getStorageValue, setStorageValue, deleteStorageValue, clearStorage,
  type StorageType,
} from "../storage";

export const registerStorageCommand: RegisterCommand = (program) => {
  const storageCmd = program
    .command("storage [key]")
    .description("List localStorage keys or get a specific value")
    .option("-s, --session", "Use sessionStorage instead of localStorage")
    .action(async (key, options) => {
      await ensureRunning();
      const type: StorageType = options.session ? "session" : "local";
      if (key) {
        const value = await getStorageValue(key, type);
        if (value === null) {
          exitWithError(`Key not found: ${key}`);
        }
        console.log(value);
      } else {
        const entries = await getStorageEntries(type);
        if (entries.length === 0) {
          console.log(`No ${type}Storage entries`);
          return;
        }
        for (const { key: k, value: v } of entries) {
          const truncated = v.length > 50 ? v.slice(0, 50) + "..." : v;
          console.log(`${k.padEnd(30)} ${truncated}`);
        }
      }
    });

  storageCmd
    .command("set <key> <value>")
    .description("Set a storage value")
    .action(async function(this: Command, key, value) {
      await ensureRunning();
      const options = this.optsWithGlobals();
      const type: StorageType = options.session ? "session" : "local";
      await setStorageValue(key, value, type);
      console.log(`Set ${type}Storage: ${key}`);
    });

  storageCmd
    .command("delete <key>")
    .description("Delete a storage key")
    .action(async function(this: Command, key) {
      await ensureRunning();
      const options = this.optsWithGlobals();
      const type: StorageType = options.session ? "session" : "local";
      await deleteStorageValue(key, type);
      console.log(`Deleted ${type}Storage: ${key}`);
    });

  storageCmd
    .command("clear")
    .description("Clear all storage")
    .action(async function(this: Command) {
      await ensureRunning();
      const options = this.optsWithGlobals();
      const type: StorageType = options.session ? "session" : "local";
      await clearStorage(type);
      console.log(`Cleared ${type}Storage`);
    });
};
