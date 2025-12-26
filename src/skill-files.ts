// Skill files fetched from GitHub at runtime

const REPO = "camhahu/browser";
const BRANCH = "main";
const BASE_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

export async function fetchSkillFiles(): Promise<{ skillMd: string; commandsMd: string }> {
  const [skillRes, commandsRes] = await Promise.all([
    fetch(`${BASE_URL}/skill/SKILL.md`),
    fetch(`${BASE_URL}/skill/references/COMMANDS.md`),
  ]);

  if (!skillRes.ok) {
    throw new Error(`Failed to fetch SKILL.md: ${skillRes.status}`);
  }
  if (!commandsRes.ok) {
    throw new Error(`Failed to fetch COMMANDS.md: ${commandsRes.status}`);
  }

  return {
    skillMd: await skillRes.text(),
    commandsMd: await commandsRes.text(),
  };
}

// Agent target paths (relative to cwd)
export const AGENT_TARGETS: Record<string, string> = {
  opencode: ".opencode/skill/browser",
  cursor: ".cursor/skills/browser",
  claude: ".claude/skills/browser",
  "claude-code": ".claude/skills/browser",
  amp: ".amp/skills/browser",
  goose: ".goose/skills/browser",
  github: ".github/skills/browser",
  vscode: ".vscode/skills/browser",
  codex: ".codex/skills/browser",
};

export const SUPPORTED_TARGETS = Object.keys(AGENT_TARGETS);
