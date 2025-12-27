#!/usr/bin/env bun

import { Command } from "commander";
import {
  launch, close, ensureRunning, openTab, getTabs, useTab, closeTab,
  getUrl, getTitle, getActiveTabId,
} from "./cdp";
import {
  find, click, type, wait, evaluate, console as browserConsole,
  html, text, back, forward, refresh, navigate, outline, hover,
} from "./page";
import { network, networkRequest, clearNetwork, type NetworkFilter } from "./network";
import { runDaemon } from "./network-daemon";
import {
  getCookies, getCookie, setCookie, deleteCookie, clearCookies,
  getStorageEntries, getStorageValue, setStorageValue, deleteStorageValue, clearStorage,
  type StorageType,
} from "./storage";
import { getConfig, setConfig, unsetConfig, type Config } from "./config";
import { fetchSkillFiles, AGENT_TARGETS, SUPPORTED_TARGETS } from "./skill-files";

const program = new Command();

program
  .name("browser")
  .description("CLI tool for controlling a Chromium browser via CDP")
  .version(process.env.VERSION ?? "0.0.0-dev");

program
  .command("start")
  .description("Start the browser")
  .option("--headless", "Run in headless mode")
  .action(async (options) => {
    const tabId = await launch({ headless: options.headless });
    console.log(`Started Chromium. Active tab: ${tabId}`);
  });

program
  .command("stop")
  .description("Stop the browser")
  .action(async () => {
    await close();
    console.log("Stopped Chromium.");
  });

program
  .command("open <url>")
  .description("Open a new tab with the given URL")
  .action(async (url) => {
    await ensureRunning();
    const { tabId } = await openTab(url);
    console.log(`Opened tab ${tabId}: ${url}`);
  });

program
  .command("tabs")
  .description("List all open tabs")
  .action(async () => {
    await ensureRunning();
    const { activeTabId, tabs } = await getTabs();
    console.log(`Active tab: ${activeTabId}`);
    for (const tab of tabs) {
      console.log(`${tab.id}  ${tab.url}  ${tab.title}`);
    }
  });

program
  .command("use <tab-id>")
  .description("Switch to a specific tab")
  .action(async (tabId) => {
    await ensureRunning();
    const ok = await useTab(tabId);
    if (ok) {
      console.log(`Active tab is now ${tabId}`);
    } else {
      console.error(`No such tab: ${tabId}`);
      process.exit(1);
    }
  });

program
  .command("close [tab-id]")
  .description("Close a tab (defaults to active tab)")
  .action(async (tabId) => {
    await ensureRunning();
    const closed = await closeTab(tabId);
    if (closed !== null) {
      console.log(`Closed tab ${closed}`);
    } else {
      console.error(tabId ? `No such tab: ${tabId}` : "No active tab");
      process.exit(1);
    }
  });

program
  .command("active")
  .description("Print the active tab ID")
  .action(async () => {
    const tabId = await getActiveTabId();
    if (tabId !== null) {
      console.log(tabId);
    } else {
      console.error("No browser session");
      process.exit(1);
    }
  });

program
  .command("url")
  .description("Print the URL of the active tab")
  .action(async () => {
    await ensureRunning();
    const url = await getUrl();
    console.log(url);
  });

program
  .command("title")
  .description("Print the title of the active tab")
  .action(async () => {
    await ensureRunning();
    const title = await getTitle();
    console.log(title);
  });

program
  .command("find <selector>")
  .description("Find elements matching a CSS selector")
  .action(async (selector) => {
    await ensureRunning();
    const count = await find(selector);
    console.log(`Found ${count} match${count === 1 ? "" : "es"} for: ${selector}`);
  });

program
  .command("click <selector>")
  .description("Click an element matching a CSS selector")
  .action(async (selector) => {
    await ensureRunning();
    await click(selector);
    console.log(`Clicked: ${selector}`);
  });

program
  .command("type <text> <selector>")
  .description("Type text into an element matching a CSS selector")
  .action(async (txt, selector) => {
    await ensureRunning();
    await type(txt, selector);
    console.log(`Typed into: ${selector}`);
  });

program
  .command("wait <selector>")
  .description("Wait for an element matching a CSS selector to appear")
  .action(async (selector) => {
    await ensureRunning();
    await wait(selector);
    console.log(`Visible: ${selector}`);
  });

program
  .command("hover <selector>")
  .description("Move mouse to element matching a CSS selector")
  .action(async (selector) => {
    await ensureRunning();
    await hover(selector);
    console.log(`Hovered: ${selector}`);
  });

program
  .command("eval <js>")
  .description("Evaluate JavaScript in the active tab")
  .action(async (js) => {
    await ensureRunning();
    const result = await evaluate(js);
    if (result !== undefined) {
      console.log(typeof result === "object" ? JSON.stringify(result, null, 2) : result);
    }
  });

program
  .command("back")
  .description("Go back in history")
  .action(async () => {
    await ensureRunning();
    const ok = await back();
    if (!ok) {
      console.error("No previous page");
      process.exit(1);
    }
  });

