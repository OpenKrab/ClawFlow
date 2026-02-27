/**
 * Registry - จัดการ package registry
 * ทั้ง built-in, npm registry และ remote registry
 */

const path = require('path');
const axios = require('axios');
const NPMRegistry = require('./NPMRegistry');

class Registry {
  constructor(configManager) {
    this.configManager = configManager;
    this.packages = new Map();
    this.npmRegistry = new NPMRegistry();
    this.npmCacheDir = path.join(configManager.getConfigPath(), 'npm-cache');
    this.loadBuiltinPackages();
  }

  /**
   * โหลด built-in packages
   */
  loadBuiltinPackages() {
    // Built-in package definitions
    const builtins = {
      'trading-kit': {
        name: 'trading-kit',
        version: '1.0.0',
        description: 'ชุดเครื่องมือสำหรับเทรดคริปโต รวม skills และ cronjobs',
        author: 'ClawFlow',
        skills: [
          { name: 'binance-pro', version: '^1.0.0', source: 'openclaw' },
          { name: 'crypto-price', version: '^1.0.0', source: 'openclaw' },
          { name: 'trading-research', version: '^1.0.0', source: 'openclaw' },
        ],
        crons: [
          {
            skill: 'crypto-price',
            schedule: '*/5 * * * *',
            params: { symbols: ['BTC', 'ETH', 'SOL'] },
            description: 'เช็คราคาคริปโตทุก 5 นาที',
          },
          {
            skill: 'binance-pro',
            schedule: '0 */1 * * *',
            params: { action: 'sync_balance' },
            description: 'Sync balance ทุกชั่วโมง',
          },
        ],
        config: {
          'binance-pro': {
            apiKey: { env: 'BINANCE_API_KEY', required: true },
            secretKey: { env: 'BINANCE_SECRET_KEY', required: true },
          },
          'crypto-price': {
            provider: 'binance',
            defaultCurrency: 'USDT',
          },
        },
        postInstall: 'ทำการตั้งค่า API Key สำหรับ Binance ใน config',
      },
      'social-media-kit': {
        name: 'social-media-kit',
        version: '1.0.0',
        description: 'จัดการโพสต์ Social Media แบบอัตโนมัติ',
        author: 'ClawFlow',
        skills: [
          { name: 'facebook-poster', version: '^1.0.0', source: 'openclaw' },
          { name: 'twitter-poster', version: '^1.0.0', source: 'openclaw' },
          { name: 'content-generator', version: '^1.0.0', source: 'openclaw' },
        ],
        crons: [
          {
            skill: 'content-generator',
            schedule: '0 9 * * *',
            params: { type: 'daily_post' },
            description: 'สร้าง content ทุกเช้า 9 โมง',
          },
          {
            skill: 'facebook-poster',
            schedule: '0 10,14,18 * * *',
            params: { autoSchedule: true },
            description: 'โพสต์ Facebook วันละ 3 ครั้ง',
          },
        ],
        config: {
          'facebook-poster': {
            pageId: { required: true },
            accessToken: { env: 'FB_ACCESS_TOKEN', required: true },
          },
          'twitter-poster': {
            apiKey: { env: 'TWITTER_API_KEY', required: true },
            apiSecret: { env: 'TWITTER_API_SECRET', required: true },
          },
        },
      },
      'monitoring-kit': {
        name: 'monitoring-kit',
        version: '1.0.0',
        description: 'ระบบตรวจสอบและแจ้งเตือน',
        author: 'ClawFlow',
        skills: [
          { name: 'uptime-checker', version: '^1.0.0', source: 'openclaw' },
          { name: 'discord-notifier', version: '^1.0.0', source: 'openclaw' },
          { name: 'log-analyzer', version: '^1.0.0', source: 'openclaw' },
        ],
        crons: [
          {
            skill: 'uptime-checker',
            schedule: '* * * * *',
            params: { urls: [] },
            description: 'เช็ค uptime ทุกนาที',
          },
          {
            skill: 'log-analyzer',
            schedule: '0 */6 * * *',
            params: { reportType: 'summary' },
            description: 'วิเคราะห์ log ทุก 6 ชั่วโมง',
          },
        ],
        config: {
          'uptime-checker': {
            urls: { required: true, type: 'array' },
            timeout: { default: 5000 },
          },
          'discord-notifier': {
            webhookUrl: { env: 'DISCORD_WEBHOOK', required: true },
          },
        },
      },
      'data-sync-kit': {
        name: 'data-sync-kit',
        version: '1.0.0',
        description: 'ซิงค์ข้อมูลระหว่างระบบต่างๆ',
        author: 'ClawFlow',
        skills: [
          { name: 'gsheet-sync', version: '^1.0.0', source: 'openclaw' },
          { name: 'notion-sync', version: '^1.0.0', source: 'openclaw' },
          { name: 'db-backup', version: '^1.0.0', source: 'openclaw' },
        ],
        crons: [
          {
            skill: 'db-backup',
            schedule: '0 2 * * *',
            params: { compress: true },
            description: 'Backup database ตี 2 ทุกวัน',
          },
          {
            skill: 'gsheet-sync',
            schedule: '0 */4 * * *',
            params: { mode: 'incremental' },
            description: 'Sync Google Sheets ทุก 4 ชั่วโมง',
          },
        ],
        config: {
          'gsheet-sync': {
            credentials: { env: 'GOOGLE_CREDENTIALS', required: true },
            sheetId: { required: true },
          },
          'notion-sync': {
            token: { env: 'NOTION_TOKEN', required: true },
            databaseId: { required: true },
          },
        },
      },
    };

    Object.entries(builtins).forEach(([name, pkg]) => {
      this.packages.set(name, pkg);
    });
  }

