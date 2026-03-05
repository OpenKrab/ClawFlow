/**
 * Installer - Manage installation and uninstallation of packages
 */

const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const ora = require("ora");
const inquirer = require("inquirer");
const OpenClawCLI = require("./OpenClawCLI");

class Installer {
  constructor(configManager, registry) {
    this.configManager = configManager;
    this.registry = registry;
    this.cronManager = null; // set from outside
    this.openclawCLI = new OpenClawCLI(configManager);
  }

  setCronManager(cronManager) {
    this.cronManager = cronManager;
  }

  /**
   * Install package
   */
  async install(packageName, options = {}) {
    const {
      global = false,
      cron: withCron = true,
      dryRun = false,
      dev = false,
      bundle = false,
    } = options;

    // Check whether the package exists (supports built-in and npm)
    const pkg = await this.registry.getPackage(packageName);

    // Create package object if it's a URL or local path but not in registry
    let targetPkg = pkg;
    if (
      !targetPkg &&
      (packageName.includes("://") ||
        packageName.startsWith(".") ||
        packageName.startsWith("/"))
    ) {
      targetPkg = {
        name: path.basename(packageName).replace(/\.git$/, ""),
        version: "local",
        skills: [
          {
            name: path.basename(packageName),
            source: "git",
            repository: packageName,
          },
        ],
        config: {},
      };
    }

    if (!targetPkg) {
      throw new Error(
        `Package "${packageName}" not found in registry and is not a valid URL/Path`,
      );
    }

    // ตรวจสอบว่าติดตั้งแล้วหรือยัง
    const installed = this.configManager.getInstalledPackages();
    if (installed[targetPkg.name] && !dev) {
      console.log(
        chalk.yellow(`⚠️  Package "${targetPkg.name}" is already installed`),
      );
      const { reinstall } = await inquirer.prompt([
        {
          type: "confirm",
          name: "reinstall",
          message: "Do you want to reinstall?",
          default: false,
        },
      ]);
      if (!reinstall) {
        return { success: false, reason: "already_installed" };
      }
    }

    console.log(
      chalk.cyan(
        `📦 Installing ${chalk.bold(targetPkg.name)}${dev ? chalk.yellow(" [DEV MODE]") : ""}...\n`,
      ),
    );

    // Dry run - แสดงเฉพาะข้อมูล
    if (dryRun) {
      this.showDryRunInfo(targetPkg, withCron);
      return { success: true, dryRun: true };
    }

    const spinner = ora("Processing...").start();

    try {
      // 1. ติดตั้ง skills
      spinner.text = "Installing skills...";
      await this.installSkills(targetPkg.skills, { global, dev, bundle });

      // 2. ตั้งค่า config
      spinner.text = "Setting up configuration...";
      await this.setupConfig(targetPkg.name, targetPkg.config);

      // 3. ตั้ง cronjobs (ถ้าเปิดใช้งาน)
      let crons = [];
      if (withCron && targetPkg.crons && targetPkg.crons.length > 0) {
        spinner.text = "Setting up cronjobs...";
        crons = await this.setupCrons(targetPkg.crons);
      }

      // 4. บันทึกว่าติดตั้งแล้ว
      spinner.text = "Saving state...";
      this.configManager.addInstalledPackage(targetPkg.name, {
        version: targetPkg.version,
        skills: targetPkg.skills.map((s) => s.name),
        crons: crons.map((c) => c.id),
        configPath: this.getPackageConfigPath(targetPkg.name),
        dev: dev,
      });

      spinner.succeed(chalk.green(`Installed ${targetPkg.name} successfully!`));

      // แสดงข้อมูลสรุป
      this.showInstallSummary(targetPkg, crons);

      // แสดง post-install message
      if (targetPkg.postInstall) {
        console.log(chalk.yellow("\n📋 Next steps:"));
        console.log(chalk.gray(`   ${targetPkg.postInstall}`));
      }

      return {
        success: true,
        package: targetPkg.name,
        skills: targetPkg.skills.map((s) => s.name),
        crons: crons,
      };
    } catch (error) {
      spinner.fail(chalk.red(`Installation failed: ${error.message}`));
      throw error;
    }
  }

  /**
   * Install skills
   */
  async installSkills(skills, options = {}) {
    const { global = false, dev = false, bundle = false } = options;
    for (const skill of skills) {
      console.log(
        chalk.gray(
          `   → Installing skill: ${skill.name}${dev ? " (link)" : ""}`,
        ),
      );

      await this.installSkillToOpenClaw(skill, { global, dev, bundle });
    }
  }

