# browser

CLI tool for controlling a Chromium browser via CDP. Designed for AI agents and automation.

![Demo](https://github.com/user-attachments/assets/5a4f118d-6234-4b92-aa6b-b7d72ec40a08)

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/camhahu/browser/main/install.sh | bash
```

## Update

```bash
browser update
```

## Quick Start

```bash
browser start                    # Start browser
browser open https://example.com # Open a page
browser text                     # Get page text
browser click "button.submit"    # Click an element
browser stop                     # Stop browser
```

## Agent Integration

Give your AI agent browser control by installing the skill:

```bash
browser add-skill opencode   # OpenCode
browser add-skill claude     # Claude Code
browser add-skill cursor     # Cursor
browser add-skill amp        # Amp
browser add-skill goose      # Goose
browser add-skill github     # GitHub Copilot
browser add-skill vscode     # VS Code
browser add-skill codex      # OpenAI Codex
```

This installs the browser skill to the appropriate directory for your agent (e.g. `.opencode/skill/browser/`). The agent will automatically discover and use it when browser automation is needed.

## Commands

See [skill/references/COMMANDS.md](skill/references/COMMANDS.md) for full command reference.

## Contributing

```bash
bun install
bun run build
bun test
```

The build outputs to `./dist/browser`. You can symlink it for local testing:

```bash
sudo ln -s $(pwd)/dist/browser /usr/local/bin/browser
```

## License

MIT
