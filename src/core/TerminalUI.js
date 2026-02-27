/**
 * ClawFlow Terminal UI
 * Retro + Modern terminal styling
 * 
 * Design: Retro Terminal + Modern Polish
 * - Box-drawing characters (retro)
 * - Neon colors (modern)
 * - Gradient effects (modern)
 * - ASCII art headers (retro)
 * - Glow effects (modern)
 */

const chalk = require('chalk');
const gradientString = require('gradient-string');
const gradient = gradientString.default || gradientString;
const boxen = require('boxen');

// Color palette - Neon Retro with Orange & Lobster theme
const colors = {
  primary: '#ff9500',      // Orange
  secondary: '#ff6b35',    // Deep orange
  accent: '#ff9f1c',       // Bright orange
  warning: '#ffd93d',      // Yellow
  error: '#ff6b6b',        // Red
  success: '#00ff9f',     // Neon green
  info: '#6c5ce7',         // Purple
  
  // Orange/Lobster themed colors
  lobster: '#ff6b35',      // Lobster orange
  orange: '#ff9500',       // Apple orange
  sunset: '#ff7f50',       // Coral
  tangerine: '#ffb347',   // Pastel orange
  pumpkin: '#ff7518',      // Pumpkin
  coral: '#ff6b6b',        // Coral red
};

// Box styles
const boxStyles = {
  round: {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderStyle: 'round',
    borderColor: colors.primary,
  },
  bold: {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderStyle: 'bold',
    borderColor: colors.secondary,
  },
  double: {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderStyle: 'double',
    borderColor: colors.accent,
  },
  classic: {
    padding: { top: 0, bottom: 0, left: 1, right: 1 },
    borderStyle: 'classic',
    borderColor: colors.info,
  },
};

// ASCII Art for logo
const asciiLogo = `
  ██████╗██╗      █████╗ ██╗    ██╗███████╗██╗      ██████╗ ██╗    ██╗
 ██╔════╝██║     ██╔══██╗██║    ██║██╔════╝██║     ██╔═══██╗██║    ██║
 ██║     ██║     ███████║██║ █╗ ██║█████╗  ██║     ██║   ██║██║ █╗ ██║
 ██║     ██║     ██╔══██║██║███╗██║██╔══╝  ██║     ██║   ██║██║███╗██║
 ╚██████╗███████╗██║  ██║╚███╔███╔╝██║     ███████╗╚██████╔╝╚███╔███╔╝
  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝

  ClawFlow - Skill + Cron Installer for OpenClaw
`;

// Mini logo for sub-headers
const miniLogo = `
  ╭──────────────────────────────────────╮
  │  🦞 ClawFlow v{pkgVersion}            │
  │  ═══════════════════════════════════ │
  │  Skill + Cron Installer for OpenClaw │
  ╰──────────────────────────────────────╯
`;

/**
 * Create gradient text (modern effect)
 */
function gradientText(text, color1 = colors.primary, color2 = colors.secondary) {
  return gradient(color1, color2)(text);
}

/**
 * Create neon glow effect
 */
function neonGlow(text, color = colors.primary) {
  return chalk.hex(color).bold(text);
}

/**
 * Create retro scanline effect
 */
function scanline(text) {
  return chalk.dim(text);
}

/**
 * Create box with custom style
 */
function createBox(content, style = 'round') {
  const boxOptions = boxStyles[style] || boxStyles.round;
  return boxen(content, boxOptions);
}

/**
 * Create a retro-styled header
 */
function createHeader(title, style = 'gradient') {
  const line = '═'.repeat(50);
  
  switch (style) {
    case 'gradient':
      return `\n${gradientText(line, colors.primary, colors.secondary)}
  ${chalk.bold.cyan('  ' + title)}
${gradientText(line, colors.primary, colors.secondary)}\n`;
    
    case 'neon':
      return `\n${neonGlow(line, colors.primary)}
  ${neonGlow('  ' + title, colors.secondary)}
${neonGlow(line, colors.primary)}\n`;
    
    case 'retro':
      return `\n${chalk.green(line)}
  ${chalk.bold.green('  ' + title)}
${chalk.green(line)}\n`;
    
    default:
      return `\n${line}\n  ${title}\n${line}\n`;
  }
}

/**
 * Create a loading spinner with retro style
 */
function createSpinner(message) {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frame = 0;
  
  return {
    start: () => {
      process.stdout.write(chalk.cyan(frames[0]) + ' ' + message);
      const interval = setInterval(() => {
        process.stdout.write('\r' + chalk.cyan(frames[frame % frames.length]) + ' ' + message);
        frame++;
      }, 100);
      return {
        stop: (success = true, finalMessage = '') => {
          clearInterval(interval);
          process.stdout.write('\r' + (success ? chalk.green('✓') : chalk.red('✗')) + ' ' + finalMessage + '\n');
        }
      };
    }
  };
}

