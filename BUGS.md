# Known Bugs

## click succeeds on nonexistent elements
`browser click ".nonexistent"` returns success instead of error.

## No command shows "Unknown command: undefined"
`browser` (no args) should say "No command provided".

## Closing active tab can desync state
`browser close` repeatedly can leave activeTabId pointing to closed tab.

## Stale active tab causes cryptic error
Operations on stale active tab show "undefined is not an object" instead of "No such tab".
