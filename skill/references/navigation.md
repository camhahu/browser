# Navigation & Session Management

## Commands

```bash
# Lifecycle
browser start             # Start headed browser (for debugging)
browser stop              # Close browser and all tabs

# Navigation
browser open <url>        # Open URL (starts headless if needed)
browser navigate <url>    # Navigate current tab
browser back / forward    # History navigation
browser refresh           # Reload current page
browser url / title       # Get current URL or title

# Tabs
browser tabs              # List all tabs
browser use <tab-id>      # Switch to tab
browser close [tab-id]    # Close tab (default: active)
```

## Workflow: Multi-page Flow

```bash
browser open https://example.com
browser outline -i

browser click "Products"
browser wait ".product-list"

browser click ".product-item:first-child"
browser wait ".product-details"

browser back
browser wait ".product-list"

browser stop
```

## Workflow: Multiple Tabs

```bash
browser open https://example.com/page1
browser open https://example.com/page2
browser open https://example.com/page3

browser tabs
browser use abc1
browser text "h1"

browser use def2
browser text "h1"

browser close def2
browser stop
```

## Tips

- `open` starts headless automatically; use `start` for headed debugging
- `open` creates a new tab; `navigate` reuses current tab
- Navigation commands wait for page load before returning
- Tab IDs are short (4 chars) - use `browser tabs` to see them
- Always `browser stop` when finished
