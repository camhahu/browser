# AGENTS.md

- Always use Bun (never npm, pnpm, etc.)
- Use Bun standard library instead of Node standard library where possible
- Build with `bun run build` to compile to `./dist/browser`
- For testing, always use `./dist/browser` (not the globally installed `browser` command)
- See `docs/TODO.md` for planned features and `docs/BUGS.md` for known issues
- When fixing a bug or implementing a TODO, remove the corresponding entry from `docs/BUGS.md` or `docs/TODO.md`
- No barrel exports
- Never add `--json` output flags to CLI commands
- No fallback logic - each piece of code should do one thing, one way
- No unit tests, only integration tests in `test/integration.test.ts`
- Run `bun test` after changes (always runs headless)
- After completing a new feature, manually test it and add integration test coverage
- When fixing a bug, first add a test case that reproduces the issue, then fix the bug
