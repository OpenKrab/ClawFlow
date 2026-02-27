# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-02-27

### Added
- Initial public release as `clawflowbang` on npm.
- CLI command `clawflow` with aliases `clawflowhub` and `cfh`.
- Package install flow for skill bundle + cron setup.
- Cron management commands: `cron-add`, `cron-edit`, `cron-list`, `cron-remove`.
- Cron expression normalization (`@daily`, `every 15m`, etc.).
- Fallback install strategy: ClawHub first, then Git clone when metadata provides repository.
- Status command integration with OpenClaw/ClawHub availability checks.

### Changed
- Project branding updated to `ClawFlow`.
- CLI defaults aligned to OpenClaw paths:
  - `~/.openclaw/workspace/skills`
  - `~/.openclaw/cron/jobs.json`
