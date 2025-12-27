const REPO = "camhahu/browser";
const BRANCH = "main";
const BASE_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

export const REFERENCE_FILES = ["scraping", "forms", "testing", "debugging", "navigation"] as const;

type ReferenceName = (typeof REFERENCE_FILES)[number];

interface SkillFiles {
  skill: string;
  references: Record<ReferenceName, string>;
}

export async function fetchSkillFiles(): Promise<SkillFiles> {
  const urls = [
    `${BASE_URL}/skill/SKILL.md`,
    ...REFERENCE_FILES.map((name) => `${BASE_URL}/skill/references/${name}.md`),
  ];

  const responses = await Promise.all(urls.map((url) => fetch(url)));

  for (let i = 0; i < responses.length; i++) {
    if (!responses[i]!.ok) {
      throw new Error(`Failed to fetch ${urls[i]}: ${responses[i]!.status}`);
    }
  }

  const texts = await Promise.all(responses.map((r) => r.text()));

  const references = {} as Record<ReferenceName, string>;
  for (let i = 0; i < REFERENCE_FILES.length; i++) {
    references[REFERENCE_FILES[i]!] = texts[i + 1]!;
  }

  return {
    skill: texts[0]!,
    references,
  };
}

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
