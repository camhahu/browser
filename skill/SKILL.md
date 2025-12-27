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

## Quick Start

```bash
browser start --headless
browser open https://example.com
browser text "h1"
browser stop
```

Always use `--headless` for automation. Always run `browser stop` when finished.

## Use Cases

| Task | Reference |
|------|-----------|
| Extract text, HTML, structured data from pages | [scraping.md](references/scraping.md) |
| Fill forms, login, submit data | [forms.md](references/forms.md) |
| Screenshots, responsive testing, visual verification | [testing.md](references/testing.md) |
| Inspect network requests, cookies, storage, console | [debugging.md](references/debugging.md) |
| Multi-page flows, tabs, history navigation | [navigation.md](references/navigation.md) |

## Selectors

All commands use CSS selector syntax:

```
#id                    Element with id
.class                 Elements with class
tag                    Elements by tag name
[attr=value]           Attribute selector
parent > child         Direct child
ancestor descendant    Any descendant
:nth-child(n)          Position-based
```
