# AGENTS.md

- Use Bun standard library instead of Node standard library where possible
- Build with `bun run build` to compile to `./dist/browser`
- `/usr/local/bin/browser` is a symlink to `./dist/browser`
- See `TODO.md` for planned features and `BUGS.md` for known issues
- When fixing a bug or implementing a TODO, remove the corresponding entry from `BUGS.md` or `TODO.md`
- No barrel exports
- Never add `--json` output flags to CLI commands
- No fallback logic - each piece of code should do one thing, one way
