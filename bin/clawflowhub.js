#!/usr/bin/env node

const { program } = require('commander');
const pkg = require('../package.json');

// Import TUI
const TUI = require('../src/core/TerminalUI');

// Import commands
const installCommand = require('../src/commands/install');
const listCommand = require('../src/commands/list');
const removeCommand = require('../src/commands/remove');
const cronCommand = require('../src/commands/cron');
const statusCommand = require('../src/commands/status');
const initCommand = require('../src/commands/init');
const searchCommand = require('../src/commands/search');

// Print new TUI banner
TUI.printBanner(pkg.version);

program
  .name('clawflow')
  .description('Install OpenClaw skills and set up cronjobs')
  .version(pkg.version, '-v, --version', 'Show version');

// Install command
program
  .command('install <package>')
  .alias('i')
  .description('Install a package including skills and cronjobs')
  .option('-g, --global', 'Install globally')
  .option('-c, --config <path>', 'Specify config file path')
  .option('--skills-path <path>', 'Specify OpenClaw workspace skills path')
  .option('--cron-jobs <path>', 'Specify OpenClaw cron jobs.json path')
  .option('--openclaw-bin <path>', 'Path to openclaw CLI binary')
  .option('--clawhub-bin <path>', 'Path to clawhub CLI binary')
  .option('--no-cron', 'Install skills without creating cronjobs')
  .option('--dry-run', 'Show what would be done without installing');
  .action(installCommand);

// List command
program
  .command('list')
  .alias('ls')
  .description('Show installed packages and skills')
  .option('-a, --available', 'Show packages available for install')
  .option('-i, --installed', 'Show installed packages (default)')
  .option('--npm', 'Include packages from npm registry (with --available)')
  .action(listCommand);

// Search command
program
  .command('search <query>')
  .alias('find')
  .description('Search packages in the registry')
  .option('--no-npm', 'Exclude results from npm registry')
  .action(searchCommand);

// Remove command
program
  .command('remove <package>')
  .alias('rm')
  .description('Uninstall a package')
  .option('-g, --global', 'Uninstall globally')
  .option('--keep-config', 'Keep package config files')
  .action(removeCommand);

// Cron command group
program
  .command('cron-list')
  .description('List all cronjobs')
  .action(cronCommand.list);

program
  .command('cron-add <skill>')
  .description('Add a cronjob for a skill')
  .option('-s, --schedule <expression>', 'cron schedule expression', '*/5 * * * *')
  .option('-e, --every <duration>', 'Shorthand like 5m, 1h, 2d')
  .option('-d, --description <text>', 'Cronjob description')
  .option('-p, --params <json>', 'Parameters for the skill')
  .action(cronCommand.add);

program
  .command('cron-edit <id>')
  .description('Edit a cronjob')
  .option('-s, --schedule <expression>', 'New cron schedule expression')
  .option('-e, --every <duration>', 'Shorthand like 5m, 1h, 2d')
  .option('-d, --description <text>', 'New description')
  .option('-p, --params <json>', 'New parameters for the skill')
  .action(cronCommand.edit);

program
  .command('cron-remove <id>')
  .description('Remove a cronjob')
  .action(cronCommand.remove);

// Status command
program
  .command('status')
  .description('Show system status')
  .action(statusCommand);

// Init command
program
  .command('init')
  .description('Initialize ClawFlow in the current directory')
  .option('-f, --force', 'Overwrite existing config')
  .action(initCommand);

// Global error handler
process.on('unhandledRejection', (err) => {
  TUI.printError('เกิดข้อผิดพลาด: ' + err.message);
  if (process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
});

program.parse();
