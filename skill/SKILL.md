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

## Usage

Use `--headless` by default. Always run `browser stop` when finished. Navigation commands (`open`, `navigate`) wait for page load before returning.

```bash
browser start --headless
browser open https://example.com
browser text ".content"            # Page is already loaded, no sleep needed
browser click "button.submit"
browser wait ".result"             # Wait for dynamic content after click
browser text ".result"
browser stop
```

## Commands

| Command | Purpose |
|---------|---------|
| `browser start [--headless]` | Launch browser (use --headless by default) |
| `browser stop` | Close browser (always clean up) |
| `browser open <url>` | Navigate to URL |
| `browser click <selector>` | Click element |
| `browser type <text> <selector>` | Type into input |
| `browser find <selector>` | Count matching elements |
| `browser wait <selector>` | Wait for element to appear |
| `browser text [selector]` | Get text content |
| `browser html [selector]` | Get HTML content |
| `browser outline [selector]` | Get page structure (useful before interacting) |
| `browser eval <js>` | Run JavaScript |
| `browser network` | List captured network requests |

All selectors use CSS syntax. See [references/COMMANDS.md](references/COMMANDS.md) for full reference.