/**
 * Create progress bar (retro style)
 */
function createProgressBar(total, current, width = 30) {
  const filled = Math.round((current / total) * width);
  const empty = width - filled;
  
  const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
  const percentage = Math.round((current / total) * 100);
  
  return `[${bar}] ${percentage}%`;
}

/**
 * Print main banner
 */
function printBanner(_pkgVersion = '1.0.0') {
  const banner = gradientText(asciiLogo, colors.primary, colors.secondary);
  
  console.log(chalk.bgBlack(banner));
  console.log(gradientText('─'.repeat(60), colors.primary, colors.secondary));
  console.log('  🦞 ' + gradientText('Install skills and configure them for immediate use', colors.primary, colors.secondary));
  console.log(gradientText('─'.repeat(60), colors.primary, colors.secondary));
  console.log();
}

/**
 * Print section header
 */
function printSection(title) {
  console.log();
  console.log(neonGlow('┌' + '─'.repeat(58) + '┐', colors.secondary));
  console.log(neonGlow('│ ', colors.secondary) + chalk.bold.cyan(title.padEnd(56)) + neonGlow(' │', colors.secondary));
  console.log(neonGlow('└' + '─'.repeat(58) + '┘', colors.secondary));
}

/**
 * Print success message
 */
function printSuccess(message) {
  console.log(chalk.green('  ✓ ') + message);
}

/**
 * Print error message
 */
function printError(message) {
  console.log(chalk.red('  ✗ ') + message);
}

/**
 * Print warning message
 */
function printWarning(message) {
  console.log(chalk.yellow('  ⚠ ') + message);
}

/**
 * Print info message
 */
function printInfo(message) {
  console.log(chalk.cyan('  ℹ ') + message);
}

/**
 * Print table row
 */
function printTableRow(columns, widths) {
  const row = columns.map((col, i) => {
    return String(col).padEnd(widths[i]);
  }).join(chalk.gray(' │ '));
  
  console.log(chalk.gray('│ ') + row + chalk.gray(' │'));
}

/**
 * Print table header separator
 */
function printTableSeparator(widths) {
  console.log(chalk.gray('├─' + widths.map(w => '─'.repeat(w)).join('─┼─') + '─┤'));
}

/**
 * Print key-value pairs in a nice format
 */
function printKeyValue(key, value, indent = 2) {
  const spaces = ' '.repeat(indent);
  console.log(`${spaces}${chalk.cyan('●')} ${chalk.gray(key + ':')} ${chalk.white(value)}`);
}

/**
 * Print a list item with bullet
 */
function printListItem(item, indent = 2) {
  const spaces = ' '.repeat(indent);
  console.log(`${spaces}${chalk.green('›')} ${item}`);
}

/**
 * Print a list item with number
 */
function printNumberedItem(num, item, indent = 2) {
  const spaces = ' '.repeat(indent);
  console.log(`${spaces}${chalk.cyan(num + '.')} ${item}`);
}

/**
 * Print help command list
 */
function printCommandHelp(commands) {
  console.log();
  commands.forEach(cmd => {
    const alias = cmd.alias ? ` | ${chalk.yellow(cmd.alias)}` : '';
    console.log(`  ${chalk.green(cmd.name)}${alias}  ${chalk.gray('- ' + cmd.description)}`);
  });
  console.log();
}

/**
 * Print loading animation
 */
function loading(text) {
  const frames = ['◐', '◑', '◒', '◓'];
  let i = 0;
  const interval = setInterval(() => {
    process.stdout.write(`\r${chalk.cyan(frames[i++])} ${text}`);
    i = i % frames.length;
  }, 100);
  
  return () => clearInterval(interval);
}

/**
 * Clear screen and print banner
 */
function clearAndBanner(pkgVersion = '1.0.0') {
  console.clear();
  printBanner(pkgVersion);
}

module.exports = {
  colors,
  gradientText,
  neonGlow,
  scanline,
  createBox,
  createHeader,
  createSpinner,
  createProgressBar,
  printBanner,
  printSection,
  printSuccess,
  printError,
  printWarning,
  printInfo,
  printTableRow,
  printTableSeparator,
  printKeyValue,
  printListItem,
  printNumberedItem,
  printCommandHelp,
  loading,
  clearAndBanner,
  asciiLogo,
  miniLogo,
};
