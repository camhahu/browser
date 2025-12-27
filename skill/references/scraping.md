# Scraping & Data Extraction

## Commands

```bash
browser text [selector]           # Get visible text (default: body)
browser text -l 5000 ".article"   # Increase character limit
browser html [selector]           # Get raw HTML
browser outline [selector]        # Get page structure overview
browser outline -d 3 "main"       # Limit depth
browser find <selector>           # Count matching elements
browser wait <selector>           # Wait for element to appear
browser eval <js>                 # Run JavaScript for complex extraction
```

## Workflow

```bash
browser start --headless
browser open https://example.com

# Understand page structure first
browser outline

# Extract content
browser text ".article-content"

# For structured data, use eval
browser eval "JSON.stringify([...document.querySelectorAll('.item')].map(el => ({title: el.querySelector('h2').textContent, price: el.querySelector('.price').textContent})))"

browser stop
```

## Tips

- Use `outline` first to understand page structure before writing selectors
- `text` returns only visible text; use `html` if you need hidden content
- `wait` before `text` if content loads dynamically
- For paginated content, use `click` on next button then `wait` for new content
- `eval` can return complex JSON structures for structured scraping
