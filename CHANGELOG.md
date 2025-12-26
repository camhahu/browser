# Changelog

All notable changes to this project will be documented in this file.

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
