# Known Bugs
- the default screenshot file name should be an actual timestamp not whatever this is: .screenshots/2025-12-27-22-44-22.png
- now that viewport size is fullscreen by default, window size doesn't match it when opening in headed mode. making it look like the content is cut off the screen.
- screenshots always seems to add .png etc to the end (well the agent always seems to) we should fix that in a good way:w
## CLI bugs
- No `scroll` command - need a way to scroll the page or within specific elements

## Documentation bugs
- `wait` command syntax not documented in skill - agent guessed `--timeout` flag which doesn't exist
- Skill doesn't guide agent to prefer `outline`/`text` over screenshots for understanding page structure
