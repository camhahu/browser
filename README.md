<h1 align="center"><b>browser</b></h1>

<p align="center">The fastest, most token-efficient way for AI agents to control Chrome.</p>

<p align="center">
  <a href="https://github.com/camhahu/browser/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/camhahu/browser?style=flat-square" /></a>
  <a href="https://github.com/camhahu/browser/actions/workflows/release.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/camhahu/browser/release.yml?style=flat-square" /></a>
  <a href="https://github.com/camhahu/browser/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/camhahu/browser?style=flat-square" /></a>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/e35c3dfb-37b7-499f-8010-307ccfdb6457" alt="browser demo" width="800" />
</p>

> **Experimental**: Commands are stable, but their output format is subject to change as we optimize for AI agent effectiveness.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/camhahu/browser/main/packages/cli/install.sh | bash
```

Point your agent to the [skill file](packages/cli/skill/SKILL.md) to get started, or install it directly:

```bash
browser add-skill opencode            # Add to current project
browser add-skill --global opencode   # Add globally

browser add-skill amp        # Amp
browser add-skill codex      # OpenAI Codex
browser add-skill claude     # Claude Code
browser add-skill cursor     # Cursor
browser add-skill goose      # Goose
browser add-skill github     # GitHub Copilot
browser add-skill vscode     # VS Code
```

## Update

```bash
browser update
```

## Example

```bash
browser open https://example.com                      # Opens page, shows outline
browser click "Products" && browser text ".product-list"
browser stop
```

## Commands

### Browser Control

| Command | Description |
|---------|-------------|
| `start [--headed\|--headless]` | Start browser (default: headed) |
| `stop` | Stop the browser |

### Navigation

| Command | Description |
|---------|-------------|
| `open <url>` | Open URL in new tab (auto-starts headless browser) |
| `navigate <url>` | Navigate active tab to URL |
| `back` | Go back in history |
| `forward` | Go forward in history |
| `refresh` | Reload active tab |

### Tab Management

| Command | Description |
|---------|-------------|
| `tabs` | List all open tabs |
| `active` | Print active tab ID |
| `use <tab-id>` | Switch to specific tab |
| `close [tab-id]` | Close tab (default: active) |

### Interaction

| Command | Description |
|---------|-------------|
| `click <selector>` | Click element (label, text, or CSS) |
| `type <text> [selector]` | Type text or send keys (e.g. `Enter`, `ctrl+c`) |
| `hover <selector>` | Move mouse to element |
| `drag <source> <target>` | Drag element to another element |
| `select <selector> <value>` | Select dropdown option |
| `scroll <target>` | Scroll to `top`, `bottom`, or CSS selector |
| `wait <selector>` | Wait for element (15s timeout) |

### Content Extraction

| Command | Description |
|---------|-------------|
| `outline [-a [depth]]` | Show interactive elements (or all with `-a`) |
| `text [-l chars] [selector]` | Get text content (default: 2000 chars) |
| `html [-l chars] [selector]` | Get HTML content |
| `find <selector>` | Find elements matching selector |
| `url` | Print active tab URL |
| `title` | Print active tab title |

### Screenshots

| Command | Description |
|---------|-------------|
| `screenshot [-f format] [-o path] [name]` | Capture screenshot (png/jpeg/webp) |

### Debugging

| Command | Description |
|---------|-------------|
| `console [-l count] [-t types]` | Show console output |
| `network [-f pattern] [-t types] [id]` | List/inspect network requests |
| `eval <js>` | Evaluate JavaScript |

### State & Storage

| Command | Description |
|---------|-------------|
| `cookies [name]` | List cookies or get specific value |
| `storage [key]` | List localStorage or get specific value |

### Viewport & User Agent

| Command | Description |
|---------|-------------|
| `viewport desktop\|tablet\|mobile` | Set viewport preset |
| `viewport set <width> <height>` | Set custom viewport |
| `useragent macos\|windows\|iphone\|android` | Set user agent preset |
| `useragent custom <string>` | Set custom user agent |

### Configuration

| Command | Description |
|---------|-------------|
| `config` | Show all config |
| `config set <key> <value>` | Set config value |
| `config unset <key>` | Remove config value |
| `config clear-profile` | Clear browser profile (cookies, logins) |

### Utilities

| Command | Description |
|---------|-------------|
| `add-skill <target>` | Install skill file for AI agent |
| `update` | Update to latest version |

## Selectors

```bash
browser click l3              # Label from outline (fastest)
browser click "Sign up"       # Text match (exact first, then partial)
browser click ".btn-primary"  # CSS selector
```

## Skill File

See [packages/cli/skill/SKILL.md](packages/cli/skill/SKILL.md) for the AI agent skill file with usage patterns.

## Contributing

See [docs/TODO.md](docs/TODO.md) for planned features and [docs/BUGS.md](docs/BUGS.md) for known issues.

```bash
bun install
bun run build
bun run test
```

The build outputs to `./dist/browser`. You can symlink it for local testing:

```bash
sudo ln -s $(pwd)/dist/browser /usr/local/bin/browser
```

## License

MIT
