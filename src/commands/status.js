/**
 * Status command - Show system status
 */

const os = require('os');
const ClawFlow = require('../index');
const OpenClawCLI = require('../core/OpenClawCLI');
const TUI = require('../core/TerminalUI');

module.exports = async function statusCommand() {
  const hub = new ClawFlow();
  const openclawCLI = new OpenClawCLI(hub.config);

  TUI.printSection('ClawFlow System Status');

  // System Info
  TUI.printKeyValue('Node.js', process.version);
  TUI.printKeyValue('Platform', `${process.platform} (${os.arch()})`);
  TUI.printKeyValue('Home', os.homedir());
  console.log();

  // ClawFlow Config
  TUI.printKeyValue('Config Path', hub.config.getConfigPath());
  TUI.printKeyValue('Skills Path', hub.config.getSkillsPath());
  TUI.printKeyValue('Cron Jobs File', hub.config.getCronJobsFilePath());
  console.log();

  // OpenClaw Integration
  const hasOpenClaw = openclawCLI.hasOpenClaw();
  const hasClawhub = openclawCLI.hasClawhub();

  TUI.printKeyValue('openclaw CLI', hasOpenClaw ? '✓ Found' : '✗ Not found');
  TUI.printKeyValue('clawhub CLI', hasClawhub ? '✓ Found' : '✗ Not found');
  console.log();

  // Installed Packages
  const installed = await hub.listInstalled();
  const installedCount = Object.keys(installed).length;

  TUI.printKeyValue('Installed Packages', `${installedCount} packages`);

  if (installedCount > 0) {
    Object.entries(installed).forEach(([name, info]) => {
      TUI.printListItem(`${name}@${info.version}`, 4);
    });
  }
  console.log();

  // Cron Jobs
  const crons = await hub.listCrons();
  TUI.printKeyValue('Total Cron Jobs', `${crons.length} jobs`);
  TUI.printKeyValue('Enabled Jobs', `${crons.filter((c) => c.enabled !== false).length} jobs`);
  console.log();

  // NPM Registry
  TUI.printKeyValue('Registry URL', 'https://registry.npmjs.org');
  TUI.printKeyValue('Cache', 'Enabled (5 minutes)');
  console.log();

  TUI.printSuccess('System is operational');
  console.log();
};
