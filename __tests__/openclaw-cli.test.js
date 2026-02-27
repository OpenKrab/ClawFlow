const OpenClawCLI = require('../src/core/OpenClawCLI');

function createCli() {
  return new OpenClawCLI({
    getConfig() {
      return {
        openclaw: {
          cliBin: 'openclaw',
          clawhubBin: 'clawhub',
        },
      };
    },
  });
}

describe('OpenClawCLI git fallback helpers', () => {
  test('resolveGitRepository from explicit fields', () => {
    const cli = createCli();
    expect(
      cli.resolveGitRepository({
        name: 'crypto-price',
        repository: 'https://github.com/acme/crypto-price.git',
      }),
    ).toBe('https://github.com/acme/crypto-price.git');
  });

  test('resolveGitRepository from github source + owner/repo name', () => {
    const cli = createCli();
    expect(
      cli.resolveGitRepository({
        source: 'github',
        name: 'acme/my-skill',
      }),
    ).toBe('https://github.com/acme/my-skill.git');
  });

  test('resolveSkillDirName from url and scoped names', () => {
    const cli = createCli();
    expect(
      cli.resolveSkillDirName({
        name: 'https://github.com/acme/skill-x.git',
      }),
    ).toBe('skill-x');

    expect(
      cli.resolveSkillDirName({
        name: 'acme/skill-y',
      }),
    ).toBe('skill-y');
  });
});
