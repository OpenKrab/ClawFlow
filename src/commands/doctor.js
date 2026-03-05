/**
 * Doctor command - Check system compatibility and configuration
 */

const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const { execSync } = require("child_process");

module.exports = async function doctorCommand() {
  console.log(chalk.cyan.bold("\n🩺 ClawFlow Doctor - System Diagnostic\n"));

  const checks = [
    { name: "Node.js version", check: checkNode },
    { name: "OpenClaw CLI", check: checkOpenClaw },
    { name: "ClawHub CLI", check: checkClawHub },
    { name: "Git CLI", check: checkGit },
    { name: "Configuration", check: checkConfig },
    { name: "Skills Path", check: checkSkillsPath },
  ];

  let errors = 0;
  let warnings = 0;

  for (const item of checks) {
    process.stdout.write(chalk.white(`  Checking ${item.name}... `));
    try {
      const result = await item.check();
      if (result.status === "ok") {
        process.stdout.write(chalk.green("✓\n"));
        if (result.message) console.log(chalk.gray(`     ${result.message}`));
      } else if (result.status === "warn") {
        process.stdout.write(chalk.yellow("⚠️\n"));
        console.log(chalk.yellow(`     ${result.message}`));
        warnings++;
      } else {
        process.stdout.write(chalk.red("✗\n"));
        console.log(chalk.red(`     ${result.message}`));
        errors++;
      }
    } catch (err) {
      process.stdout.write(chalk.red("✗\n"));
      console.log(chalk.red(`     Error: ${err.message}`));
      errors++;
    }
  }

  console.log("\n" + "─".repeat(50));
  if (errors === 0 && warnings === 0) {
    console.log(
      chalk.green.bold("✨ Everything looks great! You are ready to go."),
    );
  } else if (errors === 0) {
    console.log(
      chalk.yellow.bold(`⚠️  System ready but with ${warnings} warning(s).`),
    );
  } else {
    console.log(
      chalk.red.bold(`❌ Found ${errors} error(s) and ${warnings} warning(s).`),
    );
    console.log(
      chalk.gray("   Please fix the errors above before continuing."),
    );
  }
  console.log();
};

async function checkNode() {
  const version = process.version;
  const major = parseInt(version.slice(1).split(".")[0], 10);
  if (major < 16) {
    return {
      status: "error",
      message: `Node.js ${version} is too old. Please use v16 or newer.`,
    };
  }
  return { status: "ok", message: version };
}

async function checkOpenClaw() {
  try {
    const out = execSync("openclaw --version", { stdio: "pipe" })
      .toString()
      .trim();
    return { status: "ok", message: out };
  } catch (e) {
    return {
      status: "warn",
      message: "OpenClaw CLI not found in PATH. Make sure it is installed.",
    };
  }
}

async function checkClawHub() {
  try {
    const out = execSync("clawhub --version", { stdio: "pipe" })
      .toString()
      .trim();
    return { status: "ok", message: out };
  } catch (e) {
    return {
      status: "warn",
      message: "ClawHub CLI not found. Registry installs might fail.",
    };
  }
}

async function checkGit() {
  try {
    const out = execSync("git --version", { stdio: "pipe" }).toString().trim();
    return { status: "ok", message: out };
  } catch (e) {
    return {
      status: "error",
      message: "Git is required for many ClawFlow features.",
    };
  }
}

async function checkConfig() {
  const configFile = path.join(process.cwd(), ".clawflowhub", "config.json");
  if (fs.existsSync(configFile)) {
    return { status: "ok", message: "Local configuration found." };
  }
  return {
    status: "warn",
    message: 'No local .clawflowhub folder. Run "clawflow init".',
  };
}

async function checkSkillsPath() {
  const configFile = path.join(process.cwd(), ".clawflowhub", "config.json");
  if (!fs.existsSync(configFile))
    return { status: "warn", message: "Unknown skills path." };

  try {
    const config = fs.readJsonSync(configFile);
    const skillsPath = config.openclaw?.skillsPath;
    if (skillsPath && fs.existsSync(skillsPath)) {
      return { status: "ok", message: skillsPath };
    }
    return { status: "error", message: `Skills path not found: ${skillsPath}` };
  } catch (e) {
    return { status: "error", message: "Failed to read config.json" };
  }
}
