/**
 * ConfigManager - จัดการ configuration และ state ของ ClawFlow
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class ConfigManager {
  constructor(configPath = null, options = {}) {
    this.configPath = configPath || this.getDefaultConfigPath();
    this.overrides = options;
    this.config = null;
    this.ensureDirectories();
  }

  /**
   * ได้รับ default config path ตาม OS
   */
  getDefaultConfigPath() {
    const homeDir = os.homedir();
    switch (process.platform) {
      case 'win32':
        return path.join(homeDir, 'AppData', 'Roaming', 'ClawFlow');
      case 'darwin':
        return path.join(homeDir, 'Library', 'Application Support', 'ClawFlow');
      default: // linux
        return path.join(homeDir, '.config', 'clawflowhub');
    }
  }

  /**
   * สร้างโฟลเดอร์ที่จำเป็น
   */
  ensureDirectories() {
    const configFile = path.join(this.configPath, 'config.json');
    const defaultConfig = this.getDefaultConfig();
    const existingConfig = fs.existsSync(configFile) ? fs.readJsonSync(configFile) : {};
    const mergedConfig = this.applyOpenClawOverrides({
      ...defaultConfig,
      ...existingConfig,
      openclaw: {
        ...defaultConfig.openclaw,
        ...(existingConfig.openclaw || {}),
      },
    });

    const dirs = [
      this.configPath,
      path.dirname(mergedConfig.openclaw.skillsPath),
      mergedConfig.openclaw.skillsPath,
      path.dirname(mergedConfig.openclaw.cronJobsFile),
      path.join(this.configPath, 'logs'),
      path.join(this.configPath, 'packages'),
    ];

    dirs.forEach((dir) => {
      fs.ensureDirSync(dir);
    });

    if (!fs.existsSync(configFile) || JSON.stringify(existingConfig) !== JSON.stringify(mergedConfig)) {
      fs.writeJsonSync(configFile, mergedConfig, { spaces: 2 });
    }
  }

  /**
   * Config เริ่มต้น
   */
  getDefaultConfig() {
    const openclawHome = path.join(os.homedir(), '.openclaw');
    const workspacePath = path.join(openclawHome, 'workspace');

    return {
      version: '1.0.0',
      openclaw: {
        baseUrl: 'http://localhost:3000',
        apiKey: null,
        cliBin: 'openclaw',
        clawhubBin: 'clawhub',
        workspacePath,
        skillsPath: path.join(workspacePath, 'skills'),
        cronJobsFile: path.join(openclawHome, 'cron', 'jobs.json'),
      },
      registry: {
        url: 'https://registry.clawflowhub.dev',
        cacheExpiry: 3600, // วินาที
      },
      cron: {
        enabled: true,
        logLevel: 'info',
        maxConcurrentJobs: 5,
      },
      installed: {},
      crons: [],
      lastUpdate: null,
    };
  }

  applyOpenClawOverrides(config) {
    return {
      ...config,
      openclaw: {
        ...(config.openclaw || {}),
        ...(this.overrides.skillsPath ? { skillsPath: this.overrides.skillsPath } : {}),
        ...(this.overrides.cronJobsFile ? { cronJobsFile: this.overrides.cronJobsFile } : {}),
        ...(this.overrides.openclawBin ? { cliBin: this.overrides.openclawBin } : {}),
        ...(this.overrides.clawhubBin ? { clawhubBin: this.overrides.clawhubBin } : {}),
      },
    };
  }

  /**
   * โหลด config
   */
  loadConfig() {
    const configFile = path.join(this.configPath, 'config.json');
    if (fs.existsSync(configFile)) {
      this.config = fs.readJsonSync(configFile);
    } else {
      this.config = this.applyOpenClawOverrides(this.getDefaultConfig());
    }
    return this.config;
  }

  /**
   * บันทึก config
   */
  saveConfig(config = null) {
    if (config) {
      this.config = config;
    }
    const configFile = path.join(this.configPath, 'config.json');
    fs.writeJsonSync(configFile, this.config, { spaces: 2 });
  }

  /**
   * ดึงค่า config ปัจจุบัน
   */
  getConfig() {
    if (!this.config) {
      this.loadConfig();
    }
    return this.config;
  }

  /**
   * อัปเดตค่า config
   */
  setConfig(key, value) {
    const config = this.getConfig();
    const keys = key.split('.');
    let target = config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!target[keys[i]]) {
        target[keys[i]] = {};
      }
      target = target[keys[i]];
    }
    
    target[keys[keys.length - 1]] = value;
    this.saveConfig();
  }

  /**
   * ดึง path ของ config
   */
  getConfigPath() {
    return this.configPath;
  }

  /**
   * ดึง path ของ skills
   */
  getSkillsPath() {
    const config = this.getConfig();
    return config.openclaw?.skillsPath || path.join(this.configPath, 'skills');
  }

  /**
   * ดึง path ของ crons
   */
  getCronsPath() {
    return path.dirname(this.getCronJobsFilePath());
  }

  /**
   * ดึง path ของ cron jobs file
   */
  getCronJobsFilePath() {
    const config = this.getConfig();
    return config.openclaw?.cronJobsFile || path.join(this.configPath, 'crons', 'jobs.json');
  }

  /**
   * ดึง path ของ logs
   */
  getLogsPath() {
    return path.join(this.configPath, 'logs');
  }

  /**
   * บันทึก installed package
   */
  addInstalledPackage(name, info) {
    const config = this.getConfig();
    if (!config.installed) {
      config.installed = {};
    }
    config.installed[name] = {
      ...info,
      installedAt: new Date().toISOString(),
    };
    this.saveConfig();
  }

  /**
   * ลบ installed package
   */
  removeInstalledPackage(name) {
    const config = this.getConfig();
    if (config.installed && config.installed[name]) {
      delete config.installed[name];
      this.saveConfig();
    }
  }

  /**
   * ดึงรายการ installed packages
   */
  getInstalledPackages() {
    return this.getConfig().installed || {};
  }

  /**
   * เพิ่ม cronjob
   */
  addCron(cronInfo) {
    const config = this.getConfig();
    if (!config.crons) {
      config.crons = [];
    }
    config.crons.push({
      id: cronInfo.id || Date.now().toString(),
      ...cronInfo,
      createdAt: new Date().toISOString(),
    });
    this.saveConfig();
    return config.crons[config.crons.length - 1];
  }

  /**
   * ลบ cronjob
   */
  removeCron(cronId) {
    const config = this.getConfig();
    if (config.crons) {
      config.crons = config.crons.filter(cron => cron.id !== cronId);
      this.saveConfig();
    }
  }

  /**
   * แก้ไข cronjob
   */
  updateCron(cronId, patch = {}) {
    const config = this.getConfig();
    if (!config.crons) {
      return null;
    }

    const idx = config.crons.findIndex((c) => c.id === cronId);
    if (idx === -1) {
      return null;
    }

    config.crons[idx] = {
      ...config.crons[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    this.saveConfig();

    return config.crons[idx];
  }

  /**
   * ดึงรายการ cronjobs
   */
  getCrons() {
    return this.getConfig().crons || [];
  }
}

module.exports = ConfigManager;
