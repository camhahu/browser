# Known Bugs

## `text` command includes hidden elements

The `text` command (and similar commands) returns text from elements that are not visible to the user. This includes elements with:
- `opacity: 0`
- `visibility: hidden`
- `display: none`
- Off-screen positioning
- Zero dimensions
- Other CSS properties that hide content

These hidden elements should be filtered out so only user-visible text is returned. Off-screen elements can be included.