  /**
   * ติดตั้ง skill ไปยัง OpenClaw
   */
  async installSkillToOpenClaw(skill, options = {}) {
    const { _global = false, dev = false, bundle = false } = options;

    const skillsPath = this.configManager.getSkillsPath();

    // Dev mode - Symlink
    if (
      dev &&
      (skill.repository?.startsWith(".") ||
        skill.repository?.startsWith("/") ||
        fs.existsSync(skill.name))
    ) {
      const sourcePath = path.resolve(
        process.cwd(),
        skill.repository || skill.name,
      );
      const targetPath = path.join(skillsPath, path.basename(sourcePath));

      console.log(chalk.gray(`   ↳ Symlinking: ${sourcePath} → ${targetPath}`));
      fs.ensureDirSync(path.dirname(targetPath));
      if (fs.existsSync(targetPath)) fs.removeSync(targetPath);
      fs.ensureSymlinkSync(sourcePath, targetPath, "junction");
      return;
    }

    try {
      await this.openclawCLI.installSkill(
        skill.name,
        skill.version,
        skillsPath,
      );
      await this.openclawCLI.verifySkill(skill.name).catch(() => null);
    } catch (error) {
      try {
        const cloned = await this.openclawCLI.installSkillFromGit(
          skill,
          skillsPath,
        );

        // Bundle detection
        if (bundle) {
          await this.detectAndInstallSubSkills(cloned.path, skillsPath);
        }

        console.log(
          chalk.yellow(`   ↳ git clone succeeded: ${cloned.repository}`),
        );
        return;
      } catch (gitError) {
        throw new Error(
          `Failed to install skill "${skill.name}" from both clawhub and git clone\n` +
            `clawhub: ${error.message}\n` +
            `git: ${gitError.message}`,
        );
      }
    }
  }

  /**
   * ตรวจสอบและลง Sub-skills (Bundle mode)
   */
  async detectAndInstallSubSkills(mainSkillPath, targetSkillsPath) {
    const items = fs.readdirSync(mainSkillPath);
    for (const item of items) {
      const subPath = path.join(mainSkillPath, item);
      if (fs.statSync(subPath).isDirectory()) {
        const isSkill =
          fs.existsSync(path.join(subPath, "skill.yaml")) ||
          fs.existsSync(path.join(subPath, "SKILL.md"));

        if (isSkill) {
          const targetPath = path.join(targetSkillsPath, item);
          if (!fs.existsSync(targetPath)) {
            console.log(
              chalk.gray(`   ↳ Bundle detected: linking sub-skill ${item}`),
            );
            fs.ensureSymlinkSync(subPath, targetPath, "junction");
          }
        }
      }
    }
  }

  /**
   * Setup config for package
   */
  async setupConfig(packageName, configSchema) {
    if (!configSchema) return;

    const configPath = this.getPackageConfigPath(packageName);
    const existingConfig = fs.existsSync(configPath)
      ? fs.readJsonSync(configPath)
      : {};

    const newConfig = {};

    for (const [skillName, schema] of Object.entries(configSchema)) {
      newConfig[skillName] = {};

      for (const [key, value] of Object.entries(schema)) {
        if (value.env) {
          // Pull value from environment variable
          const envValue = process.env[value.env];
          if (envValue) {
            newConfig[skillName][key] = envValue;
          } else if (value.required && !existingConfig[skillName]?.[key]) {
            // If not in env and required
            const answer = await inquirer.prompt([
              {
                type: "input",
                name: key,
                message: `Please enter ${key} for ${skillName} (or set ${value.env}):`,
                validate: (input) =>
                  input.length > 0 || "This field is required",
              },
            ]);
            newConfig[skillName][key] = answer[key];
          }
        } else if (value.default !== undefined) {
          newConfig[skillName][key] =
            existingConfig[skillName]?.[key] ?? value.default;
        } else if (value.required && !existingConfig[skillName]?.[key]) {
          const answer = await inquirer.prompt([
            {
              type: "input",
              name: key,
              message: `Please enter ${key} for ${skillName}:`,
              validate: (input) => input.length > 0 || "This field is required",
            },
          ]);
          newConfig[skillName][key] = answer[key];
        }
      }
    }

    // Merge with existing config
    const mergedConfig = { ...existingConfig, ...newConfig };
    fs.writeJsonSync(configPath, mergedConfig, { spaces: 2 });
  }

  /**
   * ตั้งค่า cronjobs
   */
  async setupCrons(cronsConfig) {
    const crons = [];

    for (const cronConfig of cronsConfig) {
      const cronInfo = await this.cronManager.add(
        cronConfig.skill,
        cronConfig.schedule,
        cronConfig.params,
        cronConfig.description,
      );
      crons.push(cronInfo);
    }

    return crons;
  }

