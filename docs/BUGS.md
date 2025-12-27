# Known Bugs


## `openTab` has fallback logic

`cdp.ts:openTab()` tries `createTabViaDaemon()` first, then falls back to `CDP.New()`. This violates the "no fallback" rule - should use daemon as the sole path.

## `click` doesn't wait for SPA navigation

`click` returns immediately after firing the click event. On SPAs with client-side routing, the URL/page content hasn't updated yet when the command returns. Callers need to manually `wait` for expected elements after clicking navigation links.

## If user closes the active tab, future commands will error out

## When you tell the agent to refresh the page, it tends to open a new tab. skill & --help documentation must not be clear enough about refresh
