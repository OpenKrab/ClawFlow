#!/usr/bin/env node

require("dotenv").config();

const { program } = require("commander");
const pkg = require("../package.json");
const chalk = require("chalk");

// Import TUI
const TUI = require("../src/core/TerminalUI");

// Import commands
const installCommand = require("../src/commands/install");
const listCommand = require("../src/commands/list");
const removeCommand = require("../src/commands/remove");
const cronCommand = require("../src/commands/cron");
const statusCommand = require("../src/commands/status");
const initCommand = require("../src/commands/init");
const searchCommand = require("../src/commands/search");
const createCommand = require("../src/commands/create");
const doctorCommand = require("../src/commands/doctor");
const registerCommand = require("../src/commands/register");
const updateCommand = require("../src/commands/update");

const exploreCommand = require("../src/commands/explore"); // Added exploreCommand

// Print new TUI banner
TUI.printBanner(pkg.version);

program
  .name("clawflow")
  .description("Install OpenClaw skills and set up cronjobs")
  .version(pkg.version, "-v, --version", "Show version");

// Create command
program
  .command("create [type] [name]")
  .description("Create a new skill or agent template")
  .action(createCommand);

// Install command

program
  .command("install <package>")
  .alias("i")
  .description("Install a package including skills and cronjobs")
  .option("-g, --global", "Install globally")
  .option("-c, --config <path>", "Specify config file path")
  .option("--skills-path <path>", "Specify OpenClaw workspace skills path")
  .option("--cron-jobs <path>", "Specify OpenClaw cron jobs.json path")
  .option("--openclaw-bin <path>", "Path to openclaw CLI binary")
  .option("--clawhub-bin <path>", "Path to clawhub CLI binary")
  .option("--no-cron", "Install skills without creating cronjobs")
  .option("--dry-run", "Show what would be done without installing")
  .option("--dev", "Local development mode (symlink skills)") // Added --dev option
  .option("--bundle", "Install multiple skills if found in repository") // Added --bundle option
  .action(installCommand);

// List command
program
  .command("list")
  .alias("ls")
  .description("Show installed packages and skills")
  .option("-a, --available", "Show packages available for install")
  .option("-i, --installed", "Show installed packages (default)")
  .option("--npm", "Include packages from npm registry (with --available)")
  .action(listCommand);

// Search command
program
  .command("search <query>")
  .alias("find")
  .description("Search packages in the registry")
  .option("--no-npm", "Exclude results from npm registry")
  .action(searchCommand);

// Remove command
program
  .command("remove <package>")
  .alias("rm")
  .description("Uninstall a package")
  .option("-g, --global", "Uninstall globally")
  .option("--keep-config", "Keep package config files")
  .action(removeCommand);

// Cron command group
program
  .command("cron-list")
  .description("List all cronjobs")
  .action(cronCommand.list);

program
  .command("cron-add <skill>")
  .description("Add a cronjob for a skill")
  .option(
    "-s, --schedule <expression>",
    "cron schedule expression",
    "*/5 * * * *",
  )
  .option("-e, --every <duration>", "Shorthand like 5m, 1h, 2d")
  .option("-d, --description <text>", "Cronjob description")
  .option("-p, --params <json>", "Parameters for the skill")
  .option("--dry-run", "Show what would be done without adding")
  .action(cronCommand.add);

program
  .command("cron-edit <id>")
  .description("Edit a cronjob")
  .option("-s, --schedule <expression>", "New cron schedule expression")
  .option("-e, --every <duration>", "Shorthand like 5m, 1h, 2d")
  .option("-d, --description <text>", "New description")
  .option("-p, --params <json>", "New parameters for the skill")
  .action(cronCommand.edit);

program
  .command("cron-remove <id>")
  .description("Remove a cronjob")
  .action(cronCommand.remove);

// Status command
program
  .command("status")
  .description("Show system status")
  .action(statusCommand);

// Register command
program
  .command("register [path]")
  .description("Register a local skill or agent to OpenClaw")
  .action(registerCommand);

// Doctor command

program
  .command("doctor")
  .description("Check system compatibility and configuration")
  .action(doctorCommand);

// Publish command (stub)
program
  .command("publish [path]")
  .description("Publish a skill/agent to ClawHub")
  .action(() => {
    console.log(chalk.yellow("\n📦 clawflow publish is coming soon!"));
    console.log(
      chalk.gray(
        "In the meantime, please use git to push to your repository.\n",
      ),
    );
  });

// Test command (stub)
program
  .command("test <skill>")
  .description("Run tests or examples for a skill")
  .action((skill) => {
    console.log(chalk.cyan(`\n🧪 Testing skill: ${skill}...`));
    console.log(chalk.yellow("Test runner integration is coming soon!\n"));
  });

// Integration commands
program
  .command("graph-add <skill>")
  .description("Add a skill node to ClawGraph")
  .action((skill) => {
    console.log(chalk.cyan(`\n🕸️  Integrating ${skill} into ClawGraph...`));
    console.log(chalk.yellow("ClawGraph integration is coming soon!\n"));
  });

program
  .command("team-join <agent>")
  .description("Register an agent to ClawTeam")
  .action((agent) => {
    console.log(chalk.cyan(`\n👥 Adding ${agent} to ClawTeam...`));
    console.log(chalk.yellow("ClawTeam integration is coming soon!\n"));
  });

// Update command

program
  .command("update")
  .description("Update ClawFlow CLI to the latest version")
  .action(updateCommand);

// Explore command
program
  .command("explore")
  .description("Explore available skills and agents on ClawHub")
  .action(exploreCommand);

// Init command
program
  .command("init")
  .description("Initialize ClawFlow in the current directory")
  .option("-f, --force", "Overwrite existing config")
  .action(initCommand);

// Global error handler
process.on("unhandledRejection", (err) => {
  TUI.printError("เกิดข้อผิดพลาด: " + err.message);
  if (process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
});

program.parse();
