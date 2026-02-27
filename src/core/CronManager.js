/**
 * CronManager - จัดการ cronjobs
 */

const fs = require('fs-extra');
const path = require('path');
const cron = require('node-cron');
const chalk = require('chalk');
const OpenClawCLI = require('./OpenClawCLI');
const { normalizeCronExpression } = require('./CronFormat');

class CronManager {
  constructor(configManager) {
    this.configManager = configManager;
    this.tasks = new Map();
    this.jobsFile = configManager.getCronJobsFilePath();
    this.openclawCLI = new OpenClawCLI(configManager);
    this.useOpenClawCron = this.openclawCLI.hasOpenClaw();

    if (!this.useOpenClawCron) {
      this.ensureJobsFile();
    }
  }

  /**
   * สร้างไฟล์ jobs ถ้ายังไม่มี
   */
  ensureJobsFile() {
    fs.ensureDirSync(path.dirname(this.jobsFile));
    if (!fs.existsSync(this.jobsFile)) {
      fs.writeJsonSync(this.jobsFile, { jobs: [] }, { spaces: 2 });
    }
  }

  /**
   * อ่านรายการ jobs
   */
  getJobs() {
    if (!fs.existsSync(this.jobsFile)) {
      return [];
    }

    const data = fs.readJsonSync(this.jobsFile);
    return data.jobs || [];
  }

  /**
   * บันทึกรายการ jobs
   */
  saveJobs(jobs) {
    fs.writeJsonSync(this.jobsFile, { jobs }, { spaces: 2 });
  }