program
  .command("forward")
  .description("Go forward in history")
  .action(async () => {
    await ensureRunning();
    const ok = await forward();
    if (!ok) {
      console.error("No next page");
      process.exit(1);
    }
  });

program
  .command("refresh")
  .description("Reload the active tab")
  .action(async () => {
    await ensureRunning();
    await refresh();
  });

program
  .command("navigate <url>")
  .description("Navigate the active tab to a URL")
  .action(async (url) => {
    await ensureRunning();
    await navigate(url);
    console.log(`Navigated to: ${url}`);
  });

program
  .command("console")
  .description("Stream console output from the active tab (tip: run detached with `browser console > /tmp/console.log 2>&1 &`)")
  .action(async () => {
    await ensureRunning();
    const stop = await browserConsole((t, args) => {
      const prefix = t === "log" ? "" : `[${t}] `;
      console.log(`${prefix}${args.join(" ")}`);
    });
    process.on("SIGINT", async () => {
      await stop();
      process.exit(0);
    });
    console.error("Listening for console output... (Ctrl+C to stop)");
  });

program
  .command("html [selector]")
  .description("Get HTML content of an element (default: body)")
  .option("-l, --limit <chars>", "Character limit", "2000")
  .action(async (selector = "body", options) => {
    await ensureRunning();
    const limit = parseInt(options.limit, 10);
    const result = await html(selector, limit);
    if (result.truncated) {
      console.log(`[truncated: showing ${limit} of ${result.originalLength} chars]`);
    }
    console.log(result.content);
  });

program
  .command("text [selector]")
  .description("Get text content of an element (default: body)")
  .option("-l, --limit <chars>", "Character limit", "2000")
  .option("--include-invisible", "Include text from hidden elements")
  .action(async (selector = "body", options) => {
    await ensureRunning();
    const limit = parseInt(options.limit, 10);
    const result = await text(selector, limit, !options.includeInvisible);
    if (result.truncated) {
      console.log(`[truncated: showing ${limit} of ${result.originalLength} chars]`);
    }
    console.log(result.content);
  });

program
  .command("outline [selector]")
  .description("Get structural outline of the page (default: body)")
  .option("-d, --depth <levels>", "Maximum depth", "6")
  .action(async (selector = "body", options) => {
    await ensureRunning();
    const depth = parseInt(options.depth, 10);
    const result = await outline(selector, depth);
    console.log(result);
  });

program
  .command("network [id]")
  .description("List network requests or show details of a specific request")
  .option("-f, --filter <pattern>", "Filter by URL pattern")
  .option("-t, --type <types>", "Filter by type (comma-separated: xhr,fetch,document,script,stylesheet,image,font,websocket,other)")
  .option("--failed", "Show only failed requests")
  .option("--headers", "Show headers (when viewing specific request)")
  .option("--body", "Show response body (when viewing specific request)")
  .option("--request-body", "Show request body (when viewing specific request)")
  .option("--clear", "Clear captured network requests for active tab")
  .action(async (id, options) => {
    await ensureRunning();

    if (options.clear) {
      await clearNetwork();
      console.log("Network requests cleared");
      return;
    }

    if (id) {
      const reqId = parseInt(id, 10);
      const request = await networkRequest(reqId);
      if (!request) {
        console.error(`Request #${reqId} not found`);
        process.exit(1);
      }

      const duration = request.duration ? `${Math.round(request.duration)}ms` : "pending";
      const status = request.status ?? (request.failed ? "FAILED" : "...");
      console.log(`${request.method} ${status} ${request.url}  ${duration}`);
      if (request.error) console.log(`Error: ${request.error}`);
      console.log();

      if (options.headers || (!options.body && !options.requestBody)) {
        console.log("Request Headers:");
        for (const [key, value] of Object.entries(request.requestHeaders)) {
          console.log(`  ${key}: ${value}`);
        }
        console.log();

        if (request.responseHeaders) {
          console.log("Response Headers:");
          for (const [key, value] of Object.entries(request.responseHeaders)) {
            console.log(`  ${key}: ${value}`);
          }
          console.log();
        }
      }

      if (options.requestBody && request.requestBody) {
        console.log("Request Body:");
        console.log(request.requestBody);
        console.log();
      }

      if (options.body) {
        if (request.responseBody) {
          console.log("Response Body:");
          console.log(request.responseBody);
        } else {
          console.log("Response Body: (not captured)");
        }
      }
    } else {
      const filter: NetworkFilter = {};
      if (options.filter) filter.pattern = options.filter;
      if (options.type) filter.type = options.type.split(",");
      if (options.failed) filter.failed = true;

      const { requests } = await network(filter);

      if (requests.length === 0) {
        console.log("No requests captured");
        return;
      }

      for (const req of requests) {
        const duration = req.duration ? `${Math.round(req.duration)}ms`.padStart(6) : "...".padStart(6);
        const status = req.status?.toString() ?? (req.failed ? "ERR" : "...");
        const method = req.method.padEnd(6);
        const failed = req.failed ? "  FAILED" : "";
        const url = req.url.length > 60 ? req.url.slice(0, 60) + "..." : req.url;
        console.log(`#${req.id.toString().padEnd(4)} ${method} ${status.padEnd(3)} ${url}  ${duration}${failed}`);
      }
    }
  });

