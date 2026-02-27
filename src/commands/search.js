/**
 * Search command - Search packages
 */

const ClawFlow = require('../index');
const TUI = require('../core/TerminalUI');

module.exports = async function searchCommand(query, options) {
  const { npm = true } = options;

  if (!query) {
    TUI.printWarning('Please specify a search query');
    console.log('  ' + TUI.colors.info + 'Example: clawflow search trading');
    process.exit(1);
  }

  const hub = new ClawFlow();

  try {
    console.log();
    TUI.printInfo('Searching for "' + query + '"...');
    console.log();

    const results = await hub.registry.searchPackages(query, {
      includeNpm: npm,
      limit: 50,
    });

    if (results.length === 0) {
      TUI.printWarning('No packages match your search');
      TUI.printInfo('Try a different query or check your internet connection');
    } else {
      TUI.printSuccess('Found ' + results.length + ' packages');
      console.log();

      results.forEach((pkg) => {
        const icon = pkg.source === 'builtin' ? '●' : '◆';
        const sourceLabel = pkg.source === 'builtin' ? TUI.colors.info + '[built-in]' : TUI.colors.secondary + '[npm]';

        console.log(TUI.neonGlow('  ' + icon + ' ', TUI.colors.success) + TUI.neonGlow(pkg.name, TUI.colors.secondary) + ' ' + pkg.version + ' ' + sourceLabel);
        console.log('    ' + TUI.colors.info + (pkg.description || 'No description'));

        if (pkg.skills?.length > 0) {
          console.log('    ' + TUI.colors.secondary + 'Skills: ' + TUI.colors.info + pkg.skills.map((s) => s.name || s).join(', '));
        }

        if (pkg.crons?.length > 0) {
          console.log('    ' + TUI.colors.secondary + 'Cronjobs: ' + TUI.colors.info + pkg.crons.length + ' entries');
        }

        if (pkg.source === 'npm' && pkg.author) {
          console.log('    ' + TUI.colors.secondary + 'Author: ' + TUI.colors.info + pkg.author);
        }

        console.log();
      });

      TUI.printInfo('Use "clawflow install <package-name>" to install');
    }
  } catch (error) {
    TUI.printError(error.message);
    process.exit(1);
  }
};
