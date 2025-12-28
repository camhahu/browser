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
browser outline -i              # See interactive elements
browser click "a.products"      # Click using selector from outline
browser text ".content"         # Extract text
browser stop
```

Always use `--headless` for automation. Always run `browser stop` when finished.

## Page Discovery

Use `outline` to understand page structure before interacting:

```bash
browser outline -i          # Interactive elements only (links, buttons, inputs)
browser outline -d 4        # Full structure at depth 4
```

Output shows selectors, text content, and attributes you can use:
```
header
  nav
    a "Products" [href=/products]
    a "About" [href=/about]
main
  button "Sign up" [aria-label="Create account"]
  input [type=email] [placeholder="Email"]
```

## Use Cases

| Task | Reference |
|------|-----------|
| Understanding page structure, extracting content | [reading.md](references/reading.md) |
| Fill forms, login, submit data | [forms.md](references/forms.md) |
| Multi-page flows, tabs, history navigation | [navigation.md](references/navigation.md) |
| Screenshots, visual verification | [testing.md](references/testing.md) |
| Network requests, cookies, storage, console | [debugging.md](references/debugging.md) |

## Selectors

The `click` and `find` commands support both CSS selectors and text matching:

```bash
browser click ".btn-primary"     # CSS selector
browser click "Sign up"          # Text match (exact first, then partial)
browser find "Submit"            # Find by button/link text
```

Text matching searches clickable elements (links, buttons, inputs) and prefers exact matches over partial.

CSS selector syntax for all commands:

```
#id                    Element with id
.class                 Elements with class
tag                    Elements by tag name
[attr=value]           Attribute selector
parent > child         Direct child
ancestor descendant    Any descendant
:nth-child(n)          Position-based
```
