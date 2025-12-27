# browser

CLI tool for controlling a Chromium browser via CDP. Designed for AI agents and automation.

https://github.com/user-attachments/assets/9d551f3f-0dda-42f7-8b2d-d0e068842d3a

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

Running `add-skill` again will update the skill files to the latest version. After running `browser update`, re-run `add-skill` to get the latest skill documentation.

## Commands

See [skill/SKILL.md](skill/SKILL.md) for full command reference.

## Contributing

See [docs/TODO.md](docs/TODO.md) for planned features and [docs/BUGS.md](docs/BUGS.md) for known issues.

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
