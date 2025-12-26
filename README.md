# browser

CLI tool for controlling a Chromium browser via CDP. Designed for AI agents and automation.

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
