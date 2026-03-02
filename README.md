# 🦞 ClawFlow

**ClawFlow** is a skill + cron installer for OpenClaw/OpenKrab ecosystem.  
It installs skill bundles and wires cron jobs in one flow, providing both CLI automation and package management.

<p align="center">
  <img src="/public/banner.png" alt="ClawFlow Banner" width="700">
</p>

## Features

- **Package Management**: Install skill bundles with one command from ClawHub or Git
- **Cron Automation**: Schedule and manage automated skill execution
- **Fallback Installation**: ClawHub registry first, Git clone fallback
- **Cron Validation**: Normalize and validate cron expressions
- **CLI Interface**: Fast command-line tool (`clawflow` / `cfh`)
- **NPM Integration**: Published as `clawflowbang` package
- **Cross Platform**: Node.js based with Windows/Linux/macOS support

---

## Quick Start

### Prerequisites

- Node.js 16+
- OpenClaw CLI (`openclaw`)
- ClawHub CLI (`clawhub`) for registry access
- Git (for fallback installation)

### Installation

```bash
npm i -g clawflowbang
```

Verify installation:

```bash
clawflow --version
```

### Initial Setup

```bash
clawflow init
```

### Install Your First Package

```bash
clawflow install trading-kit
```

Check status:

```bash
clawflow status
```

---

## Core Commands

### Package Management

```bash
clawflow install <package>              # Install skill bundle
clawflow list [--available] [--npm]     # List installed/available packages
clawflow search <query> [--no-npm]     # Search packages
clawflow remove <package>               # Remove installed package
```

### Cron Operations

```bash
clawflow cron-list                      # List all cron jobs
clawflow cron-add <skill> --schedule "*/5 * * * *"  # Add new cron job
clawflow cron-edit <id> --every 15m --description "updated job"  # Modify existing
clawflow cron-remove <id>               # Remove cron job
```

---

## Cron Input Formats

Supported formats:

- **Raw cron**: `*/5 * * * *`
- **Preset**: `@hourly`, `@daily`, `@weekly`, `@monthly`
- **Shorthand**: `5m`, `every 15m`, `1h`, `2d`

### Examples

```bash
clawflow cron-add crypto-price --every 15m
clawflow cron-edit <job-id> --schedule "@daily"
clawflow cron-edit <job-id> --params '{"symbols":["BTC","ETH"]}'
clawflow cron-remove <job-id>
```

---

## Installation Flow

### Skill Installation Strategy

1. **Primary**: Try `clawhub install` from registry
2. **Fallback**: Use `git clone` when registry fails
3. **Validation**: Check `SKILL.md` exists and is valid

### Git Fallback Metadata

Required fields in package metadata:

- `repository` or `repo` or `git` - Git repository URL
- Optional: `branch` / `tag` / `ref` - Specific version

---

## Configuration

### Default Paths

- Skills directory: `~/.openclaw/workspace/skills`
- Cron jobs file: `~/.openclaw/cron/jobs.json`

### Custom Paths

Override defaults during installation:

```bash
clawflow install <package> \
  --skills-path "<path-to-skills>" \
  --cron-jobs "<path-to-jobs.json>"
```

---

## NPM Package Format

`clawflow` reads package metadata from npm packages using the `clawflow` field:

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

---

## Tech Stack

- **Node.js 16+** - Core runtime
- **Commander.js** - CLI framework
- **Node-cron** - Cron job management
- **Axios** - HTTP requests for registry
- **Chalk + Gradient-string** - Terminal styling
- **Inquirer.js** - Interactive prompts
- **YAML** - Configuration parsing
- **Boxen** - Beautiful terminal boxes

---

## Project Structure

```
ClawFlowHub/
├── bin/
│   └── clawflowhub.js          # CLI entry point
├── src/
│   ├── index.js                # Main module
│   ├── commands/               # Command implementations
│   ├── utils/                 # Utility functions
│   └── config/                # Configuration management
├── skills/                    # Example skills
├── examples/                  # Usage examples
├── docs/                      # Documentation
├── tests/                     # Test suite
├── package.json               # NPM package config
├── image.png                 # Project banner
└── README.md                 # This file
```

---

## Development

### Setup

```bash
git clone https://github.com/OpenKrab/ClawFlowHub.git
cd ClawFlowHub
npm install
```

### Development Commands

```bash
npm run lint                   # Lint code
npm test                      # Run test suite
npm start                     # Run CLI locally
```

### Testing

```bash
# Test basic functionality
clawflow --help
clawflow list --available
clawflow search crypto
```

---

## OpenClaw Integration

ClawFlow integrates with OpenClaw ecosystem through:

- **Skill Installation**: Direct integration with OpenClaw skill system
- **Cron Management**: Uses OpenClaw's cron job infrastructure
- **Registry Access**: Leverages ClawHub for skill discovery
- **Configuration**: Respects OpenClaw's configuration patterns

---

## Contributing

PRs are welcome! Please ensure:

1. Code follows existing ESLint patterns
2. Add tests for new functionality
3. Update documentation as needed
4. Test cross-platform compatibility
5. Follow semantic versioning

---

## License

MIT

---

*Built for the Lobster Way 🦞*
