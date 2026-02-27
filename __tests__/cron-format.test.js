const { normalizeCronExpression } = require('../src/core/CronFormat');

describe('CronFormat.normalizeCronExpression', () => {
  test('accepts valid cron expressions as-is', () => {
    expect(normalizeCronExpression('*/5 * * * *')).toBe('*/5 * * * *');
  });

  test('normalizes preset aliases', () => {
    expect(normalizeCronExpression('@daily')).toBe('0 0 * * *');
    expect(normalizeCronExpression('@hourly')).toBe('0 * * * *');
  });

  test('normalizes shorthand durations', () => {
    expect(normalizeCronExpression('15m')).toBe('*/15 * * * *');
    expect(normalizeCronExpression('every 2h')).toBe('0 */2 * * *');
    expect(normalizeCronExpression('1d')).toBe('0 0 */1 * *');
  });

  test('throws on invalid cron expressions', () => {
    expect(() => normalizeCronExpression('abc def')).toThrow(/ไม่ถูกต้อง/);
  });

  test('throws on unsupported duration shorthands', () => {
    expect(() => normalizeCronExpression('70m')).toThrow(/ไม่รองรับ/);
  });
});
