const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const ConfigManager = require('../src/core/ConfigManager');

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

describe('ConfigManager', () => {
  test('applies path and bin overrides into openclaw config', () => {
    const configDir = makeTempDir('cfh-config-');
    const skillsPath = path.join(configDir, 'custom-skills');
    const cronJobsFile = path.join(configDir, 'custom-cron', 'jobs.json');

    const manager = new ConfigManager(configDir, {
      skillsPath,
      cronJobsFile,
      openclawBin: '/usr/local/bin/openclaw',
      clawhubBin: '/usr/local/bin/clawhub',
    });

    const config = manager.getConfig();
    expect(config.openclaw.skillsPath).toBe(skillsPath);
    expect(config.openclaw.cronJobsFile).toBe(cronJobsFile);
    expect(config.openclaw.cliBin).toBe('/usr/local/bin/openclaw');
    expect(config.openclaw.clawhubBin).toBe('/usr/local/bin/clawhub');
    expect(manager.getCronJobsFilePath()).toBe(cronJobsFile);
  });

  test('addCron preserves provided id and updateCron mutates fields', () => {
    const configDir = makeTempDir('cfh-config-');
    const manager = new ConfigManager(configDir);

    manager.addCron({
      id: 'job-123',
      skill: 'crypto-price',
      schedule: '*/5 * * * *',
    });

    const updated = manager.updateCron('job-123', {
      schedule: '0 * * * *',
      description: 'hourly',
    });

    expect(updated).toBeTruthy();
    expect(updated.id).toBe('job-123');
    expect(updated.schedule).toBe('0 * * * *');
    expect(updated.description).toBe('hourly');
    expect(updated.updatedAt).toBeTruthy();
  });
});
