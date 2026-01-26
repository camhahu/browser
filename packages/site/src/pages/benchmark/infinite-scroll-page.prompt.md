# Infinite Scroll Benchmark

Test infinite scrolling with virtualization and scroll position management.

## Steps

### Basic Infinite Scroll

1. Navigate to the infinite-scroll page
2. Wait for initial load (800ms) - skeleton should appear then content
3. Verify first 20 items are loaded (check "Loaded: 20 / 500")
4. Scroll down within the feed container
5. When near bottom, verify more items load automatically
6. Continue scrolling until more batches load
7. Check the "Loaded" count increases by 20 each time

### Virtualization

1. Note the "Rendered" count in the stats
2. With virtualization ON, only ~15-25 items should be rendered
3. Toggle OFF the "Enable virtualization" checkbox
4. Scroll and verify "Rendered" now equals "Loaded" count
5. Toggle virtualization back ON

### Jump to Item

1. Enter "100" in the "Item #" input field
2. Click "Jump to" button
3. Verify scroll position moves to item #100
4. Check item #100 is visible with correct content

### Scroll Position

1. Scroll to a random position in the list
2. Note the "Scroll: XXXpx" value
3. Click "Scroll to top" button
4. Verify scroll returns to 0px
5. Click "Restore position" button
6. Verify scroll returns to previous position

### Load All Items

1. Scroll down repeatedly (or use Jump to high number)
2. Continue until "Loaded: 500 / 500" is reached
3. Verify "Load more" button disappears
4. Verify end message appears: "You've reached the end (500 items)"

### Manual Load More

1. Refresh page to reset
2. Scroll down but stop before auto-load triggers
3. Click "Load more" button manually
4. Verify next batch loads

## Success Criteria

- Initial load shows skeleton animation
- Infinite scroll triggers near bottom (IntersectionObserver)
- Virtualization renders only visible items + buffer
- Jump to scrolls to correct item
- Scroll position is tracked accurately
- Restore position returns to saved scroll
- Load more works both auto and manual
- End state shows correct message

## Edge Cases to Test

- Jump to item beyond loaded range (should load more first)
- Jump to invalid item number (0, negative, > 500)
- Very fast scrolling with virtualization
- Toggle virtualization while scrolled down
