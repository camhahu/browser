# Data Table Benchmark

Test a data table with sorting, filtering, inline editing, and bulk actions.

## Steps

1. Navigate to the data table page
2. Wait for the loading skeleton to complete (800ms)
3. Use the search input to filter by name (e.g., "Alice")
4. Clear search and filter by status dropdown (select "active")
5. Filter by department dropdown (select "Engineering")
6. Click column headers to sort:
   - Click "Name" to sort ascending
   - Click "Name" again to sort descending
   - Click "Last Active" to sort by date
7. Click on a user's name cell to edit inline
8. Change the name and press Enter to save (or Escape to cancel)
9. Select multiple rows using checkboxes:
   - Click first checkbox
   - Shift+click another checkbox to select range
10. With rows selected, click "Delete selected"
11. Verify deleted rows are removed
12. Select more rows and click "Export selected"
13. Use pagination to navigate pages:
    - Click "Next" button
    - Click page number buttons
    - Click "Previous" button
14. Clear all filters and verify empty state doesn't appear
15. Search for non-existent term to see empty state
16. Click "Clear filters" in empty state

## Success Criteria

- Table loads with skeleton animation
- Search debounces (300ms) and filters results
- Dropdown filters work correctly
- Sorting toggles between asc/desc
- Inline editing saves on Enter
- Multi-select with shift-click works
- Bulk delete removes rows
- Export downloads CSV file
- Pagination updates correctly
- Empty state shows when no results

## Edge Cases to Test

- Search with special characters
- Select all checkbox behavior
- Edit and immediately blur (should save)
- Delete all visible rows
