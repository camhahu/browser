# Forms & Authentication

## Commands

```bash
browser click <selector>              # Click buttons, links, checkboxes
browser type <text> <selector>        # Type into input field
browser type "Escape"                 # Send special key (Escape, Enter, Tab)
browser type "ctrl+a"                 # Send key combination
browser find <selector>               # Verify element exists
browser wait <selector>               # Wait for element to appear
browser eval <js>                     # Set values programmatically
```

## Workflow: Login

```bash
browser start --headless
browser open https://example.com/login

browser type "user@example.com" "#email"
browser type "password123" "#password"
browser click "button[type=submit]"

# Wait for redirect/dashboard
browser wait ".dashboard"
browser stop
```

## Workflow: Multi-step Form

```bash
browser start --headless
browser open https://example.com/signup

# Step 1
browser type "John" "#first-name"
browser type "Doe" "#last-name"
browser click ".next-button"

# Step 2 - wait for next page
browser wait "#address"
browser type "123 Main St" "#address"
browser click ".submit-button"

browser wait ".confirmation"
browser stop
```

## Tips

- Use `wait` after `click` if the page changes or content loads
- For dropdowns: `browser click "select#country"` then `browser click "option[value='US']"`
- For checkboxes/radios: `browser click "input[name='agree']"`
- Clear existing input: `browser eval "document.querySelector('#field').value = ''"`
- Submit without button: `browser type "Enter" "#last-field"`
