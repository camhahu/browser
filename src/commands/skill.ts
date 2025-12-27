import type { RegisterCommand } from "./common";
import { exitWithError } from "./common";
import { fetchSkillFiles, AGENT_TARGETS, SUPPORTED_TARGETS, REFERENCE_FILES } from "../skill-files";

export const registerSkillCommand: RegisterCommand = (program) => {
  program
    .command("add-skill <target>")
    .description(`Install the browser skill for an AI agent. Targets: ${SUPPORTED_TARGETS.join(", ")}`)
    .action(async (target: string) => {
      const targetPath = AGENT_TARGETS[target];
      if (!targetPath) {
        console.error(`Unknown target: ${target}`);
        exitWithError(`Supported targets: ${SUPPORTED_TARGETS.join(", ")}`);
      }

      console.log(`Fetching skill files...`);
      const files = await fetchSkillFiles();

      const fs = await import("fs");
      const path = await import("path");

      const skillDir = path.join(process.cwd(), targetPath);
      const referencesDir = path.join(skillDir, "references");

      fs.rmSync(skillDir, { recursive: true, force: true });
      fs.mkdirSync(referencesDir, { recursive: true });

      fs.writeFileSync(path.join(skillDir, "SKILL.md"), files.skill);
      for (const name of REFERENCE_FILES) {
        fs.writeFileSync(path.join(referencesDir, `${name}.md`), files.references[name]!);
      }

      console.log(`Installed browser skill to ${targetPath}/`);
    });
};
