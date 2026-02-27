/**
 * Cron commands - จัดการ cronjobs
 */

const chalk = require('chalk');
const ClawFlow = require('../index');
const { normalizeCronExpression } = require('../core/CronFormat');

function parseJsonParams(params) {
  if (params === undefined || params === null || params === '') {
    return {};
  }

  if (typeof params === 'object') {
    return params;
  }

  return JSON.parse(params);
}

function resolveScheduleInput(options) {
  if (options.every) {
    return normalizeCronExpression(`every ${options.every}`);
  }

  return normalizeCronExpression(options.schedule || '*/5 * * * *');
}

module.exports = {
  async list() {
    const hub = new ClawFlow();

    try {
      console.log(chalk.cyan.bold('\n⏰ Configured Cronjobs:\n'));

      const crons = await hub.listCrons();

      if (crons.length === 0) {
        console.log(chalk.gray('  No cronjobs configured'));
      } else {
        crons.forEach((job) => {
          const status = job.enabled !== false ? chalk.green('●') : chalk.gray('○');
          console.log(`  ${status} ${chalk.bold(job.skill || job.name)}`);
          console.log(`    ${chalk.blue('Schedule:')} ${job.schedule}`);
          console.log(`    ${chalk.blue('Description:')} ${job.description || '-'}`);
          console.log();
        });
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  },

  async add(skillName, options) {
    const { params = '{}', description = '' } = options;

    const hub = new ClawFlow();

    try {
      const parsedParams = parseJsonParams(params);
      const schedule = resolveScheduleInput(options);

      console.log(chalk.cyan(`\n➕ Adding cronjob for ${chalk.bold(skillName)}...\n`));

      const job = await hub.cronManager.add(skillName, schedule, parsedParams, description);

      console.log(chalk.green(`\n✓ Cronjob added successfully`));
      console.log(`  ID: ${job.id}`);
      console.log(`  Schedule: ${job.schedule}`);
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  },

  async remove(jobId) {
    const hub = new ClawFlow();

    try {
      console.log(chalk.cyan(`\n🗑️  Removing cronjob ${chalk.bold(jobId)}...\n`));

      await hub.cronManager.remove(jobId);

      console.log(chalk.green(`\n✓ Cronjob removed successfully`));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  },

  async edit(jobId, options) {
    const hub = new ClawFlow();

    try {
      const updates = {};
      if (options.schedule || options.every) {
        updates.schedule = resolveScheduleInput(options);
      }
      if (typeof options.description === 'string') {
        updates.description = options.description;
      }
      if (options.params !== undefined) {
        updates.params = parseJsonParams(options.params);
      }

      if (Object.keys(updates).length === 0) {
        throw new Error('No update data provided (use --schedule/--every/--description/--params)');
      }

      const updated = await hub.cronManager.edit(jobId, updates);

      console.log(chalk.green(`\n✓ Cronjob updated successfully`));
      console.log(`  ID: ${updated.id || jobId}`);
      if (updated.schedule) {
        console.log(`  Schedule: ${updated.schedule}`);
      }
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error.message}`));
      process.exit(1);
    }
  },
};
