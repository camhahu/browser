# TODO

## Critical
- `screenshot` - LLMs need visual feedback to verify page state
- `html` / `text` - get page content to verify elements, read text, understand page structure
- `navigate <url>` - navigate current tab (vs `open` which creates new tab)

## Important
- `eval <js>` - run arbitrary JS for complex interactions (fill forms, scroll, etc.)
- `waitfor:hidden`, `waitfor:navigation` - wait variants beyond element visibility
- `back` / `forward` / `refresh` - basic navigation
- `select <selector> <value>` - dropdown selection (common form element)

## Nice to have
- `hover <selector>` - trigger hover states/menus
- `scroll <selector>` / `scroll top/bottom` - scroll into view or page position
- `pdf` - save page as PDF for records
- `cookies` / `storage` - inspect/manipulate state
- `network` - wait for network idle, useful after actions

## Output format
- `--json` flag for structured output that LLMs can parse reliably
