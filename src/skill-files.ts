const REPO = "camhahu/browser";
const BRANCH = "main";
const BASE_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;

export async function fetchSkillFile(): Promise<string> {
    const skillUrl = `${BASE_URL}/skill/SKILL.md`;
    const response = await fetch(skillUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch SKILL.md: ${response.status}`);
    }
    return response.text();
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

const AGENT_GLOBAL_PATHS: Record<string, string | null> = {
    opencode: ".config/opencode/skill/browser",
    cursor: null,
    claude: ".claude/skills/browser",
    "claude-code": ".claude/skills/browser",
    amp: ".config/agents/skills/browser",
    goose: ".config/goose/skills/browser",
    github: null,
    vscode: ".claude/skills/browser",
    codex: ".codex/skills/browser",
};

export const SUPPORTED_TARGETS = Object.keys(AGENT_TARGETS);

export function getGlobalSkillPath(target: string): string | null {
    const globalPath = AGENT_GLOBAL_PATHS[target];
    if (globalPath === null) {
        return null;
    }

    const home = Bun.env.HOME || require("os").homedir();

    if (target === "goose" && process.platform === "win32") {
        const appdata = Bun.env.APPDATA || `${home}/AppData/Roaming`;
        return `${appdata}/Block/goose/config/skills/browser`;
    }

    return `${home}/${globalPath}`;
}
