/**
 * Install Command - Install a package including skills and cronjobs
 */

const chalk = require('chalk');
const ClawFlow = require('../index');

module.exports = async function installCommand(packageName, options) {
  try {
    const cfh = new ClawFlow({
      configPath: options.config,
      skillsPath: options.skillsPath,
      cronJobsFile: options.cronJobs,
      openclawBin: options.openclawBin,
      clawhubBin: options.clawhubBin,
    });

    const result = await cfh.install(packageName, {
      global: options.global,
      cron: options.cron,
      dryRun: options.dryRun,
    });

    if (result.success) {
      console.log(chalk.green('\n🎉 Installation successful!'));

      if (!result.dryRun) {
        console.log(chalk.gray('\nRun the following commands to view details:'));
        console.log(chalk.cyan(`  clawflow status`));
        console.log(chalk.cyan(`  clawflow cron-list`));
      }
    }

  } catch (error) {
    console.error(chalk.red('\n❌ Installation failed:'), error.message);
    process.exit(1);
  }
};
