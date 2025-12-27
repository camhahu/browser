# Known Bugs

## `openTab` has fallback logic

`cdp.ts:openTab()` tries `createTabViaDaemon()` first, then falls back to `CDP.New()`. This violates the "no fallback" rule - should use daemon as the sole path.

## If user closes the active tab, future commands will error out
