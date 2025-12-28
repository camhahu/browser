# Reading Pages

Use `outline` as your primary way to see and understand pages.

## Commands

```bash
browser outline -i                # Interactive elements (links, buttons, inputs)
browser outline -d 4              # Full structure at depth 4
browser text [selector]           # Get visible text content
browser text -l 5000 ".article"   # Increase character limit
browser html [selector]           # Get raw HTML
browser find <selector>           # Count matching elements
browser wait <selector>           # Wait for element to appear
```

## Outline

`outline -i` shows what you can interact with:

```bash
browser outline -i

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

`outline -d N` shows full page structure:

```bash
browser outline -d 4

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
browser start --headless
browser open https://example.com

# See what you can interact with
browser outline -i

# Click something from the outline
browser click "a[href=/products]"

# Read content
browser text ".article-content"

browser stop
```

## Tips

- Use `outline -i` before clicking or typing - it shows available actions
- Use `outline -d N` to understand page layout and find content
- `text` returns only visible text; use `html` for hidden content
- `wait` before `text` if content loads dynamically
