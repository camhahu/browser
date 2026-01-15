# Reading Pages

Use `outline` as your primary way to see and understand pages.

## Commands

```bash
browser outline                   # Interactive elements with labels [l1], [b2], etc.
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

`outline` shows interactive elements with clickable labels:

```bash
browser outline

# [l1] link "Home" [href=/]
# [l2] link "Products" [href=/products]
# [i3] input [type=text] [placeholder="Search..."]
# [b4] button "Search"
# [l5] link "Learn more" [href=/about]
# [b6] button "Sign up"
```

Labels persist between commands - use them directly with `click`:

```bash
browser click l2    # Click "Products" link
```

`outline -a [depth]` shows full page structure:

```bash
browser outline -a 4

# header
#   nav
#     [l1] link "Home" [href=/]
#     [l2] link "Products" [href=/products]
#   form [role=search]
#     [i3] input [type=text] [placeholder="Search..."]
# main
#   div.hero "Welcome to our site..."
#   div.products ... (24)
```

## Workflow

```bash
browser open https://example.com    # Shows outline automatically
browser click l2 && browser text ".article-content"
browser stop
```

## Tips

- Navigation commands show outline automatically - no need to run `outline` separately
- Use `outline -a [depth]` to understand page layout and find content
- Click by label (e.g., `l3`) is fastest; labels persist between commands
- `text` returns only visible text; use `html` for hidden content
- `wait` before `text` if content loads dynamically
