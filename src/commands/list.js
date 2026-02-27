/**
 * List command - Show packages
 */

const ClawFlow = require('../index');
const TUI = require('../core/TerminalUI');

module.exports = async function listCommand(options) {
  const { available = false, npm = false } = options;

  const hub = new ClawFlow();

  try {
    if (available || npm) {
      // Show available packages
      TUI.printSection('Available Packages');

      const packages = await hub.registry.getAvailablePackages({
        includeNpm: npm || true,
      });

      if (packages.length === 0) {
        TUI.printInfo('No packages found');
      } else {
        // แยกตาม source
        const builtins = packages.filter((p) => p.source === 'builtin');
        const npms = packages.filter((p) => p.source === 'npm');

        if (builtins.length > 0) {
          console.log();
          console.log(TUI.neonGlow('Built-in Packages:', TUI.colors.warning));
          builtins.forEach((pkg) => {
            console.log();
            console.log(TUI.neonGlow('  ● ' + pkg.name, TUI.colors.success) + ' ' + pkg.version);
            console.log('    ' + TUI.colors.info + (pkg.description || 'No description'));
            console.log('    ' + TUI.colors.secondary + 'Skills: ' + TUI.colors.info + pkg.skills + ' | ' + TUI.colors.secondary + 'Crons: ' + TUI.colors.info + pkg.crons);
          });
        }

        if (npms.length > 0) {
          console.log();
          console.log(TUI.neonGlow('NPM Packages:', TUI.colors.warning));
          npms.forEach((pkg) => {
            console.log();
            console.log(TUI.neonGlow('  ◆ ' + pkg.name, TUI.colors.secondary) + ' ' + pkg.version);
            console.log('    ' + TUI.colors.info + (pkg.description || 'No description'));
            console.log('    ' + TUI.colors.secondary + 'Author: ' + TUI.colors.info + pkg.author);
          });
        }
      }
    } else {
      // Show installed packages
      TUI.printSection('Installed Packages');

      const installed = await hub.registry.getInstalledPackages();
      const entries = Object.entries(installed);

      if (entries.length === 0) {
        TUI.printInfo('No packages installed yet');
        TUI.printInfo('Use "clawflow install <package>" to install');
      } else {
        entries.forEach(([name, info]) => {
          console.log();
          console.log(TUI.neonGlow('  ✓ ' + name, TUI.colors.success) + ' ' + info.version);
            console.log('    ' + TUI.colors.secondary + 'Installed at: ' + TUI.colors.info + new Date(info.installedAt).toLocaleString());
          if (info.skills?.length > 0) {
            console.log('    ' + TUI.colors.secondary + 'Skills: ' + TUI.colors.info + info.skills.join(', '));
          }
          if (info.crons?.length > 0) {
            console.log('    ' + TUI.colors.secondary + 'Cronjobs: ' + TUI.colors.info + info.crons.length + ' entries');
          }
        });
      }
    }
  } catch (error) {
    TUI.printError(error.message);
    process.exit(1);
  }
};
