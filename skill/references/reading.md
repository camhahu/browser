# Reading Pages

Use `outline` as your primary way to see and understand pages.

## Commands

```bash
browser outline                   # Interactive elements (links, buttons, inputs)
browser outline ".sidebar"        # Interactive elements within .sidebar
browser outline -a 4              # Full structure at depth 4
browser outline -a 4 ".sidebar"   # Full structure of .sidebar at depth 4
browser text [selector]           # Get visible text content
browser text -l 5000 ".article"   # Increase character limit
browser html [selector]           # Get raw HTML
browser find <selector>           # Count matching elements
browser wait <selector>           # Wait for element to appear
```

## Outline

`outline` shows what you can interact with:

```bash
browser outline

# header
#   nav
#     a "Home" [href=/]
#     a "Products" [href=/products]
#   form [role=search]
#     input [type=text] [placeholder="Search..."]
#     button "Search"
# main
#   a "Learn more" [href=/about]
#   button "Sign up"
```

`outline -a [depth]` shows full page structure:

```bash
browser outline -a 4

# header
#   nav
#     a "Home" [href=/]
#     a "Products" [href=/products]
#   form [role=search]
#     input [type=text] [placeholder="Search..."]
# main
#   div.hero "Welcome to our site..."
#   div.products ... (24)
```

## Workflow

```bash
browser open https://example.com
browser outline

browser click "Products"
browser text ".article-content"

browser stop
```

## Tips

- Use `outline` before clicking or typing - it shows available actions
- Use `outline -a [depth]` to understand page layout and find content
- `text` returns only visible text; use `html` for hidden content
- `wait` before `text` if content loads dynamically
