# Known Bugs

- the default screenshot file name should be an actual timestamp not whatever this is: .screenshots/2025-12-27-22-44-22.png
- now that viewport size is fullscreen by default, window size doesn't match it when opening in headed mode. making it look like the content is cut off the screen.

## Agent usability issues

These issues make the CLI slow/frustrating for AI agents to use:

### 1. `click` with ambiguous text gives no guidance
When `click "15"` returns "Found 2 elements (exact) for: 15. Be more specific." there's no help on HOW to be more specific. Should show the matching elements with their selectors so the agent can self-correct:
```
Found 2 elements for "15":
  1. span[data-date="2025-12-15"] (in .calendar-december)
  2. span[data-date="2026-01-15"] (in .calendar-january)
Use a CSS selector: browser click "span[data-date='2026-01-15']"
```
Show unique attributes on the element itself first (id, data-*, aria-label, name, type). Fall back to parent selector when element has no unique attributes.

### 2. `outline -i` misses important interactive elements
Calendar date cells, dropdown options, and other dynamic interactive elements don't appear in `outline -i`. This forces agents to guess selectors or use `html` to discover them.

Should include: `[role="button"]`, `[role="gridcell"]`, `[tabindex]`, elements with common data attributes like `[data-date]`, `[data-value]`, and elements with `cursor: pointer` style. Could also use CDP's `DOMDebugger.getEventListeners` to find elements with event listeners.

### 3. No element visibility check before click
`click` succeeds even if element is off-screen or obscured. Should auto-scroll into view or warn.


