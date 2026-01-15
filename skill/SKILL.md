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

**Prefer `outline` and `text` over screenshots.** These commands return structured text that's faster to process and more reliable for understanding page content. Use screenshots only when visual layout matters (debugging CSS, capturing evidence, visual regression).

## Commands

```bash
# See the page
browser outline                   # Interactive elements with labels [l1], [b2], etc.
browser outline -a [depth]        # Full page structure (default depth: 6)
browser text [selector]           # Extract text content

# Interact
browser click <selector>          # Click by label, CSS selector, or text content
browser type <text> <selector>    # Type into input
browser wait <selector>           # Wait for element (15s timeout, CSS only)
browser scroll <target>           # Scroll to top, bottom, or selector

# Navigate
browser open <url>                # Open URL (starts headless, shows outline)
browser navigate <url>            # Navigate current tab (shows outline)
browser back / forward / refresh  # History navigation (shows outline)
```

## Outline

Navigation commands (`open`, `navigate`, `back`, `forward`, `refresh`, `click`) automatically show an outline of interactive elements. Each element has a label like `[l1]` (link), `[b2]` (button), `[i3]` (input):

```
[l1] link "Products" [href=/products]
[l2] link "About" [href=/about]
[b3] button "Sign up"
[i4] input [type=email] [placeholder="Email"]
```

Click elements by their label, text content, or CSS selector.

## Selectors

`click` supports labels, text matching, and CSS selectors:

```bash
browser click l3                 # Label from outline (fastest)
browser click "Sign up"          # Text match (exact first, then partial)
browser click ".btn-primary"     # CSS selector
```

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

Browser sessions are persistent by default - logins, cookies, and browsing data are preserved across sessions in `~/.browser/profile/`.

To clear the profile (logout, reset cookies):

```bash
browser config clear-profile
```

To disable persistent profiles (ephemeral sessions):

```bash
browser config set persistentProfile false
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