  /**
   * เพิ่ม cronjob
   */
  async add(skillName, schedule, params = {}, description = '') {
    const normalizedSchedule = normalizeCronExpression(schedule);

    if (this.useOpenClawCron) {
      const uniqueName = `cfh:${skillName}:${Date.now()}`;
      const message = `Run skill "${skillName}" with params: ${JSON.stringify(params)}`;
      const created = await this.openclawCLI.addCronJob({
        name: uniqueName,
        description: description || `Run ${skillName}`,
        schedule: normalizedSchedule,
        message,
      });

      let jobId = created.jobId;
      if (!jobId) {
        const jobs = await this.openclawCLI.listCronJobs();
        const matched = jobs.find((job) => job.name === uniqueName);
        jobId = matched?.id || null;
      }

      if (!jobId) {
        throw new Error('สร้าง cronjob ผ่าน openclaw สำเร็จ แต่ไม่สามารถระบุ job id ได้');
      }

      this.configManager.addCron({
        id: jobId,
        skill: skillName,
        schedule: normalizedSchedule,
        description: description || `Run ${skillName}`,
      });

      console.log(chalk.green(`✓ เพิ่ม cronjob (openclaw): ${skillName} (${normalizedSchedule})`));

      return {
        id: jobId,
        skill: skillName,
        schedule: normalizedSchedule,
        params,
        description: description || `Run ${skillName}`,
        enabled: true,
      };
    }

    const jobs = this.getJobs();
    const jobId = `cron_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

    const job = {
      id: jobId,
      skill: skillName,
      schedule: normalizedSchedule,
      params,
      description: description || `Run ${skillName}`,
      enabled: true,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: this.getNextRun(normalizedSchedule),
      runCount: 0,
      errorCount: 0,
    };

    jobs.push(job);
    this.saveJobs(jobs);

    // บันทึกลง config ด้วย
    this.configManager.addCron({
      id: jobId,
      skill: skillName,
      schedule: normalizedSchedule,
      description,
    });

    // สร้าง cron script
    this.createCronScript(job);

    // เริ่มต้น task (ถ้าเปิดใช้งาน)
    if (job.enabled) {
      this.startJob(job);
    }

    console.log(chalk.green(`✓ เพิ่ม cronjob: ${skillName} (${normalizedSchedule})`));

    return job;
  }

  /**
   * แก้ไข cronjob
   */
  async edit(jobId, updates = {}) {
    const normalized = { ...updates };

    if (updates.schedule) {
      normalized.schedule = normalizeCronExpression(updates.schedule);
    }

    if (this.useOpenClawCron) {
      const tracked = this.configManager.getCrons().find((c) => c.id === jobId);
      const message =
        Object.prototype.hasOwnProperty.call(updates, 'params') && tracked?.skill
          ? `Run skill "${tracked.skill}" with params: ${JSON.stringify(updates.params || {})}`
          : undefined;

      if (Object.prototype.hasOwnProperty.call(updates, 'params') && !tracked?.skill) {
        throw new Error('แก้ไข params ไม่ได้ เพราะไม่พบ mapping skill ของ cron นี้ใน config');
      }

      await this.openclawCLI.editCronJob(jobId, {
        schedule: normalized.schedule,
        description: normalized.description,
        message,
      });

      this.configManager.updateCron(jobId, {
        ...(normalized.schedule ? { schedule: normalized.schedule } : {}),
        ...(typeof normalized.description === 'string' ? { description: normalized.description } : {}),
        ...(Object.prototype.hasOwnProperty.call(updates, 'params') ? { params: updates.params } : {}),
      });

      return { id: jobId, ...normalized };
    }

    const jobs = this.getJobs();
    const job = jobs.find((j) => j.id === jobId);

    if (!job) {
      throw new Error(`ไม่พบ cronjob ID: ${jobId}`);
    }

    if (normalized.schedule) {
      job.schedule = normalized.schedule;
      job.nextRun = this.getNextRun(normalized.schedule);
    }

    if (typeof normalized.description === 'string') {
      job.description = normalized.description;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'params')) {
      job.params = updates.params || {};
    }

    this.saveJobs(jobs);
    this.configManager.updateCron(jobId, {
      ...(normalized.schedule ? { schedule: normalized.schedule } : {}),
      ...(typeof normalized.description === 'string' ? { description: normalized.description } : {}),
      ...(Object.prototype.hasOwnProperty.call(updates, 'params') ? { params: updates.params } : {}),
    });

    return job;
  }

  /**
   * ลบ cronjob
   */
  async remove(jobId) {
    if (this.useOpenClawCron) {
      await this.openclawCLI.removeCronJob(jobId);
      this.configManager.removeCron(jobId);
      console.log(chalk.green(`✓ ลบ cronjob (openclaw): ${jobId}`));
      return { success: true, removed: { id: jobId } };
    }

    let jobs = this.getJobs();
    const job = jobs.find(j => j.id === jobId);

    if (!job) {
      throw new Error(`ไม่พบ cronjob ID: ${jobId}`);
    }

    // หยุด task
    this.stopJob(jobId);

    // ลบไฟล์ script
    this.removeCronScript(jobId);

    // ลบจากรายการ
    jobs = jobs.filter(j => j.id !== jobId);
    this.saveJobs(jobs);

    // ลบจาก config
    this.configManager.removeCron(jobId);

    console.log(chalk.green(`✓ ลบ cronjob: ${job.skill}`));

    return { success: true, removed: job };
  }

  /**
   * แสดงรายการ cronjobs
   */
  list() {
    if (this.useOpenClawCron) {
      return this.listViaOpenClaw();
    }

    const jobs = this.getJobs();

    if (jobs.length === 0) {
      console.log(chalk.gray('ไม่มี cronjob ที่ตั้งไว้'));
      return [];
    }

    return jobs.map(job => ({
      id: job.id,
      skill: job.skill,
      schedule: job.schedule,
      description: job.description,
      enabled: job.enabled,
      lastRun: job.lastRun,
      nextRun: job.nextRun,
      runCount: job.runCount,
    }));
  }

  /**
   * แสดงรายการ cronjobs ผ่าน OpenClaw CLI
   */
  async listViaOpenClaw() {
    const jobs = await this.openclawCLI.listCronJobs();

    if (!jobs || jobs.length === 0) {
      console.log(chalk.gray('ไม่มี cronjob ที่ตั้งไว้'));
      return [];
    }

    return jobs.map((job) => ({
      id: job.id,
      skill: job.name || 'unknown',
      schedule: job.schedule?.expr || job.schedule?.kind || '-',
      description: job.description || '',
      enabled: job.enabled !== false,
      lastRun: job.lastRunAt || null,
      nextRun: job.nextRunAt || null,
      runCount: job.runCount || 0,
    }));
  }

  /**
   * เริ่มต้น job
   */
  startJob(job) {
    if (this.tasks.has(job.id)) {
      this.stopJob(job.id);
    }

    const task = cron.schedule(job.schedule, async () => {
      await this.executeJob(job.id);
    }, {
      scheduled: true,
      timezone: process.env.TZ || 'Asia/Bangkok',
    });

    this.tasks.set(job.id, task);
  }

  /**
   * หยุด job
   */
  stopJob(jobId) {
    const task = this.tasks.get(jobId);
    if (task) {
      task.stop();
      if (typeof task.destroy === 'function') {
        task.destroy();
      }
      this.tasks.delete(jobId);
    }
  }

  /**
   * รัน job
   */
  async executeJob(jobId) {
    const jobs = this.getJobs();
    const job = jobs.find(j => j.id === jobId);

    if (!job || !job.enabled) {
      return;
    }

    const startTime = Date.now();
    
    try {
      // บันทึก log
      this.logJobExecution(job, 'start');

      // เรียกใช้ skill
      await this.runSkill(job.skill, job.params);

      // อัปเดตสถานะ
      job.lastRun = new Date().toISOString();
      job.nextRun = this.getNextRun(job.schedule);
      job.runCount++;
      job.lastDuration = Date.now() - startTime;

      this.logJobExecution(job, 'success');

    } catch (error) {
      job.errorCount++;
      job.lastError = error.message;
      this.logJobExecution(job, 'error', error.message);
    }

    this.saveJobs(jobs);
  }

  /**
   * รัน skill
   */
  async runSkill(skillName, params) {
    // ในโลกจริงจะเรียก OpenClaw API
    // const response = await axios.post(`${baseUrl}/api/skills/execute`, {
    //   name: skillName,
    //   params,
    // });

    // สำหรับตอนนี้จำลองการทำงาน
    console.log(chalk.gray(`[CRON] Running ${skillName} with params:`, JSON.stringify(params)));
  }

  /**
   * สร้าง cron script file
   */
  createCronScript(job) {
    const scriptContent = `#!/usr/bin/env node
// Auto-generated cron script for ${job.skill}
// Generated at: ${new Date().toISOString()}

const axios = require('axios');

const skill = '${job.skill}';
const params = ${JSON.stringify(job.params, null, 2)};
const config = require('${this.configManager.getSkillsPath()}/${job.skill}.config.json');

async function run() {
  try {
    console.log(\`[\${new Date().toISOString()}] Running \${skill}...\`);
    
    // Call OpenClaw API
    const baseUrl = process.env.OPENCLAW_URL || 'http://localhost:3000';
    const response = await axios.post(\`\${baseUrl}/api/skills/execute\`, {
      name: skill,
      params: { ...config, ...params },
    });
    
    console.log(\`[\${new Date().toISOString()}] Success:\`, response.data);
  } catch (error) {
    console.error(\`[\${new Date().toISOString()}] Error:\`, error.message);
    process.exit(1);
  }
}

run();
`;

    const scriptPath = path.join(this.configManager.getCronsPath(), `${job.id}.js`);
    fs.writeFileSync(scriptPath, scriptContent, { mode: 0o755 });
  }

  /**
   * ลบ cron script file
   */
  removeCronScript(jobId) {
    const scriptPath = path.join(this.configManager.getCronsPath(), `${jobId}.js`);
    if (fs.existsSync(scriptPath)) {
      fs.removeSync(scriptPath);
    }
  }

  /**
   * บันทึก log การทำงาน
   */
  logJobExecution(job, status, message = '') {
    const logPath = path.join(this.configManager.getLogsPath(), `cron-${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `[${new Date().toISOString()}] ${status.toUpperCase()} - ${job.skill} (${job.id}): ${message}\n`;
    
    fs.appendFileSync(logPath, logEntry);
  }

  /**
   * คำนวณเวลารันครั้งถัดไป
   */
  getNextRun(_schedule) {
    // ง่ายๆ แค่ return null ตอนนี้
    // ในอนาคตอาจใช้ library คำนวณจริง
    return null;
  }

  /**
   * เปิด/ปิด job
   */
  toggleJob(jobId, enabled) {
    if (this.useOpenClawCron) {
      throw new Error('โหมด openclaw cron: ให้ใช้คำสั่ง "openclaw cron enable|disable <id>"');
    }

    const jobs = this.getJobs();
    const job = jobs.find(j => j.id === jobId);

    if (!job) {
      throw new Error(`ไม่พบ cronjob ID: ${jobId}`);
    }

    job.enabled = enabled;
    this.saveJobs(jobs);

    if (enabled) {
      this.startJob(job);
      console.log(chalk.green(`✓ เปิดใช้งาน cronjob: ${job.skill}`));
    } else {
      this.stopJob(jobId);
      console.log(chalk.yellow(`⏸️  ปิดใช้งาน cronjob: ${job.skill}`));
    }

    return job;
  }

  /**
   * เริ่มต้นระบบ cron (เรียกตอน start)
   */
  startAll() {
    if (this.useOpenClawCron) {
      console.log(chalk.green('✓ ใช้ openclaw cron scheduler (ไม่ต้อง start local tasks)'));
      return;
    }

    const jobs = this.getJobs().filter(j => j.enabled);
    
    for (const job of jobs) {
      this.startJob(job);
    }

    console.log(chalk.green(`✓ เริ่มต้นระบบ cron (${jobs.length} jobs)`));
  }

  /**
   * หยุดระบบ cron ทั้งหมด
   */
  stopAll() {
    if (this.useOpenClawCron) {
      console.log(chalk.yellow('⏹️  openclaw cron scheduler ยังทำงานภายนอก process นี้'));
      return;
    }

    for (const [, task] of this.tasks) {
      task.stop();
      if (typeof task.destroy === 'function') {
        task.destroy();
      }
    }
    this.tasks.clear();

    console.log(chalk.yellow('⏹️  หยุดระบบ cron'));
  }
}

module.exports = CronManager;
