/**
 * NPMRegistry - Client สำหรับค้นหาและดึง packages จาก npm registry
 */

const axios = require('axios');

const NPM_REGISTRY_URL = 'https://registry.npmjs.org';
const NPM_SEARCH_URL = 'https://api.npms.io/v2';

class NPMRegistry {
  constructor(cacheDir = null) {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    this.cacheDir = cacheDir;
  }

  /**
   * ค้นหา packages ที่เป็น clawflow packages
   * โดยใช้ keyword 'clawflow' หรือ scope @clawflow
   */
  async searchClawFlowPackages(query = '') {
    try {
      // ค้นหาด้วย keyword 'clawflow'
      const searchQuery = query ? `${query} clawflow` : 'clawflow';
      const response = await axios.get(`${NPM_SEARCH_URL}/search`, {
        params: {
          q: searchQuery,
          size: 50,
        },
        timeout: 10000,
      });

      const results = response.data.results || [];
      return results
        .filter((item) => this.isClawFlowPackage(item.package))
        .map((item) => this.normalizePackage(item.package));
    } catch (error) {
      console.error('Error searching npm packages:', error.message);
      return [];
    }
  }

  /**
   * ตรวจสอบว่าเป็น clawflow package หรือไม่
   */
  isClawFlowPackage(pkg) {
    if (!pkg) return false;

    // ตรวจสอบ scope @clawflow/
    if (pkg.name.startsWith('@clawflow/')) {
      return true;
    }

    // ตรวจสอบ keywords
    const keywords = pkg.keywords || [];
    if (keywords.includes('clawflow')) {
      return true;
    }

    // ตรวจสอบ field clawflow ใน package.json
    if (pkg.clawflow || (pkg.manifest && pkg.manifest.clawflow)) {
      return true;
    }

    return false;
  }

  /**
   * ดึงข้อมูล package จาก npm registry
   */
  async getPackage(name, version = 'latest') {
    const cacheKey = `${name}@${version}`;

    // ตรวจสอบ cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const encodedName = this.encodePackageName(name);
      const url =
        version === 'latest'
          ? `${NPM_REGISTRY_URL}/${encodedName}/latest`
          : `${NPM_REGISTRY_URL}/${encodedName}/${version}`;

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          Accept: 'application/vnd.npm.install-v1+json',
        },
      });

      const pkg = this.normalizePackage(response.data);

      // ถ้าเป็น clawflow package ให้ดึง clawflow.json เพิ่ม
      if (this.isClawFlowPackage(response.data)) {
        const clawflowConfig = await this.fetchClawflowConfig(name, response.data.version);
        if (clawflowConfig) {
          Object.assign(pkg, clawflowConfig);
        }
      }

      // เก็บ cache
      this.cache.set(cacheKey, {
        data: pkg,
        timestamp: Date.now(),
      });

      return pkg;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch package ${name}: ${error.message}`);
    }
  }

  /**
   * ดึง clawflow.json จาก package
   */
  async fetchClawflowConfig(name, version) {
    try {
      // ดึงจาก unpkg หรือ jsDelivr
      const urls = [
        `https://unpkg.com/${name}@${version}/clawflow.json`,
        `https://cdn.jsdelivr.net/npm/${name}@${version}/clawflow.json`,
      ];

      for (const url of urls) {
        try {
          const response = await axios.get(url, { timeout: 5000 });
          return response.data;
        } catch (e) {
          continue;
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * ดึงข้อมูล package ทั้งหมด (รวมทุก versions)
   */
  async getPackageManifest(name) {
    const cacheKey = `manifest:${name}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const encodedName = this.encodePackageName(name);
      const response = await axios.get(`${NPM_REGISTRY_URL}/${encodedName}`, {
        timeout: 10000,
      });

      const data = response.data;

      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * ดึง latest version ของ package
   */
  async getLatestVersion(name) {
    const manifest = await this.getPackageManifest(name);
    if (!manifest) return null;

    return manifest['dist-tags']?.latest || null;
  }

  /**
   * ตรวจสอบว่า package มีอยู่จริงบน npm หรือไม่
   */
  async exists(name) {
    const pkg = await this.getLatestVersion(name);
    return pkg !== null;
  }

  /**
   * แปลงชื่อ package สำหรับ URL (handle scoped packages)
   */
  encodePackageName(name) {
    if (name.startsWith('@')) {
      return `@${encodeURIComponent(name.substring(1))}`;
    }
    return encodeURIComponent(name);
  }

  /**
   * Normalize package data จาก npm ให้เป็นรูปแบบ clawflow
   */
  normalizePackage(pkg) {
    const clawflowField = pkg.clawflow || {};

    return {
      name: pkg.name,
      version: pkg.version,
      description: pkg.description || '',
      author: this.normalizeAuthor(pkg.author),
      keywords: pkg.keywords || [],
      homepage: pkg.homepage || '',
      repository: pkg.repository?.url || pkg.repository || '',
      license: pkg.license || '',
      source: 'npm',

      // ClawFlow specific fields
      skills: clawflowField.skills || [],
      crons: clawflowField.crons || [],
      config: clawflowField.config || {},
      postInstall: clawflowField.postInstall || '',
      dependencies: pkg.dependencies || {},

      // Raw npm data
      _npm: {
        dist: pkg.dist,
        maintainers: pkg.maintainers,
        time: pkg.time,
      },
    };
  }

  /**
   * Normalize author field
   */
  normalizeAuthor(author) {
    if (!author) return 'Unknown';
    if (typeof author === 'string') return author;
    if (typeof author === 'object') {
      return author.name || 'Unknown';
    }
    return 'Unknown';
  }

  /**
   * ดึงรายการ popular clawflowhub packages
   */
  async getPopularPackages(limit = 20) {
    try {
      const response = await axios.get(`${NPM_SEARCH_URL}/search`, {
        params: {
          q: 'keywords:clawflowhub',
          sort: 'popularity',
          size: limit,
        },
        timeout: 10000,
      });

      const results = response.data.results || [];
      return results.map((item) => this.normalizePackage(item.package));
    } catch (error) {
      console.error('Error fetching popular packages:', error.message);
      return [];
    }
  }

  /**
   * ล้าง cache
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = NPMRegistry;
