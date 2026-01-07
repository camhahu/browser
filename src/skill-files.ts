const REPO = "camhahu/browser";
const BRANCH = "main";
const BASE_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

export const REFERENCE_FILES = ["forms", "testing", "debugging", "navigation", "reading"] as const;

type ReferenceName = (typeof REFERENCE_FILES)[number];

interface SkillFiles {
    skill: string;
    references: Record<ReferenceName, string>;
}

export interface FetchResult {
    files: SkillFiles;
    failed: string[];
}

export async function fetchSkillFiles(): Promise<FetchResult> {
    const skillUrl = `${BASE_URL}/skill/SKILL.md`;
    const referenceUrls = REFERENCE_FILES.map((name) => ({
        name,
        url: `${BASE_URL}/skill/references/${name}.md`,
    }));

    const failed: string[] = [];

    const skillResponse = await fetch(skillUrl);
    if (!skillResponse.ok) {
        throw new Error(`Failed to fetch SKILL.md: ${skillResponse.status}`);
    }
    const skill = await skillResponse.text();

    const references = {} as Record<ReferenceName, string>;
    const referenceResults = await Promise.all(
        referenceUrls.map(async ({ name, url }) => {
            const response = await fetch(url);
            if (!response.ok) {
                return { name, content: null };
            }
            return { name, content: await response.text() };
        })
    );

    for (const { name, content } of referenceResults) {
        if (content === null) {
            failed.push(`references/${name}.md`);
        } else {
            references[name] = content;
        }
    }

    return {
        files: { skill, references },
        failed,
    };
}

export const AGENT_TARGETS: Record<string, string> = {
    opencode: ".opencode/skill/browser",
    cursor: ".cursor/skills/browser",
    claude: ".claude/skills/browser",
    "claude-code": ".claude/skills/browser",
    amp: ".agents/skills/browser",
    goose: ".goose/skills/browser",
    github: ".github/skills/browser",
    vscode: ".vscode/skills/browser",
    codex: ".codex/skills/browser",
};

export const SUPPORTED_TARGETS = Object.keys(AGENT_TARGETS);
