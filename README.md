# 🦞 ClawFlow

**ClawFlow** is the ultimate skill + agent + cron installer for the OpenClaw/OpenKrab ecosystem.  
It provides a seamless developer experience to create, install, and automate AI skills in one unified flow.

<p align="center">
  <img src="/public/banner.png" alt="ClawFlow Banner" width="700">
</p>

## ✨ Features (v1.1.0+)

- **🆕 Dev-First Creation**: Generate skill and agent templates in seconds with `clawflow create`
- **🚀 One-Step Installation**: Install complex skill bundles from ClawHub or Git
- **🛠️ Local Development**: Link your local work instantly with `clawflow register` or `install --dev`
- **⏰ Smart Automation**: Advanced cron management with shorthand support (e.g., `5m`, `1h`, `2d`)
- **📦 Bundle Support**: Automatically detect and install multiple skills from a single repository
- **🩺 System Diagnostic**: Keep your environment healthy with `clawflow doctor`
- **🔍 Discovery**: Explore the ecosystem with `clawflow search` and `explore`

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- OpenClaw CLI installed
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

---

## 🛠️ Developer Workflow

### 1. Create a new Skill or Agent

Generate a production-ready template in TypeScript or Python:

```bash
clawflow create skill my-cool-skill
# or
clawflow create agent my-research-agent
```

### 2. Local Development & Registration

Link your local skill folder directly to OpenClaw (Symlink mode):

```bash
cd my-cool-skill
clawflow register .
```

*Changes you make in your local folder will reflect immediately in OpenClaw!*

### 3. Install with Dev Mode

Install a remote package but setup symlinks for development:

```bash
clawflow install https://github.com/user/repo --dev
```

---

## 💻 Core Commands

### Package & Developer Management

```bash
clawflow create [type] [name]           # Create skill/agent template
clawflow register [path]                # Register local skill via symlink
clawflow install <package>              # Install from registry or URL
  --dev                                 # Symlink mode for local development
  --bundle                              # Install all sub-skills in repo
clawflow list [--available] [--npm]     # List installed/available packages
clawflow search <query>                 # Search packages
clawflow explore                        # Discover featured skills
clawflow doctor                         # Check system health
```

### Cron Operations

```bash
clawflow cron-list                      # List all active cronjobs
clawflow cron-add <skill>               # Add new cronjob
  --schedule "*/5 * * * *"              # Standard cron
  --every 15m                           # Shorthand: 5m, 1h, 2d
  --dry-run                             # Preview before adding
clawflow cron-edit <id>                 # Modify existing job
clawflow cron-remove <id>               # Remove cronjob
```

---

## ⏰ Cron Input Formats

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
