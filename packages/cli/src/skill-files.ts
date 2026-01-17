const REPO = "camhahu/browser";
const BRANCH = "main";
const BASE_URL = `https://raw.githubusercontent.com/${REPO}/${BRANCH}`;
const POINTER_PATH = "packages/cli/skill/PATH.json";

type SkillPointer = {
    path: string;
};

export async function fetchSkillFile(): Promise<string> {
    const pointerUrl = `${BASE_URL}/${POINTER_PATH}`;
    const pointerResponse = await fetch(pointerUrl);
    if (!pointerResponse.ok) {
        throw new Error(`Failed to fetch ${POINTER_PATH}: ${pointerResponse.status}`);
    }

    const pointer = (await pointerResponse.json()) as SkillPointer;
    if (!pointer.path || typeof pointer.path !== "string") {
        throw new Error(`Invalid ${POINTER_PATH} contents`);
    }

    const skillUrl = `${BASE_URL}/${pointer.path}`;
    const response = await fetch(skillUrl);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${pointer.path}: ${response.status}`);
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

    const home = Bun.env.HOME;
    if (!home) {
        throw new Error("HOME is not set");
    }

    if (target === "goose" && process.platform === "win32") {
        const appdata = Bun.env.APPDATA;
        if (!appdata) {
            throw new Error("APPDATA is not set");
        }
        return `${appdata}/Block/goose/config/skills/browser`;
    }

    return `${home}/${globalPath}`;
}
