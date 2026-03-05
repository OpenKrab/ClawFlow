/**
 * Register command - Register a local skill or agent via symlink
 */

const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const ClawFlow = require("../index");

module.exports = async function registerCommand(targetPath) {
  const hub = new ClawFlow();
  const sourcePath = path.resolve(process.cwd(), targetPath || ".");

  console.log(chalk.cyan.bold("\n🏷️  ClawFlow Register\n"));

  // 1. Verify source
  const skillYaml = path.join(sourcePath, "skill.yaml");
  const agentYaml = path.join(sourcePath, "agent.yaml");
  const skillMd = path.join(sourcePath, "SKILL.md");

  if (
    !fs.existsSync(skillYaml) &&
    !fs.existsSync(agentYaml) &&
    !fs.existsSync(skillMd)
  ) {
    console.error(
      chalk.red(
        `❌ Error: No skill.yaml, agent.yaml, or SKILL.md found at ${sourcePath}`,
      ),
    );
    console.log(
      chalk.gray(
        "   Please make sure you are in the correct directory or provide a path.",
      ),
    );
    process.exit(1);
  }

  const name = path.basename(sourcePath);
  const skillsPath = hub.config.getSkillsPath();
  const targetPathInWorkspace = path.join(skillsPath, name);

  // 2. Register via symlink
  try {
    process.stdout.write(chalk.white(`  Registering ${chalk.bold(name)}... `));

    fs.ensureDirSync(path.dirname(targetPathInWorkspace));
    if (fs.existsSync(targetPathInWorkspace)) {
      // Check if it's already a symlink
      const stats = fs.lstatSync(targetPathInWorkspace);
      if (stats.isSymbolicLink()) {
        fs.removeSync(targetPathInWorkspace);
      } else {
        const { overwrite } = await require("inquirer").prompt([
          {
            type: "confirm",
            name: "overwrite",
            message: `\n     Directory ${name} already exists in skills workspace. Overwrite with symlink?`,
            default: false,
          },
        ]);
        if (!overwrite) {
          console.log(chalk.yellow("\n     Aborted."));
          return;
        }
        fs.removeSync(targetPathInWorkspace);
      }
    }

    fs.ensureSymlinkSync(sourcePath, targetPathInWorkspace, "junction");
    process.stdout.write(chalk.green("✓\n"));

    // 3. Verification
    console.log(chalk.gray(`  Path: ${targetPathInWorkspace}`));
    console.log(chalk.green("\n✅ Successfully registered to OpenClaw!"));
    console.log(chalk.white("\nNext steps:"));
    console.log(chalk.gray('  - Run "clawflow status" to see your skill'));
    console.log(chalk.gray('  - Use "clawflow cron-add" to schedule it\n'));
  } catch (err) {
    console.error(chalk.red("\n❌ Registration failed:"), err.message);
    process.exit(1);
  }
};
