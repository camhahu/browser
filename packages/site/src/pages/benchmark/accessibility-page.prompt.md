# Accessibility Benchmark

Test keyboard-only navigation and ARIA patterns.

## Steps

### Skip Link

1. Navigate to the accessibility page
2. Press Tab once to reveal the skip link
3. Press Enter to skip to main content
4. Verify focus moves to main content area

### Tab Navigation

1. Use arrow keys to navigate between tabs (Overview, Menu Bar, Tree View, Combobox)
2. Press ArrowRight to move to next tab
3. Press ArrowLeft to move to previous tab
4. Verify tab content changes when tab is selected

### Focus Trap Dialog

1. Navigate to Overview tab
2. Click "Open focus trap dialog" button
3. Verify focus moves to the dialog
4. Press Tab repeatedly - focus should cycle within dialog only
5. Press Shift+Tab - focus should cycle backwards
6. Press Escape to close dialog
7. Verify focus returns to the trigger button

### Menu Bar (Tab: Menu Bar)

1. Navigate to Menu Bar tab
2. Focus on "File" menu button
3. Press Enter or ArrowDown to open menu
4. Use ArrowDown/ArrowUp to navigate menu items
5. Press Enter to select an item
6. Verify menu closes and action is logged
7. Press ArrowRight to move to "Edit" menu
8. Press Escape to close menu without selecting

### Tree View (Tab: Tree View)

1. Navigate to Tree View tab
2. Focus on "src" folder in the tree
3. Press ArrowDown to move to next item
4. Press ArrowRight to expand a folder
5. Press ArrowLeft to collapse a folder
6. Press ArrowUp to move to previous item
7. Press Enter or Space to select an item
8. Verify selection is displayed below tree

### Combobox (Tab: Combobox)

1. Navigate to Combobox tab
2. Focus on the fruit search input
3. Type "app" to filter suggestions
4. Press ArrowDown to highlight first suggestion
5. Press ArrowDown/ArrowUp to navigate suggestions
6. Press Enter to select highlighted item
7. Verify input shows selected value
8. Press Escape to close suggestions without selecting

## Success Criteria

- Skip link works and is hidden until focused
- Tab panels respond to arrow key navigation
- Focus trap keeps focus within dialog
- Menu bar supports full keyboard navigation
- Tree view supports expand/collapse and navigation
- Combobox supports type-ahead and arrow selection
- ARIA live regions announce actions (check screen reader)

## Edge Cases to Test

- Tab through entire page without mouse
- Close dialog by clicking outside
- Tree navigation at boundaries (first/last item)
- Combobox with no matching results
