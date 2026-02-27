/**
 * Init command - Initialize ClawFlow
 */

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');

module.exports = async function initCommand(options) {
  const { force = false } = options;

  const cwd = process.cwd();
  const configDir = path.join(cwd, '.clawflowhub');
  const configFile = path.join(configDir, 'config.json');

  console.log(chalk.cyan.bold('\n🚀 Initialize ClawFlow\n'));

  // ตรวจสอบว่ามี config อยู่แล้วหรือไม่
  if (fs.existsSync(configFile) && !force) {
    console.log(chalk.yellow('⚠️  Existing configuration found in this folder'));
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: 'Do you want to overwrite the existing configuration?',
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.gray('  Operation cancelled'));
      return;
    }
  }

  // ถามค่าการตั้งค่า
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'skillsPath',
      message: 'Folder for storing skills:',
      default: './skills',
    },
    {
      type: 'input',
      name: 'openclawBin',
      message: 'Path to openclaw CLI:',
      default: 'openclaw',
    },
    {
      type: 'input',
      name: 'clawhubBin',
      message: 'Path to clawhub CLI:',
      default: 'clawhub',
    },
    {
      type: 'confirm',
      name: 'enableNpmRegistry',
      message: 'Enable NPM Registry (search packages from npm)?',
      default: true,
    },
  ]);

  // สร้าง config
  const config = {
    version: '1.0.0',
    openclaw: {
      baseUrl: 'http://localhost:3000',
      apiKey: null,
      cliBin: answers.openclawBin,
      clawhubBin: answers.clawhubBin,
      workspacePath: path.join(cwd, '.openclaw'),
      skillsPath: path.resolve(cwd, answers.skillsPath),
      cronJobsFile: path.join(cwd, '.clawflowhub', 'cron-jobs.json'),
    },
    registry: {
      url: 'https://registry.clawflowhub.dev',
      cacheExpiry: 3600,
      enableNpm: answers.enableNpmRegistry,
    },
    cron: {
      enabled: true,
      logLevel: 'info',
      maxConcurrentJobs: 5,
    },
    installed: {},
    crons: [],
    lastUpdate: new Date().toISOString(),
  };

  // สร้างโฟลเดอร์และเขียน config
  fs.ensureDirSync(configDir);
  fs.ensureDirSync(path.resolve(cwd, answers.skillsPath));
  fs.writeJsonSync(configFile, config, { spaces: 2 });

  // สร้าง .gitignore
  const gitignorePath = path.join(configDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, 'npm-cache/\nlogs/\n*.log\n');
  }

  console.log(chalk.green('\n✓ Configuration created successfully'));
  console.log(chalk.gray(`  Config: ${configFile}`));
  console.log(chalk.gray(`  Skills: ${config.openclaw.skillsPath}`));
  console.log();
  console.log(chalk.cyan('Available commands:'));
  console.log('  clawflow install <package>  - Install a package');
  console.log('  clawflow list               - Show packages');
  console.log('  clawflow search <query>     - Search packages');
  console.log();
};
