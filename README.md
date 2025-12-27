# browser

The fastest, most token-efficient way for AI agents to control Chrome.

<p>
  <a href="https://github.com/camhahu/browser/releases/latest"><img alt="Release" src="https://img.shields.io/github/v/release/camhahu/browser?style=flat-square" /></a>
  <a href="https://github.com/camhahu/browser/actions/workflows/release.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/camhahu/browser/release.yml?style=flat-square" /></a>
  <a href="https://github.com/camhahu/browser/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/github/license/camhahu/browser?style=flat-square" /></a>
</p>

https://github.com/user-attachments/assets/9d551f3f-0dda-42f7-8b2d-d0e068842d3a

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/camhahu/browser/main/install.sh | bash
```

Point your agent to the [skill file](skill/SKILL.md) to get started, or install it directly:

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

## Update

```bash
browser update
```

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
