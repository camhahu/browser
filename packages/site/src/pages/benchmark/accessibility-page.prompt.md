# Accessibility Benchmark

Test keyboard-only navigation and ARIA patterns.

## Steps

### Skip Link

1. Navigate to `http://localhost:4244/benchmark/accessibility`.
2. Press Tab once to reveal the skip link.
3. Press Enter to activate the skip link.

### Tabs

4. Use ArrowRight to move to the "Menu Bar" tab.
5. Use ArrowRight to move to the "Tree View" tab.
6. Use ArrowLeft to move back to the "Menu Bar" tab.

### Focus Trap Dialog

7. Move to the "Overview" tab.
8. Open the focus trap dialog.
9. Press Tab three times, then press Shift+Tab once.
10. Press Escape to close the dialog.

### Menu Bar (Tab: Menu Bar)

11. Focus the "File" menu button.
12. Press ArrowDown to open the menu.
13. Press ArrowDown until "Save" is focused, then press Enter.
14. Press ArrowRight to move to the "Edit" menu.
15. Press ArrowDown to open the menu, then press ArrowDown to focus "Copy" and press Enter.
16. Press Escape to close the menu.

### Tree View (Tab: Tree View)

17. Focus the "src" node.
18. Press ArrowRight to expand it.
19. Press ArrowDown until "components" is focused, then press ArrowRight to expand it.
20. Press ArrowDown to focus "Button.tsx" and press Enter to select it.
21. Press ArrowLeft to collapse "components".

### Combobox (Tab: Combobox)

22. Move to the "Combobox" tab.
23. Focus the input and type `app`.
24. Press ArrowDown twice to highlight the second suggestion.
25. Press Enter to select it.
26. Press Escape to close the suggestion list.
