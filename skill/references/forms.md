# Forms & Authentication

## Commands

```bash
browser click <selector>              # Click by CSS selector or text content
browser type <text> <selector>        # Type into input field (CSS selector)
browser type "Escape"                 # Send special key (Escape, Enter, Tab)
browser type "ctrl+a"                 # Send key combination
browser find <selector>               # Find by CSS selector or text content
browser wait <selector>               # Wait for element (CSS selector)
browser eval <js>                     # Set values programmatically
```

## Workflow: Login

```bash
browser open https://example.com/login
browser outline -i

browser type "user@example.com" "#email"
browser type "password123" "#password"
browser click "Log in"

browser wait ".dashboard"
browser stop
```

## Workflow: Multi-step Form

```bash
browser open https://example.com/signup

browser type "John" "#first-name"
browser type "Doe" "#last-name"
browser click "Next"

browser wait "#address"
browser type "123 Main St" "#address"
browser click "Submit"

browser wait ".confirmation"
browser stop
```

## Tips

- Use `browser outline -i` to discover form fields and buttons
- Use `wait` after `click` if the page changes or content loads
- Click by text when button text is unique: `browser click "Submit"` or `browser click "Next"`
- For dropdowns: `browser click "select#country"` then `browser click "option[value='US']"`
- For checkboxes/radios: `browser click "input[name='agree']"`
- Clear existing input: `browser eval "document.querySelector('#field').value = ''"`
- Submit without button: `browser type "Enter" "#last-field"`
