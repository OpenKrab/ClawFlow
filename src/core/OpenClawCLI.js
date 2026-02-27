const path = require('path');
const fs = require('fs-extra');
const { promisify } = require('util');
const { execFile, spawn, spawnSync } = require('child_process');

const execFileAsync = promisify(execFile);

class OpenClawCLI {
  constructor(configManager) {
    this.configManager = configManager;
  }

  getOpenClawBin() {
    const config = this.configManager.getConfig();
    return config.openclaw?.cliBin || 'openclaw';
  }

  getClawhubBin() {
    const config = this.configManager.getConfig();
    return config.openclaw?.clawhubBin || 'clawhub';
  }

  hasOpenClaw() {
    return this.commandExists(this.getOpenClawBin(), ['--version']);
  }

  hasClawhub() {
    return this.commandExists(this.getClawhubBin(), ['--version']);
  }

  hasGit() {
    return this.commandExists('git', ['--version']);
  }

  commandExists(command, args = ['--help']) {
    try {
      const result = spawnSync(command, args, {
        encoding: 'utf8',
        stdio: 'pipe',
        windowsHide: true,
        shell: true,
      });

      return result.status === 0;
    } catch (e) {
      return false;
    }
  }

  async run(command, args, options = {}) {
    if (process.platform === 'win32') {
      return new Promise((resolve, reject) => {
        const comspec = process.env.ComSpec || 'cmd.exe';

        const child = spawn(comspec, ['/d', '/s', '/c', command, ...args], {
          cwd: options.cwd,
          env: process.env,
          windowsHide: true,
          shell: false,
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
          stdout += String(chunk);
        });

        child.stderr.on('data', (chunk) => {
          stderr += String(chunk);
        });

        child.on('error', (error) => {
          reject(new Error(`${command} ${args.join(' ')} ล้มเหลว: ${error.message}`));
        });

        child.on('close', (code) => {
          const out = stdout.trim();
          const err = stderr.trim();
          if (code === 0) {
            resolve({ stdout: out, stderr: err });
            return;
          }
          const detail = err || out || `exit code ${code}`;
          reject(new Error(`${command} ${args.join(' ')} ล้มเหลว: ${detail}`));
        });
      });
    }

    try {
      const { stdout, stderr } = await execFileAsync(command, args, {
        cwd: options.cwd,
        env: process.env,
        maxBuffer: 1024 * 1024 * 4,
        windowsHide: true,
        shell: true,
      });
      return {
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim(),
      };
    } catch (error) {
      const stderr = error.stderr ? String(error.stderr).trim() : '';
      const stdout = error.stdout ? String(error.stdout).trim() : '';
      const detail = stderr || stdout || error.message;
      throw new Error(`${command} ${args.join(' ')} failed: ${detail}`);
    }
  }

  parseJson(text) {
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch (_error) {
      return null;
    }
  }

  async installSkill(skillName, skillVersion, skillsPath) {
    if (!this.hasClawhub()) {
      throw new Error('CLI "clawhub" not found (required to install skills from registry)');
    }

    const workdir = path.dirname(skillsPath);
    const dir = path.basename(skillsPath);
    const args = ['install', skillName, '--workdir', workdir, '--dir', dir, '--force', '--no-input'];

    if (skillVersion && skillVersion !== 'latest') {
      args.push('--version', skillVersion);
    }

    await this.run(this.getClawhubBin(), args);
    return true;
  }

  resolveGitRepository(skill = {}) {
    const fromFields = [
      skill.git,
      skill.repo,
      skill.url,
      typeof skill.repository === 'string' ? skill.repository : skill.repository?.url,
    ].find((value) => typeof value === 'string' && value.trim());

    if (fromFields) {
      return fromFields.trim();
    }

    if (skill.source === 'github' && typeof skill.name === 'string' && skill.name.includes('/')) {
      return `https://github.com/${skill.name}.git`;
    }

    if (
      (skill.source === 'git' || skill.source === 'github') &&
      typeof skill.name === 'string' &&
      /^(https?:\/\/|git@|ssh:\/\/)/i.test(skill.name)
    ) {
      return skill.name;
    }

    return null;
  }

