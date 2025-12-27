# TODO

## Important
- `waitfor:hidden`, `waitfor:navigation` - wait variants beyond element visibility
- `select <selector> <value>` - dropdown selection (common form element)

## Nice to have
- `scroll <selector>` / `scroll top/bottom` - scroll into view or page position
- `network` - wait for network idle, useful after actions

## Future (still under consideration)
- `screenshot` - LLMs need visual feedback to verify page state

## Refactoring
- `src/page.ts` (375 lines) - Consider splitting if DOM interaction vs page utilities become more distinct
- `src/network-daemon.ts` (330 lines) - Consider splitting daemon lifecycle from request processing

## Not doing
- **Command chaining / scripting** - For simple tasks, single commands or shell `&&` work fine. For complex automation, use Playwright/Puppeteer. Chaining would put this CLI in an awkward middle ground. The value prop is ad-hoc terminal interaction, not scripting.