  /**
   * ถอนการติดตั้ง package
   */
  async remove(packageName, options = {}) {
    const { keepConfig = false } = options;

    const installed = this.configManager.getInstalledPackages();
    if (!installed[packageName]) {
      console.log(
        chalk.yellow(`⚠️  Package "${packageName}" ไม่ได้ถูกติดตั้ง`),
      );
      return { success: false, reason: "not_installed" };
    }

    console.log(
      chalk.cyan(`🗑️  กำลังถอนการติดตั้ง ${chalk.bold(packageName)}...`),
    );

    const spinner = ora("กำลังดำเนินการ...").start();

    try {
      const pkgInfo = installed[packageName];

      // 1. ลบ cronjobs
      if (pkgInfo.crons && pkgInfo.crons.length > 0) {
        spinner.text = "กำลังลบ cronjobs...";
        for (const cronId of pkgInfo.crons) {
          await this.cronManager.remove(cronId);
        }
      }

      // 2. ลบ skills
      if (pkgInfo.skills && pkgInfo.skills.length > 0) {
        spinner.text = "กำลังลบ skills...";
        for (const skillName of pkgInfo.skills) {
          await this.removeSkillFromOpenClaw(skillName);
        }
      }

      // 3. ลบ config (ถ้าไม่ได้ระบุให้เก็บไว้)
      if (!keepConfig) {
        spinner.text = "กำลังลบ config...";
        const configPath = this.getPackageConfigPath(packageName);
        if (fs.existsSync(configPath)) {
          fs.removeSync(configPath);
        }
      }

      // 4. ลบจาก installed list
      this.configManager.removeInstalledPackage(packageName);

      spinner.succeed(
        chalk.green(`ถอนการติดตั้ง ${packageName} เสร็จสมบูรณ์!`),
      );

      return { success: true, package: packageName };
    } catch (error) {
      spinner.fail(chalk.red(`ถอนการติดตั้งไม่สำเร็จ: ${error.message}`));
      throw error;
    }
  }

  /**
   * ลบ skill จาก OpenClaw
   */
  async removeSkillFromOpenClaw(skillName) {
    const skillPath = path.join(this.configManager.getSkillsPath(), skillName);
    if (fs.existsSync(skillPath)) {
      fs.removeSync(skillPath);
    }
  }

  /**
   * แสดงข้อมูล dry run
   */
  showDryRunInfo(pkg, withCron) {
    console.log(chalk.cyan("\n📋 ข้อมูลการติดตั้ง (Dry Run):\n"));

    console.log(chalk.white("Package:"), chalk.bold(pkg.name));
    console.log(chalk.white("Version:"), pkg.version);
    console.log(chalk.white("Description:"), pkg.description);

    console.log(chalk.yellow("\n📦 Skills ที่จะติดตั้ง:"));
    pkg.skills.forEach((skill) => {
      console.log(`  • ${skill.name}@${skill.version}`);
    });

    if (withCron && pkg.crons && pkg.crons.length > 0) {
      console.log(chalk.yellow("\n⏰ Cronjobs ที่จะตั้ง:"));
      pkg.crons.forEach((cron) => {
        console.log(`  • ${cron.skill}`);
        console.log(`    Schedule: ${cron.schedule}`);
        console.log(`    Description: ${cron.description}`);
      });
    }

    console.log(chalk.yellow("\n⚙️  Config ที่จะตั้ง:"));
    if (pkg.config) {
      console.log(JSON.stringify(pkg.config, null, 2));
    } else {
      console.log("  (ไม่มี config พิเศษ)");
    }

    console.log(chalk.gray("\n(ไม่ได้ทำการติดตั้งจริง - dry run mode)"));
  }

  /**
   * แสดงสรุปการติดตั้ง
   */
  showInstallSummary(pkg, crons) {
    console.log(chalk.green("\n✅ สรุปการติดตั้ง:\n"));

    console.log(chalk.white("📦 Package:"), pkg.name);
    console.log(chalk.white("🛠️  Skills ที่ติดตั้ง:"));
    pkg.skills.forEach((skill) => {
      console.log(`   ✓ ${skill.name}`);
    });

    if (crons.length > 0) {
      console.log(chalk.white("\n⏰ Cronjobs ที่ตั้ง:"));
      crons.forEach((cron) => {
        console.log(`   ✓ ${cron.skill} (${cron.schedule})`);
      });
    }

    console.log(
      chalk.white("\n📁 Config path:"),
      this.getPackageConfigPath(pkg.name),
    );
  }

  /**
   * ดึง path ของ config สำหรับ package
   */
  getPackageConfigPath(packageName) {
    return path.join(
      this.configManager.getSkillsPath(),
      `${packageName}.config.json`,
    );
  }
}

module.exports = Installer;