  /**
   * ดึงข้อมูล package
   * ลองหาจาก built-in ก่อน ถ้าไม่มีจะไปดึงจาก npm
   */
  async getPackage(name, options = {}) {
    const { fetchFromNpm = true } = options;

    // 1. ตรวจสอบใน built-in packages ก่อน
    if (this.packages.has(name)) {
      return this.packages.get(name);
    }

    // 2. ตรวจสอบใน npm registry (ถ้า enable)
    if (fetchFromNpm) {
      try {
        const npmPkg = await this.npmRegistry.getPackage(name);
        if (npmPkg && this.npmRegistry.isClawFlowPackage({ name, keywords: npmPkg.keywords })) {
          return npmPkg;
        }
      } catch (error) {
        // ถ้า fetch ไม่สำเร็จ ให้ return null
        console.warn(`Failed to fetch ${name} from npm:`, error.message);
      }
    }

    return null;
  }

  /**
   * ดึงรายการ packages ที่มีให้ติดตั้ง
   * รวมทั้ง built-in และจาก npm registry
   */
  async getAvailablePackages(options = {}) {
    const { includeNpm = true, limit = 100 } = options;

    // 1. Built-in packages
    const packages = Array.from(this.packages.values()).map((pkg) => ({
      name: pkg.name,
      version: pkg.version,
      description: pkg.description,
      author: pkg.author,
      skills: pkg.skills?.length || 0,
      crons: pkg.crons?.length || 0,
      source: 'builtin',
    }));

    // 2. NPM packages (ถ้า enable)
    if (includeNpm) {
      try {
        const npmPackages = await this.npmRegistry.getPopularPackages(limit);
        for (const pkg of npmPackages) {
          // ไม่ add ถ้าชื่อซ้ำกับ builtin
          if (!this.packages.has(pkg.name)) {
            packages.push({
              name: pkg.name,
              version: pkg.version,
              description: pkg.description,
              author: pkg.author,
              skills: pkg.skills?.length || 0,
              crons: pkg.crons?.length || 0,
              source: 'npm',
            });
          }
        }
      } catch (error) {
        console.warn('Failed to fetch npm packages:', error.message);
      }
    }

    return packages;
  }

