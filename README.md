# browser

CLI tool for controlling a Chromium browser via CDP.

## Setup

```bash
bun install
bun run build
sudo ln -s $(pwd)/dist/browser /usr/local/bin/browser
```

## Usage

```bash
browser start
browser open https://example.com
browser network-listen &
browser click "button"
browser network
```