  resolveSkillDirName(skill = {}) {
    if (typeof skill.dir === 'string' && skill.dir.trim()) {
      return skill.dir.trim();
    }
    if (typeof skill.localName === 'string' && skill.localName.trim()) {
      return skill.localName.trim();
    }

    let name = (skill.name || '').trim();
    if (!name) {
      return null;
    }

    if (/^(https?:\/\/|git@|ssh:\/\/)/i.test(name)) {
      name = name.split('/').pop() || name;
      name = name.replace(/\.git$/i, '');
    } else if (name.includes('/')) {
      name = name.split('/').pop();
    }

    return name || null;
  }

  async installSkillFromGit(skill, skillsPath) {
    if (!this.hasGit()) {
      throw new Error('git command not found (required for fallback install)');
    }

    const repoUrl = this.resolveGitRepository(skill);
    if (!repoUrl) {
      throw new Error('No git repository information available for fallback install');
    }

    const skillDirName = this.resolveSkillDirName(skill);
    if (!skillDirName) {
      throw new Error('Unable to determine skill directory name from provided data');
    }

    const targetDir = path.join(skillsPath, skillDirName);
    fs.ensureDirSync(skillsPath);
    if (fs.existsSync(targetDir)) {
      fs.removeSync(targetDir);
    }

    const args = ['clone', '--depth', '1'];
    const gitRef = skill.gitRef || skill.ref || skill.branch || skill.tag;
    if (typeof gitRef === 'string' && gitRef.trim()) {
      args.push('--branch', gitRef.trim());
    }
    args.push(repoUrl, targetDir);

    await this.run('git', args);

    const skillFile = path.join(targetDir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
      throw new Error(`Repository "${repoUrl}" does not contain SKILL.md at the repository root`);
    }

    return {
      name: skill.name,
      dir: skillDirName,
      repository: repoUrl,
      path: targetDir,
    };
  }

  async verifySkill(skillName) {
    if (!this.hasOpenClaw()) {
      return null;
    }

    await this.run(this.getOpenClawBin(), ['skills', 'info', skillName, '--json']);
    return true;
  }

  async addCronJob({ name, description, schedule, message }) {
    if (!this.hasOpenClaw()) {
      throw new Error('openclaw CLI not found (required to create native cronjobs)');
    }

    const args = [
      'cron',
      'add',
      '--name',
      name,
      '--cron',
      schedule,
      '--session',
      'isolated',
      '--message',
      message,
      '--json',
    ];

    if (description) {
      args.push('--description', description);
    }

    const result = await this.run(this.getOpenClawBin(), args);
    const payload = this.parseJson(result.stdout);
    const jobId = payload?.job?.id || payload?.id || null;

    return { jobId, raw: payload };
  }

  async listCronJobs() {
    if (!this.hasOpenClaw()) {
      throw new Error('openclaw CLI not found (required to list cronjobs)');
    }

    const result = await this.run(this.getOpenClawBin(), ['cron', 'list', '--all', '--json']);
    const payload = this.parseJson(result.stdout);
    return payload?.jobs || [];
  }

  async removeCronJob(jobId) {
    if (!this.hasOpenClaw()) {
      throw new Error('openclaw CLI not found (required to remove cronjobs)');
    }

    await this.run(this.getOpenClawBin(), ['cron', 'rm', jobId, '--json']);
    return true;
  }

  async editCronJob(jobId, updates = {}) {
    if (!this.hasOpenClaw()) {
      throw new Error('openclaw CLI not found (required to edit cronjobs)');
    }

    const args = ['cron', 'edit', jobId];

    if (updates.schedule) {
      args.push('--cron', updates.schedule);
    }
    if (typeof updates.description === 'string') {
      args.push('--description', updates.description);
    }
    if (updates.message) {
      args.push('--message', updates.message);
    }

    args.push('--json');
    const result = await this.run(this.getOpenClawBin(), args);
    return this.parseJson(result.stdout);
  }
}

module.exports = OpenClawCLI;
