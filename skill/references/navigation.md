# Navigation & Session Management

## Commands

```bash
# Lifecycle
browser start [--headless]    # Start browser (use --headless for automation)
browser stop                  # Close browser and all tabs

# Navigation
browser open <url>            # Open URL in NEW tab (switches to it)
browser navigate <url>        # Navigate CURRENT tab to URL
browser refresh               # Reload current page
browser back                  # Go back in history
browser forward               # Go forward in history
browser url                   # Get current URL
browser title                 # Get page title

# Tabs
browser tabs                  # List all tabs with IDs
browser use <tab-id>          # Switch to tab
browser close [tab-id]        # Close tab (default: active)
browser active                # Get active tab ID
```

## Workflow: Multi-page Flow

```bash
browser start --headless
browser open https://example.com

browser click "a.products-link"
browser wait ".product-list"

browser click ".product-item:first-child"
browser wait ".product-details"

browser back
browser wait ".product-list"

browser stop
```

## Workflow: Multiple Tabs

```bash
browser start --headless

# Open multiple pages
browser open https://example.com/page1
browser open https://example.com/page2
browser open https://example.com/page3

# List tabs
browser tabs

# Switch between them
browser use abc1
browser text "h1"

browser use def2
browser text "h1"

# Close specific tab
browser close def2

browser stop
```

## Tips

- `open` creates a new tab; `navigate` reuses current tab
- Navigation commands wait for page load before returning
- Tab IDs are short (4 chars) - use `browser tabs` to see them
- Always `browser stop` when finished to clean up
- `--headless` is faster and works in CI environments
