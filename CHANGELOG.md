# Changelog

All notable changes to this project will be documented in this file.

## [0.5.3] - 2026-03-18

### Added

- Software rendering and custom Chrome args support - @matthewijordan

## [0.5.2] - 2026-01-26

### Fixed

- Session ID now correctly included in session_stop telemetry events

## [0.5.1] - 2026-01-25

### Added

- Opt-out telemetry with interactive consent and per-session flags (`--no-telemetry`)

### Fixed

- Handle readonly dotfiles - @codesoda

## [0.5.0] - 2026-01-18

### Added

- `drag` command for pointer-based drag interactions
- Progressive disclosure in page outline for cleaner navigation of complex pages

## [0.4.5] - 2026-01-17

### Fixed

- Update now clears macOS download metadata so the CLI runs immediately after updating

## [0.4.4] - 2026-01-17

No customer-facing changes.

## [0.4.3] - 2026-01-17

### Fixed

- `add-skill` command URL resolution for pointer file paths

## [0.4.2] - 2026-01-17

### Fixed

- `add-skill` command now handles remote path changes gracefully

## [0.4.1] - 2026-01-15

### Added

- Page outline now displays automatically after switching tabs with `use` command

## [0.4.0] - 2026-01-15

### Added

- Accessibility labels in outline and click commands for easier element identification
- Auto-outline after navigation commands to show page structure automatically
- `--headed` flag to `browser start` command for debugging sessions
- Accessibility labels shown in error messages for better debugging

### Changed

- Persistent browser profiles are now the default behavior

### Fixed

- Page stability timeout on cold start no longer causes failures

## [0.3.4] - 2026-01-08

### Added

- Persistent Chrome profiles to preserve logins, cookies, and browsing data across sessions
- `config clear-profile` command to reset profile data

## [0.3.3] - 2026-01-07

### Added

- `screenshot --output` flag for saving screenshots to arbitrary paths with format detection from extension

## [0.3.2] - 2026-01-07

### Added

- `add-skill --global` flag for installing skills to user-level directories

### Fixed

- Amp skill install path now correctly uses `.agents/skills/` (thanks @toolmantim)

## [0.3.1] - 2026-01-07

### Changed

- `console` command now shows buffered messages instead of streaming indefinitely

### Added

- `console --clear` to clear captured messages
- `console -t <types>` to filter by message type (log, info, warning, error, debug)
- `console -l <count>` to limit number of messages shown (default: 50)

## [0.3.0] - 2026-01-03

### Changed

- `outline` command now shows interactive elements only by default (previously required `-i` flag)

## [0.2.2] - 2026-01-01

### Added

- `useragent` command for device spoofing
- `select` command for dropdown elements
- `scroll` command for page navigation

### Fixed

- `add-skill` command now continues when reference files fail to fetch
- Screenshot filenames no longer include file extensions
- `text` command now preserves block-level formatting
- Cleaner error messages from browser script evaluation
- Short tab IDs now used consistently in browser commands

## [0.2.1] - 2025-12-28

### Added

- `outline -i` interactive mode showing only clickable elements within landmarks
- `click` and `find` commands now support text-based element selection (e.g. `browser click "Submit"`)

### Changed

- `open` command now starts browser in headless mode by default (use `start` for headed debugging)

## [0.2.0] - 2025-12-27

### Added

- `screenshot` command for capturing page screenshots (saves to .screenshots/ directory)
- `viewport` command with presets for desktop, tablet, mobile, and custom dimensions

### Changed

- Tab IDs are now short 4-character codes for easier use

### Fixed

- Click and navigation commands now wait for page load before returning
- Helpful error message when attempting operations with no active tab

## [0.1.7] - 2025-12-27

### Added

- `type` command now supports sending key combos without a selector (e.g. `type ctrl+c`, `type Escape`)

### Fixed

- Clarified navigation commands in skill documentation to prevent confusion between `open`, `navigate`, and `refresh`

## [0.1.6] - 2025-12-27

### Added

- `hover` command for triggering hover states and menus

## [0.1.5] - 2025-12-27

### Added

- `navigate` command for same-tab URL navigation

### Changed

- `open` and `navigate` commands now wait for page load before returning

## [0.1.4] - 2025-12-26

### Added

- Browser skill installation for AI agents

### Changed

- Make skill documentation more concise

### Fixed

- Network request capture for tabs created via daemon

## [0.1.3] - 2025-12-26

### Added

- Config command for managing CLI settings (`browser config set/unset`)
- Cross-platform Chrome detection for macOS, Windows, and Linux

### Changed

- Use system Chrome instead of Playwright Chromium
- Browser profiles are now ephemeral and cleaned up on stop

### Removed

- Playwright browser dependency

## [0.1.2] - 2025-12-26

### Added

- Self-update command for updating the browser CLI
- Curl-based install script for easy installation
- MIT license

### Changed

- Restructure opencode command directory
- Improve install script post-install messaging
- Update README for public release

## [0.1.1] - 2025-12-26

### Added

- Automated GitHub release workflow with cross-compilation for darwin-arm64, darwin-x64, linux-x64, linux-arm64, windows-x64
- OpenCode `/release` command for version bumping and tag creation
- Version injection at build time from package.json
- Integration test suite covering all CLI commands
- Agent skill for browser CLI automation
- Cookies and storage inspection commands
- Network request inspection with daemon-based capture
- HTML, text, and outline commands for page content extraction
- Console command for real-time log streaming
- Eval command for arbitrary JavaScript execution
- Back, forward, and refresh navigation commands
- Auto-start browser functionality
- Comprehensive tab management commands

### Changed

- Filter hidden elements from text command by default
- Migrate CLI to Commander.js for better command structure
- Replace Playwright context with native Chromium spawning

### Fixed

- Text command hidden elements issue
- Error message for close with no active tab
