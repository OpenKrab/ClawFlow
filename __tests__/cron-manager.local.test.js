const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const ConfigManager = require('../src/core/ConfigManager');
const CronManager = require('../src/core/CronManager');

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('CronManager local mode', () => {
  test('add/edit/list/remove lifecycle works with normalized schedules', async () => {
    const root = makeTempDir('cfh-cron-');
    const configPath = path.join(root, 'config');
    const cronJobsFile = path.join(root, 'cron', 'jobs.json');

    const configManager = new ConfigManager(configPath, {
      cronJobsFile,
      openclawBin: 'notfound-openclaw',
    });
    const cronManager = new CronManager(configManager);

    expect(cronManager.useOpenClawCron).toBe(false);

    const added = await cronManager.add('smoke-skill', 'every 15m', { foo: 'bar' }, 'demo');
    expect(added.id).toBeTruthy();
    expect(added.schedule).toBe('*/15 * * * *');

    const listed = cronManager.list();
    expect(listed).toHaveLength(1);
    expect(listed[0].schedule).toBe('*/15 * * * *');

    const edited = await cronManager.edit(added.id, {
      schedule: '@daily',
      description: 'daily run',
      params: { foo: 'baz' },
    });
    expect(edited.schedule).toBe('0 0 * * *');
    expect(edited.description).toBe('daily run');
    expect(edited.params).toEqual({ foo: 'baz' });

    const listedAfterEdit = cronManager.list();
    expect(listedAfterEdit).toHaveLength(1);
    expect(listedAfterEdit[0].schedule).toBe('0 0 * * *');

    await cronManager.remove(added.id);
    expect(cronManager.list()).toEqual([]);

    cronManager.stopAll();
  });

  test('rejects invalid schedules', async () => {
    const root = makeTempDir('cfh-cron-');
    const configPath = path.join(root, 'config');
    const cronJobsFile = path.join(root, 'cron', 'jobs.json');

    const configManager = new ConfigManager(configPath, {
      cronJobsFile,
      openclawBin: 'notfound-openclaw',
    });
    const cronManager = new CronManager(configManager);

    await expect(cronManager.add('smoke-skill', 'wrong schedule', {})).rejects.toThrow(/ไม่ถูกต้อง/);
  });
});