const cookiesCmd = program
  .command("cookies [name]")
  .description("List cookies or get a specific cookie value")
  .action(async (name) => {
    await ensureRunning();
    if (name) {
      const cookie = await getCookie(name);
      if (!cookie) {
        console.error(`Cookie not found: ${name}`);
        process.exit(1);
      }
      console.log(cookie.value);
    } else {
      const cookies = await getCookies();
      if (cookies.length === 0) {
        console.log("No cookies");
        return;
      }
      for (const c of cookies) {
        const expires = c.expires === -1 ? "session" : new Date(c.expires * 1000).toISOString().split("T")[0];
        const value = c.value.length > 30 ? c.value.slice(0, 30) + "..." : c.value;
        console.log(`${c.name.padEnd(24)} ${value.padEnd(34)} ${c.domain.padEnd(20)} ${expires}`);
      }
    }
  });

cookiesCmd
  .command("set <name> <value>")
  .description("Set a cookie")
  .option("-d, --domain <domain>", "Cookie domain (defaults to current hostname)")
  .action(async function(name, value) {
    await ensureRunning();
    const options = this.optsWithGlobals();
    await setCookie(name, value, options.domain);
    console.log(`Set cookie: ${name}`);
  });

cookiesCmd
  .command("delete <name>")
  .description("Delete a cookie")
  .action(async (name) => {
    await ensureRunning();
    await deleteCookie(name);
    console.log(`Deleted cookie: ${name}`);
  });

cookiesCmd
  .command("clear")
  .description("Clear all cookies for the current origin")
  .action(async () => {
    await ensureRunning();
    await clearCookies();
    console.log("Cleared all cookies");
  });

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
        console.error(`Key not found: ${key}`);
        process.exit(1);
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
  .action(async function(key, value) {
    await ensureRunning();
    const options = this.optsWithGlobals();
    const type: StorageType = options.session ? "session" : "local";
    await setStorageValue(key, value, type);
    console.log(`Set ${type}Storage: ${key}`);
  });

storageCmd
  .command("delete <key>")
  .description("Delete a storage key")
  .action(async function(key) {
    await ensureRunning();
    const options = this.optsWithGlobals();
    const type: StorageType = options.session ? "session" : "local";
    await deleteStorageValue(key, type);
    console.log(`Deleted ${type}Storage: ${key}`);
  });

storageCmd
  .command("clear")
  .description("Clear all storage")
  .action(async function() {
    await ensureRunning();
    const options = this.optsWithGlobals();
    const type: StorageType = options.session ? "session" : "local";
    await clearStorage(type);
    console.log(`Cleared ${type}Storage`);
  });

program
  .command("_network-daemon", { hidden: true })
  .action(runDaemon);

const configCmd = program
  .command("config [key]")
  .description("Show config or get a specific value")
  .action(async (key) => {
    const config = await getConfig();
    if (key) {
      const value = config[key as keyof Config];
      if (value === undefined) {
        console.error(`Config key not set: ${key}`);
        process.exit(1);
      }
      console.log(value);
    } else {
      if (Object.keys(config).length === 0) {
        console.log("No config set");
        return;
      }
      for (const [k, v] of Object.entries(config)) {
        console.log(`${k}: ${v}`);
      }
    }
  });

configCmd
  .command("set <key> <value>")
  .description("Set a config value")
  .action(async (key, value) => {
    await setConfig(key as keyof Config, value);
    console.log(`Set ${key}: ${value}`);
  });

configCmd
  .command("unset <key>")
  .description("Remove a config value")
  .action(async (key) => {
    await unsetConfig(key as keyof Config);
    console.log(`Unset ${key}`);
  });

program
  .command("add-skill <target>")
  .description(`Install the browser skill for an AI agent. Targets: ${SUPPORTED_TARGETS.join(", ")}`)
  .action(async (target: string) => {
    const targetPath = AGENT_TARGETS[target];
    if (!targetPath) {
      console.error(`Unknown target: ${target}`);
      console.error(`Supported targets: ${SUPPORTED_TARGETS.join(", ")}`);
      process.exit(1);
    }

    console.log(`Fetching skill files...`);
    const { skillMd, commandsMd } = await fetchSkillFiles();

    const fs = await import("fs");
    const path = await import("path");

    const skillDir = path.join(process.cwd(), targetPath);
    const referencesDir = path.join(skillDir, "references");

    fs.mkdirSync(referencesDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillMd);
    fs.writeFileSync(path.join(referencesDir, "COMMANDS.md"), commandsMd);

    console.log(`Installed browser skill to ${targetPath}/`);
  });

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
      console.error("Failed to check for updates");
      process.exit(1);
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
      console.error("Download failed");
      process.exit(1);
    }
    
    // Make executable
    if (platform !== "windows") {
      fs.chmodSync(installPath, 0o755);
    }
    
    console.log(`Updated to v${latestVersion}`);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
