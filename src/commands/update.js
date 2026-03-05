/**
 * Update command - Check for updates
 */

const chalk = require("chalk");
const pkg = require("../../package.json");
const { execSync } = require("child_process");

module.exports = async function updateCommand() {
  console.log(chalk.cyan.bold("\n🔄 Checking for ClawFlow updates...\n"));
  console.log(chalk.gray(`  Current version: ${pkg.version}`));

  try {
    const latest = execSync(`npm show ${pkg.name} version`, { stdio: "pipe" })
      .toString()
      .trim();

    if (latest === pkg.version) {
      console.log(chalk.green("✨ You are already using the latest version!"));
    } else {
      console.log(
        chalk.yellow(`🚀 A new version is available: ${chalk.bold(latest)}`),
      );
      console.log(chalk.white("\nTo update, run:"));
      console.log(chalk.cyan(`   npm install -g ${pkg.name}`));
    }
  } catch (e) {
    console.log(
      chalk.red(
        "❌ Failed to check for updates. Please check your internet connection.",
      ),
    );
  }
  console.log();
};
