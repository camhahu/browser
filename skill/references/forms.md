# Forms & Authentication

## Commands

```bash
browser click <selector>              # Click by label, CSS selector, or text
browser type <text> <selector>        # Type into input field (CSS selector)
browser type "Escape"                 # Send special key (Escape, Enter, Tab)
browser type "ctrl+a"                 # Send key combination
browser find <selector>               # Find by CSS selector or text content
browser wait <selector>               # Wait for element (CSS selector)
browser eval <js>                     # Set values programmatically
```

## Workflow: Login

```bash
browser open https://example.com/login   # Shows outline with labels
browser type "user@example.com" "#email" && browser type "password123" "#password" && browser click b3
browser wait ".dashboard" && browser stop
```

## Workflow: Multi-step Form

```bash
browser open https://example.com/signup && browser type "John" "#first-name" && browser type "Doe" "#last-name" && browser click b1
browser wait "#address" && browser type "123 Main St" "#address" && browser click b1
browser wait ".confirmation" && browser stop
```

## Persistent Login

Persistent profiles are enabled by default - logins, cookies, and browsing data are preserved across sessions in `~/.browser/profile/`.

To clear the profile (logout, reset all cookies):

```bash
browser config clear-profile
```

To disable persistent profiles (ephemeral sessions):

```bash
browser config set persistentProfile false
```

## Tips

- Navigation commands show outline automatically - use labels to click elements
- Use `wait` after `click` if the page changes or content loads
- Click by label (e.g., `b3`) is fastest; text/CSS selectors also work
- For dropdowns: `browser click "select#country"` then `browser click "option[value='US']"`
- For checkboxes/radios: `browser click "input[name='agree']"`
- Clear existing input: `browser eval "document.querySelector('#field').value = ''"`
- Submit without button: `browser type "Enter" "#last-field"`
