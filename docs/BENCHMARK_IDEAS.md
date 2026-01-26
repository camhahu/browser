# Benchmark Ideas

Additional benchmarks to expand coverage of browser CLI capabilities.

## Current Benchmark

**Benchmark 1: Account Setup** tests:
- Form input (text, email, password)
- Modal dialogs with focus capture (2FA)
- Async state transitions (700ms-900ms simulated latency)
- Dropdowns (`<select>`)
- Checkboxes and toggle switches
- File upload with preview
- Form validation (client-side)
- Multi-page navigation flow

---

## Proposed Benchmarks

### Benchmark 2: Data Table & Search (Implemented)

Tests CRUD operations and data filtering:
- Sortable/filterable data table with pagination
- Search with debounced input and results update
- Inline editing of table cells
- Row selection (single/multi with shift-click)
- Bulk actions (delete selected, export selected)
- Empty state handling
- Loading skeletons during data fetch

**Why:** Tables are ubiquitous in dev tools (dashboards, admin panels, logs). Tests reading structured data and interacting with repetitive elements.

---

### Benchmark 3: Drag & Drop / Reordering (Implemented)

Tests pointer-based interactions:
- Kanban board with draggable cards between columns
- Sortable list with drag handles
- Drag to reorder items
- Drop zones with visual feedback
- Undo/redo for reorder operations

**Why:** Tests the `drag` command and complex pointer sequences. Many project management and workflow tools rely on this.

---

### Benchmark 4: Rich Text Editor

Tests complex text input:
- Contenteditable or WYSIWYG editor
- Toolbar with formatting buttons (bold, italic, links)
- Keyboard shortcuts (Ctrl+B, Ctrl+I)
- Inserting mentions (@user autocomplete)
- Code blocks with syntax highlighting
- Markdown preview toggle

**Why:** Documentation tools, issue trackers, and CMS all have rich text. Tests beyond simple `<input>` typing.

---

### Benchmark 5: Multi-Step Wizard / Checkout Flow (Implemented)

Tests stateful multi-page workflows:
- Step indicator showing progress
- Conditional steps (show/hide based on previous answers)
- Back navigation preserving state
- Summary/review step before final submit
- Validation that blocks progression

**Why:** Onboarding flows, checkout, and setup wizards are common patterns requiring state management across pages.

---

### Benchmark 6: Real-Time Updates / WebSocket Simulation

Tests handling of dynamic content:
- Live feed that auto-updates (new items appear at top)
- Notification badges that increment
- Toast/snackbar notifications that auto-dismiss
- "New content available" banner with refresh action
- Polling simulation for status changes

**Why:** Tests ability to observe and react to DOM changes without explicit user action. Important for monitoring dashboards.

---

### Benchmark 7: Iframe & Shadow DOM

Tests complex DOM structures:
- Embedded iframe with its own interactive elements
- Web components using Shadow DOM
- Cross-frame communication (postMessage)
- Nested scrolling contexts

**Why:** Many apps embed third-party widgets, payment forms, or use web components. Tests selector piercing and frame switching.

---

### Benchmark 8: Accessibility Navigation (Implemented)

Tests keyboard-only and ARIA patterns:
- Tab order through complex layouts
- Arrow key navigation in menus/trees
- Focus trap in dialogs
- Skip links
- ARIA live regions announcing changes
- Combobox/autocomplete with keyboard selection

**Why:** Ensures the CLI can navigate apps the way screen readers do, testing keyboard patterns and ARIA.

---

### Benchmark 9: Error Handling & Edge Cases (Implemented)

Tests recovery and edge cases:
- Network error simulation (retry button)
- 404/500 error pages
- Session timeout with re-auth prompt
- Form with server-side validation errors
- Confirmation dialogs (are you sure?)
- Rate limiting / throttle messages

**Why:** Real apps fail. Tests ability to detect error states and take corrective action.

---

### Benchmark 10: File Management / Tree View

Tests hierarchical data:
- Expandable/collapsible folder tree
- Context menus (right-click actions)
- Rename inline
- Create new file/folder
- Move items via drag or cut/paste
- Breadcrumb navigation

**Why:** File browsers, code editors, and asset managers use tree structures. Tests nested interactions.

---

### Benchmark 11: Charts & Data Visualization

Tests non-text content extraction:
- Interactive chart (hover for tooltips)
- Click on chart segments to filter
- Legend toggles to show/hide series
- Export chart as image
- Reading data from chart via tooltips or underlying table

**Why:** Dashboards often have charts. Tests ability to extract meaning from visual elements.

---

### Benchmark 12: Authentication Variants

Tests different auth patterns:
- OAuth flow with redirect (simulated)
- Magic link (email link simulation)
- SSO with org selection
- Password reset flow
- Account lockout after failed attempts

**Why:** Expands on Benchmark 1 with more auth edge cases seen in enterprise apps.

---

### Benchmark 13: Infinite Scroll / Virtualized List (Implemented)

Tests performance with large data sets:
- Infinite scroll loading more items
- Virtualized list (only visible items in DOM)
- Scroll position restoration
- Jump to specific item

**Why:** Tests scroll command and handling of dynamically loaded content.

---

### Benchmark 14: Command Palette / Quick Actions

Tests keyboard-driven UI:
- Cmd+K / Ctrl+K to open command palette
- Fuzzy search through commands
- Execute action from palette
- Recent commands history

**Why:** Power-user interfaces (VS Code, Linear, Notion) use command palettes. Tests keyboard shortcuts and search.
