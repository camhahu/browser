# TODO

## Important

- `waitfor:hidden`, `waitfor:navigation` - wait variants beyond element visibility

## Nice to have

- `network` - wait for network idle, useful after actions
- `scroll --by <pixels>` - scroll by pixel amount, not just to selector/top/bottom

## Not doing

- **Command chaining / scripting** - For simple tasks, single commands or shell `&&` work fine. For complex automation, use Playwright/Puppeteer. Chaining would put this CLI in an awkward middle ground. The value prop is ad-hoc terminal interaction, not scripting.