  /**
   * ดึงรายการ packages ที่ติดตั้งแล้ว
   */
  getInstalledPackages() {
    return this.configManager.getInstalledPackages();
  }

  /**
   * ค้นหา package
   * ค้นหาทั้งใน built-in และ npm registry
   */
  async searchPackages(query, options = {}) {
    const { includeNpm = true, limit = 50 } = options;
    const results = [];
    const seen = new Set();

    // 1. ค้นหาใน built-in packages
    for (const [name, pkg] of this.packages) {
      if (
        name.includes(query) ||
        pkg.description?.includes(query) ||
        pkg.skills?.some((s) => s.name?.includes(query))
      ) {
        results.push({ ...pkg, source: 'builtin' });
        seen.add(name);
      }
    }

    // 2. ค้นหาใน npm registry (ถ้า enable)
    if (includeNpm) {
      try {
        const npmResults = await this.npmRegistry.searchClawFlowPackages(query);
        for (const pkg of npmResults) {
          if (!seen.has(pkg.name)) {
            results.push({ ...pkg, source: 'npm' });
            seen.add(pkg.name);
          }
        }
      } catch (error) {
        console.warn('Failed to search npm packages:', error.message);
      }
    }

    return results.slice(0, limit);
  }

  /**
   * ตรวจสอบว่า package มีอยู่หรือไม่
   * ตรวจสอบทั้ง built-in และ npm
   */
  async hasPackage(name, options = {}) {
    const { checkNpm = true } = options;

    // 1. ตรวจสอบ built-in
    if (this.packages.has(name)) {
      return true;
    }

    // 2. ตรวจสอบ npm (ถ้า enable)
    if (checkNpm) {
      try {
        const npmPkg = await this.npmRegistry.getPackage(name);
        return npmPkg !== null;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * ดึง dependencies ของ package
   */
  getDependencies(name) {
    const pkg = this.getPackage(name);
    if (!pkg) return [];
    return pkg.skills.map(s => s.name);
  }

  /**
   * โหลด package จาก remote registry (legacy)
   */
  async fetchRemotePackage(name) {
    const config = this.configManager.getConfig();
    const registryUrl = config.registry?.url;

    if (!registryUrl) {
      return null;
    }

    try {
      const response = await axios.get(`${registryUrl}/packages/${name}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  /**
   * ดึงรายการ npm packages ยอดนิยม
   */
  async getNpmPopularPackages(limit = 20) {
    return this.npmRegistry.getPopularPackages(limit);
  }

  /**
   * ดึงข้อมูล package จาก npm โดยตรง
   */
  async getNpmPackage(name, version = 'latest') {
    return this.npmRegistry.getPackage(name, version);
  }

  /**
   * ตรวจสอบว่าเป็น npm package หรือไม่
   */
  isNpmPackage(name) {
    return name.startsWith('@') || name.includes('/');
  }

  /**
   * ล้าง npm cache
   */
  clearNpmCache() {
    this.npmRegistry.clearCache();
  }

  /**
   * ดึง versions ทั้งหมดของ package จาก npm
   */
  async getPackageVersions(name) {
    const manifest = await this.npmRegistry.getPackageManifest(name);
    if (!manifest) return [];

    return Object.keys(manifest.versions || {}).sort((a, b) => {
      // Sort by semver (latest first)
      const semver = require('semver');
      return semver.rcompare(a, b);
    });
  }

  /**
   * Resolve package name ที่อาจมี version specifier
   * เช่น "trading-kit@^1.0.0" -> { name: "trading-kit", version: "^1.0.0" }
   */
  parsePackageSpecifier(spec) {
    const match = spec.match(/^(@?[^@]+)(?:@(.+))?$/);
    if (!match) return null;

    return {
      name: match[1],
      version: match[2] || 'latest',
    };
  }
}

module.exports = Registry;
