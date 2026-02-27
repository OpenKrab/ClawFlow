/**
 * PackageResolver - จัดการ dependency resolution
 */

class PackageResolver {
  constructor(registry) {
    this.registry = registry;
  }

  /**
   * แก้ไข dependencies ของ package
   */
  resolveDependencies(packageName, resolved = new Set(), unresolved = new Set()) {
    // เพิ่มเข้า unresolved
    unresolved.add(packageName);

    const pkg = this.registry.getPackage(packageName);
    if (!pkg) {
      throw new Error(`Package "${packageName}" ไม่พบใน registry`);
    }

    // ดึง dependencies
    const dependencies = this.registry.getDependencies(packageName);

    for (const dep of dependencies) {
      if (resolved.has(dep)) {
        continue;
      }

      if (unresolved.has(dep)) {
        throw new Error(`พบ circular dependency: ${packageName} -> ${dep}`);
      }

      this.resolveDependencies(dep, resolved, unresolved);
    }

    // ย้ายจาก unresolved ไป resolved
    unresolved.delete(packageName);
    resolved.add(packageName);

    return Array.from(resolved);
  }

  /**
   * ได้รับลำดับการติดตั้งที่ถูกต้อง
   */
  getInstallOrder(packageNames) {
    const resolved = new Set();
    const unresolved = new Set();

    for (const name of packageNames) {
      if (!resolved.has(name)) {
        this.resolveDependencies(name, resolved, unresolved);
      }
    }

    return Array.from(resolved);
  }

  /**
   * ตรวจสอบ conflicts
   */
  checkConflicts(packages) {
    const conflicts = [];
    const skillVersions = new Map();

    for (const pkgName of packages) {
      const pkg = this.registry.getPackage(pkgName);
      if (!pkg) continue;

      for (const skill of pkg.skills) {
        if (skillVersions.has(skill.name)) {
          const existing = skillVersions.get(skill.name);
          if (existing.version !== skill.version) {
            conflicts.push({
              skill: skill.name,
              packages: [existing.package, pkgName],
              versions: [existing.version, skill.version],
            });
          }
        } else {
          skillVersions.set(skill.name, {
            package: pkgName,
            version: skill.version,
          });
        }
      }
    }

    return conflicts;
  }
}

module.exports = PackageResolver;
