---
name: clawflow-openclaw-installer
description: Use this skill when users want to install OpenClaw skills, configure cron jobs, validate cron format, or troubleshoot ClawFlow CLI commands such as install, cron-add, cron-edit, cron-list, and cron-remove.
---

# ClawFlow OpenClaw Installer

Use this skill for ClawFlow workflows that combine skill installation and cron management.

## Trigger Conditions

Use this skill when user asks to:
- install a skill/package for OpenClaw
- add/edit/remove/list cron jobs via ClawFlow
- validate cron format (`*/5 * * * *`, `@daily`, `every 15m`, `5m`)
- troubleshoot `openclaw` / `clawhub` / `clawflow` command failures

## Required Checks

Before changing anything:
1. Confirm CLI availability: `openclaw --version`, `clawhub --version`, `node ./bin/clawflowhub.js --version`
2. Confirm OpenClaw cron status: `openclaw cron status --json`
3. Confirm current jobs: `openclaw cron list --all --json`

## Core Workflows

### 1) Install Package + Skills

1. Run `clawflow install <package>`
2. If registry install fails, use git fallback when repository metadata exists.
3. Validate result by checking skill path and running `clawflow status`.

### 2) Add Cron Job

1. Normalize schedule from `--every` or `--schedule` to standard cron.
2. Validate schedule before apply.
3. Add job:
   - `clawflow cron-add <skill> --every 5m --description "..." [--params '{"key":"value"}']`
4. Verify with:
   - `openclaw cron list --all --json`
   - `clawflow cron-list`

### 3) Edit Cron Job

1. Confirm target id exists from `clawflow cron-list`.
2. Edit one or more fields:
   - `clawflow cron-edit <id> --every 15m`
   - `clawflow cron-edit <id> --description "updated"`
   - `clawflow cron-edit <id> --params '{"k":"v"}'`
3. Re-check with `openclaw cron list --all --json`.

### 4) Remove Cron Job

1. Confirm target id.
2. Remove: `clawflow cron-remove <id>`
3. Verify no remaining job mismatch between OpenClaw and ClawFlow list.

## Cron Format Rules

Accepted inputs:
- Raw cron: `*/5 * * * *`
- Presets: `@hourly`, `@daily`, `@weekly`, `@monthly`
- Duration shorthand: `5m`, `1h`, `2d`, `every 15m`

Reject if:
- invalid token count
- out-of-range values
- ambiguous text that cannot be normalized

## Troubleshooting

- `too many arguments for 'add'`:
  - check Windows argument quoting and pass params as valid JSON string
- `command not found`:
  - run through `node ./bin/clawflowhub.js ...` or ensure global npm bin in PATH
- OpenClaw gateway unavailable:
  - verify OpenClaw service is running and `OPENCLAW_URL` points correctly

## Completion Checklist

- command executed successfully
- user sees expected job in `openclaw cron list --all --json`
- `clawflow cron-list` output matches OpenClaw state
- no config parse errors
