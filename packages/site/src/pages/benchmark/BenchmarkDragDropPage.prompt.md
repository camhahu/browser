# Drag & Drop Benchmark

Test a kanban board with draggable cards and undo/redo.

## Steps

1. Navigate to the drag-drop page
2. Wait for loading skeleton to complete (600ms)
3. Identify the four columns: Backlog, To Do, In Progress, Done
4. Drag a card from "Backlog" to "To Do":
   - Click and hold on a card
   - Drag to the "To Do" column
   - Release to drop
5. Verify the card moved and action notice appears
6. Drag a card within the same column to reorder:
   - Drag a card up or down within its column
7. Use the up/down buttons on a card to reorder without dragging
8. Click "Undo" to reverse the last action
9. Verify the card returns to its previous position
10. Click "Redo" to re-apply the action
11. Move multiple cards between columns
12. Use Undo multiple times to reverse several actions
13. Verify drop zone indicators appear while dragging

## Success Criteria

- Cards are draggable between columns
- Cards can be reordered within columns
- Drop zone indicator (dark line) appears on hover
- Action notices confirm each move
- Undo reverses moves in order
- Redo re-applies undone moves
- Up/down buttons work for keyboard reordering
- Card count updates in column headers

## Edge Cases to Test

- Drag card to empty column
- Drag to same position (should be no-op)
- Undo when nothing to undo (button disabled)
- Redo when nothing to redo (button disabled)
- Rapid successive drags
