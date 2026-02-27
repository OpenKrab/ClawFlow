# Contributing to ClawFlow

Thanks for contributing.

## Development Setup

```bash
git clone https://github.com/<your-org-or-user>/ClawFlowHub.git
cd ClawFlowHub
npm install
```

## Run Checks

```bash
npm run lint
npm test -- --runInBand
```

## Local CLI Run

```bash
node bin/clawflowhub.js --help
```

## Contribution Rules

- Keep changes focused and small.
- Add or update tests for behavior changes.
- Do not commit secrets or local machine paths.
- Update `README.md` when user-facing CLI behavior changes.

## Pull Request Checklist

- [ ] Lint passes
- [ ] Tests pass
- [ ] New behavior is covered by tests
- [ ] README updated (if needed)
- [ ] Changelog entry added (if needed)

## Commit Message Guideline

Use clear, direct messages, for example:

- `feat: add git fallback for skill install`
- `fix: normalize cron shorthand in cron-edit`
- `docs: update README quick start`
