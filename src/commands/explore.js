/**
 * Explore command - Discover new skills
 */

const chalk = require("chalk");
const boxen = require("boxen");

module.exports = async function exploreCommand() {
  console.log(chalk.magenta.bold("\n✨ Explore ClawHub Ecosystem\n"));

  const featured = [
    {
      name: "ClawGraph-Visualizer",
      desc: "Visualize your agent node relations",
      author: "clawflow-team",
    },
    {
      name: "Crypto-Whale-Watcher",
      desc: "Monitor large transactions on-chain",
      author: "crypto-dev",
    },
    {
      name: "Research-Pro-Agent",
      desc: "Multi-step research orchestrator",
      author: "openkrab",
    },
  ];

  console.log(chalk.white("Featured Skills & Agents:"));

  featured.forEach((item) => {
    const content = `${chalk.bold.cyan(item.name)}\n${chalk.gray(item.desc)}\n${chalk.yellow("By: " + item.author)}`;
    console.log(
      boxen(content, {
        padding: 1,
        margin: { top: 1, bottom: 0 },
        borderStyle: "round",
        borderColor: "magenta",
      }),
    );
  });

  console.log(
    chalk.gray('\nRun "clawflow search <query>" to find more packages!'),
  );
  console.log(
    chalk.gray("Or visit https://hub.clawflow.dev for the full registry.\n"),
  );
};
