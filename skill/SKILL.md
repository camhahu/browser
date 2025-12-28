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

browser outline -i                # 1. See interactive elements
browser click "Products"          # 2. Click by text or CSS selector
browser wait ".product-list"      # 3. Wait for content to load
browser text ".product-list"      # 4. Read content

browser stop                      # Always stop when finished
```

## Commands

```bash
# See the page
browser outline -i                # Interactive elements (links, buttons, inputs)
browser outline                   # Full page structure
browser text [selector]           # Extract text content

# Interact
browser click <selector>          # Click (CSS selector or text content)
browser type <text> <selector>    # Type into input
browser wait <selector>           # Wait for element

# Navigate
browser open <url>                # Open URL (starts headless if needed)
browser navigate <url>            # Navigate current tab
browser back / forward / refresh
```

## Outline

Use `outline` to see what you can interact with before clicking:

```bash
browser outline -i
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

## Use Cases

| Task | Reference |
|------|-----------|
| Reading and extracting content | [reading.md](references/reading.md) |
| Forms and authentication | [forms.md](references/forms.md) |
| Multi-page flows and tabs | [navigation.md](references/navigation.md) |
| Screenshots and visual testing | [testing.md](references/testing.md) |
| Network, cookies, storage | [debugging.md](references/debugging.md) |
