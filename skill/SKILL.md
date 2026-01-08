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
browser open https://example.com  # Starts headless browser if needed

browser outline                   # 1. See interactive elements
browser click "Products"          # 2. Click by text or CSS selector
browser wait ".product-list"      # 3. Wait for content to load
browser text ".product-list"      # 4. Read content

browser stop                      # Always stop when finished
```

**Prefer `outline` and `text` over screenshots.** These commands return structured text that's faster to process and more reliable for understanding page content. Use screenshots only when visual layout matters (debugging CSS, capturing evidence, visual regression).

## Commands

```bash
# See the page
browser outline                   # Interactive elements (links, buttons, inputs)
browser outline -a [depth]        # Full page structure (default depth: 6)
browser text [selector]           # Extract text content

# Interact
browser click <selector>          # Click (CSS selector or text content)
browser type <text> <selector>    # Type into input
browser wait <selector>           # Wait for element (15s timeout, CSS only)
browser scroll <target>           # Scroll to top, bottom, or selector

# Navigate
browser open <url>                # Open URL (starts headless if needed)
browser navigate <url>            # Navigate current tab
browser back / forward / refresh
```

## Outline

Use `outline` to see what you can interact with before clicking:

```bash
browser outline
```

```
nav
  a "Products" [href=/products]
  a "About" [href=/about]
main
  button "Sign up"
  input [type=email] [placeholder="Email"]
```

Click elements by their text content or build a CSS selector from the output.

## Selectors

`click` and `find` support CSS selectors and text matching:

```bash
browser click "Sign up"          # Text match (exact first, then partial)
browser click ".btn-primary"     # CSS selector
```

Text matching searches clickable elements (links, buttons, inputs).

CSS selector reference:

```
#id              .class           tag
[attr=value]     parent > child   ancestor descendant
```

## Chaining Commands

Commands can be chained with `&&`. No sleep needed - navigation commands wait for page load:

```bash
browser open https://example.com && browser click "Products" && browser text ".product-list"
```

```bash
browser navigate https://example.com && browser scroll bottom && browser screenshot
```

## Persistent Profile

By default, browser sessions are ephemeral - the profile is deleted on `browser stop`. Enable persistent profiles to preserve logins, cookies, and browsing data across sessions:

```bash
browser config set persistentProfile true
```

Profile is stored in `~/.browser/profile/`. To clear it (logout, reset cookies):

```bash
browser config clear-profile
```

To use a custom profile location:

```bash
browser config set profileDir /path/to/profile
```

## Use Cases

| Task                           | Reference                                 |
| ------------------------------ | ----------------------------------------- |
| Reading and extracting content | [reading.md](references/reading.md)       |
| Forms and authentication       | [forms.md](references/forms.md)           |
| Multi-page flows and tabs      | [navigation.md](references/navigation.md) |
| Screenshots and visual testing | [testing.md](references/testing.md)       |
| Network, cookies, storage      | [debugging.md](references/debugging.md)   |
