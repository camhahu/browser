---
name: browser
description: Control a Chromium browser via CDP. Use when automating web browsing, scraping pages, testing web apps, monitoring network traffic, or interacting with page elements.
compatibility: Requires Chromium/Chrome installed and the browser CLI in PATH.
metadata:
  author: browser-cli
  version: "1.0"
---

# Browser CLI Skill

Control a Chromium browser via CDP. Install: https://github.com/camhahu/browser

```bash
curl -fsSL https://raw.githubusercontent.com/camhahu/browser/main/install.sh | bash
```

## Core Loop

```bash
browser open https://example.com  # Starts headless browser, shows outline

browser click l3                  # 1. Click by label from outline
browser wait ".product-list"      # 2. Wait for content to load
browser text ".product-list"      # 3. Read content

browser stop                      # Always stop when finished
```

**Prefer `text` over screenshots.** Text is faster and more reliable. Use screenshots only when visual layout matters.

## Commands

```bash
browser open <url>                # Open URL, shows outline (starts headless browser)
browser click <selector>          # Click by label, text, or CSS (shows outline)
browser type <text> <selector>    # Type into input (special keys: Enter, Escape, Tab)
browser wait <selector>           # Wait for element (15s timeout)
browser text [selector]           # Extract text content
browser scroll <target>           # Scroll to top, bottom, or selector
browser navigate <url>            # Navigate current tab (shows outline)
browser back / forward / refresh  # History navigation (shows outline)
browser outline                   # Show outline again (or use -a for full structure)
browser start                     # Start headed browser (for debugging)
browser stop                      # Close browser
```

Run `browser --help` for full command list, `browser <command> --help` for options.

## Outline

Navigation commands (`open`, `click`, `navigate`, `back`, `forward`, `refresh`) automatically show an outline of interactive elements with labels:

```
[l1] link "Products" [href=/products]
[l2] link "About" [href=/about]
[b3] button "Sign up"
[i4] input [type=email] [placeholder="Email"]
```

## Selectors

```bash
browser click l3                 # Label from outline (fastest)
browser click "Sign up"          # Text match (exact first, then partial)
browser click ".btn-primary"     # CSS selector
```

CSS selectors: `#id`, `.class`, `tag`, `[attr=value]`, `parent > child`

## Persistent Profile

Logins, cookies, and browsing data are preserved across sessions in `~/.browser/profile/`.

```bash
browser config clear-profile              # Logout, reset cookies
browser config set persistentProfile false # Disable persistence
```
