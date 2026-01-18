# TODO

- **Action output** - `type` and similar commands should print something like the selector text after the action completes.

## Not doing

- **Command chaining / scripting** - For simple tasks, single commands or shell `&&` work fine. For complex automation, use Playwright/Puppeteer. Chaining would put this CLI in an awkward middle ground. The value prop is ad-hoc terminal interaction, not scripting.
