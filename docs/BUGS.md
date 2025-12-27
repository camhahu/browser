# Known Bugs
- the default screenshot file name should be an actual timestamp not whatever this is: .screenshots/2025-12-27-22-44-22.png
- now that viewport size is fullscreen by default, window size doesn't match it when opening in headed mode. making it look like the content is cut off the screen.
- screenshots always seems to add .png etc to the end (well the agent always seems to) we should fix that in a good way:w
- Started Chromium. Active tab: 539AB8B0A580CB8937AD015EF4DF1BC2 (should be new tabIds)
## CLI bugs
- `click` command doesn't work with text content (e.g. `browser click "Submit"` fails) - should support text-based selection like `browser click "text=Submit"`
- No `scroll` command - need a way to scroll the page or within specific elements
- `outline` command output isn't detailed enough - shows generic structure but no text content or useful selectors to help identify clickable elements

## Documentation bugs
- `wait` command syntax not documented in skill - agent guessed `--timeout` flag which doesn't exist
- Skill doesn't guide agent to prefer `outline`/`text` over screenshots for understanding page structure
