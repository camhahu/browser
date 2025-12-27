# Changelog

All notable changes to this project will be documented in this file.

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
