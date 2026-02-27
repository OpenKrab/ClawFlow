/**
 * ClawFlow - Core Module
 * 
 * Skill + Cron Installer for OpenClaw
 * ติดตั้ง skill พร้อมตั้งค่าใช้งานทันที
 */

const ConfigManager = require('./core/ConfigManager');
const Registry = require('./core/Registry');
const Installer = require('./core/Installer');
const CronManager = require('./core/CronManager');
const PackageResolver = require('./core/PackageResolver');

class ClawFlow {
  constructor(options = {}) {
    this.config = new ConfigManager(options.configPath, {
      skillsPath: options.skillsPath,
      cronJobsFile: options.cronJobsFile,
      openclawBin: options.openclawBin,
      clawhubBin: options.clawhubBin,
    });
    this.registry = new Registry(this.config);
    this.installer = new Installer(this.config, this.registry);
    this.cronManager = new CronManager(this.config);
    this.installer.setCronManager(this.cronManager);
    this.resolver = new PackageResolver(this.registry);
  }

  /**
   * ติดตั้ง package พร้อม skills และ cronjobs
   */
  async install(packageName, options = {}) {
    return this.installer.install(packageName, options);
  }

  /**
   * ถอนการติดตั้ง package
   */
  async remove(packageName, options = {}) {
    return this.installer.remove(packageName, options);
  }

  /**
   * แสดงรายการ packages ที่ติดตั้ง
   */
  async listInstalled() {
    return this.registry.getInstalledPackages();
  }

  /**
   * แสดงรายการ packages ที่พร้อมติดตั้ง
   */
  async listAvailable() {
    return this.registry.getAvailablePackages();
  }

  /**
   * เพิ่ม cronjob
   */
  async addCron(skillName, schedule, params = {}) {
    return this.cronManager.add(skillName, schedule, params);
  }

  /**
   * ลบ cronjob
   */
  async removeCron(cronId) {
    return this.cronManager.remove(cronId);
  }

  /**
   * แสดงรายการ cronjobs
   */
  async listCrons() {
    return this.cronManager.list();
  }

  /**
   * แสดงสถานะระบบ
   */
  async getStatus() {
    return {
      version: require('../package.json').version,
      config: this.config.getConfigPath(),
      installed: await this.listInstalled(),
      crons: await this.listCrons(),
    };
  }
}

module.exports = ClawFlow;
