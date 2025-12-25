---
name: browser
description: Control a Chromium browser via CDP. Use when automating web browsing, scraping pages, testing web apps, monitoring network traffic, or interacting with page elements.
compatibility: Requires Chromium/Chrome installed. The browser CLI must be built and available in PATH.
metadata:
  author: browser-cli
  version: "1.0"
---

# Browser CLI Skill

Control a headless or headed Chromium browser via the Chrome DevTools Protocol (CDP).

## Quick Start

```bash
# Start browser and open a page
browser start
browser open https://example.com

# Interact with the page
browser click "button.submit"
browser type "hello" "#search-input"
browser wait ".results"

# Get page content
browser text ".content"
browser html ".content"
```

## Core Workflow

1. **Start** the browser with `browser start` (add `--headless` for headless mode)
2. **Navigate** with `browser open <url>`
3. **Interact** with `click`, `type`, `wait`
4. **Extract** with `text`, `html`, `outline`, `eval`
5. **Stop** with `browser stop`

## Essential Commands

| Command | Purpose |
|---------|---------|
| `browser start [--headless]` | Launch browser |
| `browser open <url>` | Open URL in new tab |
| `browser click <selector>` | Click element |
| `browser type <text> <selector>` | Type into input |
| `browser wait <selector>` | Wait for element |
| `browser text [selector]` | Get text content |
| `browser html [selector]` | Get HTML content |
| `browser outline [selector]` | Get page structure |
| `browser eval <js>` | Run JavaScript |
| `browser network` | List captured requests |
| `browser stop` | Close browser |

## Tips

- Use CSS selectors for all element targeting
- `browser outline` is useful for understanding page structure before interacting
- Network capture happens automatically; use `browser network` to inspect
- Use `browser eval` for complex interactions not covered by built-in commands

See [references/COMMANDS.md](references/COMMANDS.md) for complete command reference.
