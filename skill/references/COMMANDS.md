# Browser CLI Command Reference

## Browser Lifecycle

### start
Start the browser.
```bash
browser start           # Headed mode
browser start --headless  # Headless mode
```

### stop
Stop the browser and close all tabs.
```bash
browser stop
```

## Navigation

### open
Open a URL in a new tab.
```bash
browser open https://example.com
```

### back / forward / refresh
Navigate history or reload.
```bash
browser back
browser forward
browser refresh
```

### url / title
Get current page URL or title.
```bash
browser url
browser title
```

## Tab Management

### tabs
List all open tabs.
```bash
browser tabs
```

### use
Switch to a specific tab by ID.
```bash
browser use <tab-id>
```

### close
Close a tab (defaults to active tab).
```bash
browser close          # Close active tab
browser close <tab-id> # Close specific tab
```

### active
Print the active tab ID.
```bash
browser active
```

## Page Interaction

### find
Find elements matching a CSS selector (returns count).
```bash
browser find "button"
browser find ".nav-item"
```

### click
Click an element.
```bash
browser click "button.submit"
browser click "#login-btn"
```

### type
Type text into an element.
```bash
browser type "hello world" "#search-input"
browser type "user@example.com" "input[name=email]"
```

### wait
Wait for an element to appear.
```bash
browser wait ".loading-complete"
browser wait "#results"
```

## Content Extraction

### text
Get text content of an element (default: body).
```bash
browser text                    # Full page text
browser text ".article"         # Specific element
browser text -l 5000 ".article" # Custom char limit
```

### html
Get HTML content of an element (default: body).
```bash
browser html                    # Full page HTML
browser html ".article"         # Specific element
browser html -l 5000 ".article" # Custom char limit
```

### outline
Get structural outline of the page. Useful for understanding page structure.
```bash
browser outline                 # Full page structure
browser outline ".main"         # Specific section
browser outline -d 3 ".main"    # Limit depth
```

### eval
Evaluate JavaScript in the page context.
```bash
browser eval "document.title"
browser eval "document.querySelectorAll('a').length"
browser eval "JSON.stringify(window.appState)"
```

## Console

### console
Stream console output from the page (runs until Ctrl+C).
```bash
browser console
browser console > /tmp/console.log 2>&1 &  # Background with logging
```

## Network

### network
List captured network requests or show details.
```bash
browser network                    # List all requests
browser network -f "api"           # Filter by URL pattern
browser network -t xhr,fetch       # Filter by type
browser network --failed           # Show only failed
browser network 5                  # Show request #5 details
browser network 5 --body           # Include response body
browser network 5 --request-body   # Include request body
browser network --clear            # Clear captured requests
```

**Request types:** xhr, fetch, document, script, stylesheet, image, font, websocket, other

## Cookies

### cookies
List or get cookies.
```bash
browser cookies            # List all cookies
browser cookies session_id # Get specific cookie value
```

### cookies set
Set a cookie.
```bash
browser cookies set name value
browser cookies set name value -d .example.com  # With domain
```

### cookies delete
Delete a cookie.
```bash
browser cookies delete session_id
```

### cookies clear
Clear all cookies for current origin.
```bash
browser cookies clear
```

## Storage

### storage
List or get localStorage entries (use `-s` for sessionStorage).
```bash
browser storage            # List localStorage
browser storage -s         # List sessionStorage
browser storage mykey      # Get specific value
browser storage -s mykey   # From sessionStorage
```

### storage set
Set a storage value.
```bash
browser storage set key value
browser storage set -s key value  # sessionStorage
```

### storage delete
Delete a storage key.
```bash
browser storage delete key
browser storage delete -s key  # sessionStorage
```

### storage clear
Clear all storage.
```bash
browser storage clear
browser storage clear -s  # sessionStorage
```

## Selector Tips

Use standard CSS selectors:
- `#id` - By ID
- `.class` - By class
- `tag` - By tag name
- `[attr=value]` - By attribute
- `parent > child` - Direct child
- `ancestor descendant` - Any descendant
- `:nth-child(n)` - Position-based
