/**
 * Remove command - Uninstall a package
 */

const chalk = require('chalk');
const ClawFlow = require('../index');

module.exports = async function removeCommand(packageName, options) {
  const { global = false, keepConfig = false } = options;

  const hub = new ClawFlow();

  try {
    console.log(chalk.cyan(`\n🗑️  Uninstalling ${chalk.bold(packageName)}...\n`));

    const result = await hub.remove(packageName, { global, keepConfig });

    if (result.success) {
      console.log(chalk.green(`\n✓ Uninstalled ${packageName} successfully`));
    } else {
      console.log(chalk.yellow(`\n⚠️  ${result.reason || 'Unable to uninstall'}`));
    }
  } catch (error) {
    console.error(chalk.red(`\n❌ Error: ${error.message}`));
    process.exit(1);
  }
};
