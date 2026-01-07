# Debugging & Inspection

## Commands

```bash
# Network
browser network                       # List captured requests
browser network -f "api"              # Filter by URL pattern
browser network -t xhr,fetch          # Filter by type
browser network --failed              # Show only failed requests
browser network <id>                  # Show request details
browser network <id> --body           # Include response body
browser network <id> --request-body   # Include request body
browser network --clear               # Clear captured requests

# Console
browser console                       # Show captured console output
browser console -l 100                # Show last 100 messages (default: 50)
browser console -t error,warning      # Filter by type
browser console --clear               # Clear captured messages

# Storage
browser cookies                       # List all cookies
browser cookies <name>                # Get cookie value
browser cookies set <name> <value>    # Set cookie
browser cookies delete <name>         # Delete cookie
browser cookies clear                 # Clear all cookies

browser storage                       # List localStorage entries
browser storage <key>                 # Get value
browser storage set <key> <value>     # Set value
browser storage -s                    # Use sessionStorage instead

# JavaScript
browser eval <js>                     # Run JavaScript in page context
```

## Workflow: Debug API Calls

```bash
browser open https://example.com && browser click "Load Data" && browser wait ".data-loaded"
browser network -f "api"
browser network abc123 --body
browser stop
```

## Workflow: Debug Authentication

```bash
browser open https://example.com/login && browser cookies && browser storage
browser type "user@example.com" "#email" && browser type "password" "#password" && browser click "Log in" && browser wait ".dashboard"
browser cookies && browser storage "authToken"
browser stop
```

## Workflow: Finding Selectors

When `click` fails or you need to find the right selector for dynamic elements:

```bash
# See interactive elements, then drill into specific area
browser outline && browser outline "table" && browser outline ".calendar"

# Get raw HTML to find actual attributes
browser html "table" | head -50

# Example: calendar date picker - output shows: <span data-date="2025-12-01" ...>
browser html "table" && browser click "span[data-date='2025-12-15']"
```

## Tips

- Network and console capture start automatically when browser launches
- Use `network --clear` and `console --clear` between test runs
- `eval` can access anything in page context: `browser eval "localStorage.getItem('key')"`
- Filter network by type: xhr, fetch, document, script, stylesheet, image, font, websocket
- Filter console by type: log, info, warning, error, debug
- When text matching fails (e.g. "15" matches multiple elements), use `html` to find unique attributes
