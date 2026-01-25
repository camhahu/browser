# Telemetry

We collect anonymous usage data to improve `browser`. On first run, you'll be prompted to opt in or out.

## What we collect

- **Command usage**: Which commands are run (e.g. `open`, `click`, `text`)
- **Errors**: Error type (e.g. `TypeError`, `Error`) - no messages or stack traces
- **Environment**: OS, architecture, CLI version
- **Anonymous ID**: A random UUID stored locally to count unique installations (not linked to any personal data)

## What we DON'T collect

- URLs or page content
- File paths or error messages
- Personal data
- Cookies, localStorage, or any browser state
- Screenshots or HTML content

## How to opt out

There are three ways to disable telemetry:

### Environment variable

```bash
BROWSER_TELEMETRY=0 browser open https://example.com
```

### Config file

```bash
browser config telemetry off
```

### Command flag (per-session)

```bash
browser --no-telemetry open https://example.com
```

## Data handling

Telemetry data is sent to [PostHog](https://posthog.com) and is used solely to understand usage patterns and improve the tool. We do not sell or share this data with third parties.
