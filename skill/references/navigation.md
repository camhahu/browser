# Navigation & Session Management

## Commands

```bash
# Lifecycle
browser start             # Start headed browser (for debugging)
browser start --headless  # Start headless browser explicitly
browser stop              # Close browser and all tabs

# Navigation (all show outline automatically)
browser open <url>        # Open URL (starts headless if needed)
browser navigate <url>    # Navigate current tab
browser back / forward    # History navigation
browser refresh           # Reload current page
browser url / title       # Get current URL or title
browser scroll <target>   # Scroll to top, bottom, or CSS selector

# Tabs
browser tabs              # List all tabs
browser use <tab-id>      # Switch to tab
browser close [tab-id]    # Close tab (default: active)
```

## Workflow: Multi-page Flow

```bash
browser open https://example.com        # Shows outline with labels
browser click l3 && browser wait ".product-list"
browser click l1 && browser wait ".product-details"
browser back && browser wait ".product-list"
browser stop
```

## Workflow: Multiple Tabs

```bash
browser open https://example.com/page1 && browser open https://example.com/page2 && browser open https://example.com/page3
browser tabs && browser use abc1 && browser text "h1"
browser use def2 && browser text "h1"
browser close def2 && browser stop
```

## Tips

- `open` starts headless automatically; use `start` or `start --headed` for debugging
- `open` creates a new tab; `navigate` reuses current tab
- Navigation commands show outline automatically after page loads
- Tab IDs are short (4 chars) - use `browser tabs` to see them
- Always `browser stop` when finished
