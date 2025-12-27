# Browser CLI Command Reference

## Lifecycle

```bash
browser start [--headless]    # Start browser (prefer --headless)
browser stop                  # Stop browser and close all tabs
```

## Navigation

```bash
browser open <url>            # Open URL in new tab
browser navigate <url>        # Navigate current tab to URL
browser back                  # Go back
browser forward               # Go forward
browser refresh               # Reload page
browser url                   # Get current URL
browser title                 # Get page title
```

## Tabs

```bash
browser tabs                  # List all tabs
browser use <tab-id>          # Switch to tab
browser close [tab-id]        # Close tab (default: active)
browser active                # Get active tab ID
```

## Interaction

```bash
browser find <selector>                 # Count matching elements
browser click <selector>                # Click element
browser type <text> <selector>          # Type into element
browser wait <selector>                 # Wait for element to appear
```

## Content

```bash
browser text [selector]                 # Get text (default: body)
browser text -l 5000 ".article"         # With char limit
browser html [selector]                 # Get HTML (default: body)
browser outline [selector]              # Get page structure
browser outline -d 3 ".main"            # Limit depth
browser eval <js>                       # Run JavaScript
```

## Network

```bash
browser network                         # List captured requests
browser network -f "api"                # Filter by URL pattern
browser network -t xhr,fetch            # Filter by type (xhr,fetch,document,script,stylesheet,image,font,websocket,other)
browser network --failed                # Show only failed
browser network <id>                    # Show request details
browser network <id> --body             # Include response body
browser network <id> --request-body     # Include request body
browser network --clear                 # Clear captured requests
```

## Cookies

```bash
browser cookies                         # List all
browser cookies <name>                  # Get value
browser cookies set <name> <value>      # Set cookie
browser cookies set <name> <value> -d <domain>
browser cookies delete <name>           # Delete cookie
browser cookies clear                   # Clear all
```

## Storage

Use `-s` flag for sessionStorage (default: localStorage).

```bash
browser storage                         # List entries
browser storage <key>                   # Get value
browser storage set <key> <value>       # Set value
browser storage delete <key>            # Delete key
browser storage clear                   # Clear all
```

## Console

```bash
browser console                         # Stream console output (Ctrl+C to stop)
```

## Selectors

CSS selector syntax: `#id`, `.class`, `tag`, `[attr=value]`, `parent > child`, `ancestor descendant`, `:nth-child(n)`
