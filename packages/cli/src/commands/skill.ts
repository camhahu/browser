import type { RegisterCommand } from "./common";
import { exitWithError } from "./common";
import {
    fetchSkillFile,
    AGENT_TARGETS,
    SUPPORTED_TARGETS,
    getGlobalSkillPath,
} from "../skill-files";

export const registerSkillCommand: RegisterCommand = (program) => {
    program
        .command("add-skill <target>")
        .description(`Install the browser skill for an AI agent. Targets: ${SUPPORTED_TARGETS.join(", ")}`)
        .option("-g, --global", "Install to user-level directory instead of project")
        .action(async (target: string, options: { global?: boolean }) => {
            if (!AGENT_TARGETS[target]) {
                console.error(`Unknown target: ${target}`);
                exitWithError(`Supported targets: ${SUPPORTED_TARGETS.join(", ")}`);
            }

            const fs = await import("fs");
            const path = await import("path");

            let skillDir: string;
            let displayPath: string;

            if (options.global) {
                const globalPath = getGlobalSkillPath(target);
                if (globalPath === null) {
                    exitWithError(`Global install is not supported for ${target}`);
                }
                skillDir = globalPath;
                displayPath = skillDir;
            } else {
                const targetPath = AGENT_TARGETS[target];
                skillDir = path.join(process.cwd(), targetPath);
                displayPath = targetPath + "/";
            }

            console.log(`Fetching skill file...`);
            const skill = await fetchSkillFile();

            fs.rmSync(skillDir, { recursive: true, force: true });
            fs.mkdirSync(skillDir, { recursive: true });

            fs.writeFileSync(path.join(skillDir, "SKILL.md"), skill);

            console.log(`Installed browser skill to ${displayPath}`);
        });
};
