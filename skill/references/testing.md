# Visual Testing & Screenshots

## Commands

```bash
browser screenshot [name]             # Save to .screenshots/<name>.png
browser screenshot -f jpeg            # Use jpeg or webp format
browser viewport desktop              # 1920x1080
browser viewport tablet               # 768x1024
browser viewport mobile               # 375x667
browser viewport set <width> <height> # Custom dimensions
browser find <selector>               # Verify element exists
browser text <selector>               # Verify text content
```

## Workflow: Responsive Testing

```bash
browser start --headless
browser open https://example.com

browser viewport desktop
browser screenshot homepage-desktop

browser viewport tablet
browser screenshot homepage-tablet

browser viewport mobile
browser screenshot homepage-mobile

browser stop
```

## Workflow: Visual Verification

```bash
browser start --headless
browser open https://example.com

# Verify elements render
browser find ".hero-image"
browser find ".navigation"

# Check text content
browser text "h1"

# Capture for comparison
browser screenshot before-change

# ... make changes ...

browser screenshot after-change
browser stop
```

## Tips

- Screenshots capture the viewport, not the full page
- Viewport changes apply to the active tab only
- Use descriptive screenshot names for easy comparison
- `find` returns count - use to verify elements exist before screenshot
- Mobile/tablet viewports set `mobile: true` for proper touch emulation
