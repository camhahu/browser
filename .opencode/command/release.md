---
description: Bump version and create release tag (/release [patch|minor|major])
subtask: false
---

Bump the version in package.json, update CHANGELOG.md, and create a git tag for release.

$ARGUMENTS

The bump type is: $ARGUMENTS.

1. If the bump type is not one of patch, minor or major, stop and tell the user.

2. Ensure there are no uncommitted changes, we are on branch `main` and it is in sync with remote.

3. Get the current version from package.json using: `bun pm pkg get version`

4. Calculate the new version based on bump type:

- `patch` - 0.1.0 -> 0.1.1
- `minor` - 0.1.0 -> 0.2.0
- `major` - 0.1.0 -> 1.0.0

5. Generate changelog entry for this release:

- Look at commits since the last tag (or all commits if no tags exist)
- Only include customer-facing changes (new features, bug fixes, behavior changes, removed functionality)
- Changes to skill files (skill/SKILL.md, skill/references/COMMANDS.md) are customer-facing and should be included
- Exclude internal changes like: CI/CD, tests, refactoring, docs, build scripts, code cleanup, dependency updates
- Group changes into categories: Added, Changed, Fixed, Removed (only include categories that have entries)
- Format as a new section at the top of CHANGELOG.md (after the header):

```markdown
## [{version}] - {YYYY-MM-DD}

### Added
- Feature description

### Fixed
- Bug fix description
```

6. Update the version in package.json using: `bun pm pkg set version={version}`

7. Stage the changes:

```
git add package.json CHANGELOG.md
```

8. Create a commit with message: `release: v{version}`

9. Create a git tag:

```
git tag v{version}
```

10. Tell the user the release is ready and offer to run:

```
git push && git push origin v{version}
```

IMPORTANT: Do not run git push until the user has confirmed.
