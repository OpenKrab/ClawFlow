# ClawFlow

`ClawFlow` is a CLI wrapper for OpenClaw that installs skill bundles and wires cron jobs in one flow.

Published package: `clawflowbang`  
Primary command: `clawflow` (alias: `cfh`)

## What It Does

- Install package presets (skills + cron jobs) with one command.
- Install skills from ClawHub first, then fallback to Git clone if not found.
- Manage cron jobs through `openclaw cron` (add/edit/remove/list).
- Validate and normalize cron expressions before save.

## Requirements

- Node.js `>=16`
- OpenClaw CLI (`openclaw`)
- ClawHub CLI (`clawhub`) for registry skill install
- Git (used for fallback clone)

## Install

```bash
npm i -g clawflowbang
```

Check:

```bash
clawflow --version
```

## Quick Start

Initialize local config:

```bash
clawflow init
```

Install a package preset:

```bash
clawflow install trading-kit
```

Check status:

```bash
clawflow status
```

## Main Commands

```bash
clawflow install <package>
clawflow list [--available] [--npm]
clawflow search <query> [--no-npm]
clawflow remove <package>

clawflow cron-list
clawflow cron-add <skill> --schedule "*/5 * * * *"
clawflow cron-edit <id> --every 15m --description "updated job"
clawflow cron-remove <id>
```

## Cron Input Formats

Supported formats:

- Raw cron: `*/5 * * * *`
- Preset: `@hourly`, `@daily`, `@weekly`, `@monthly`
- Shorthand: `5m`, `every 15m`, `1h`, `2d`

Examples:

```bash
clawflow cron-add crypto-price --every 15m
clawflow cron-edit <job-id> --schedule "@daily"
clawflow cron-edit <job-id> --params '{"symbols":["BTC","ETH"]}'
clawflow cron-remove <job-id>
```

## Skill Install Fallback (ClawHub -> Git)

When installing package skills:

1. Try `clawhub install`
2. If failed, try `git clone` when skill metadata provides repository info
3. Validate cloned skill by checking `SKILL.md`

Skill metadata fields for git fallback:

- `repository` or `repo` or `git`
- optional `branch` / `tag` / `ref`

## Paths Used by Default

- Skills path: `~/.openclaw/workspace/skills`
- Cron jobs file: `~/.openclaw/cron/jobs.json`

Override during install:

```bash
clawflow install <package> \
  --skills-path "<path-to-skills>" \
  --cron-jobs "<path-to-jobs.json>"
```

## NPM Package Preset Format

`clawflow` can read package metadata from npm packages.  
Use `clawflow` field in package.json:

```json
{
  "name": "my-kit",
  "version": "1.0.0",
  "keywords": ["clawflow"],
  "clawflow": {
    "skills": [
      {
        "name": "crypto-price",
        "version": "^1.0.0",
        "source": "openclaw",
        "repository": "https://github.com/owner/crypto-price-skill.git"
      }
    ],
    "crons": [
      {
        "skill": "crypto-price",
        "schedule": "*/5 * * * *",
        "params": { "symbols": ["BTC", "ETH"] }
      }
    ]
  }
}
```

## Development

```bash
npm install
npm run lint
npm test -- --runInBand
```

## License

MIT
