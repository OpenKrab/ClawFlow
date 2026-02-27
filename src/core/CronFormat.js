const cron = require('node-cron');

const CRON_PRESETS = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

function durationToCron(value, unit) {
  if (unit === 'm') {
    if (value > 0 && value <= 59) {
      return `*/${value} * * * *`;
    }
    if (value % 60 === 0) {
      return `0 */${Math.floor(value / 60)} * * *`;
    }
  }

  if (unit === 'h' && value > 0) {
    return `0 */${value} * * *`;
  }

  if (unit === 'd' && value > 0) {
    return `0 0 */${value} * *`;
  }

  return null;
}

function normalizeCronExpression(input) {
  if (typeof input !== 'string' || !input.trim()) {
    throw new Error('ต้องระบุ schedule');
  }

  let schedule = input.trim().replace(/\s+/g, ' ');
  const lowered = schedule.toLowerCase();

  if (CRON_PRESETS[lowered]) {
    schedule = CRON_PRESETS[lowered];
  } else {
    const durationMatch = lowered.match(/^(?:every\s+)?(\d+)([mhd])$/i);
    if (durationMatch) {
      const value = Number(durationMatch[1]);
      const unit = durationMatch[2].toLowerCase();
      const converted = durationToCron(value, unit);
      if (!converted) {
        throw new Error(`ไม่รองรับช่วงเวลา "${input}"`);
      }
      schedule = converted;
    }
  }

  if (!cron.validate(schedule)) {
    throw new Error(
      `Cron expression "${input}" ไม่ถูกต้อง (ตัวอย่างที่ใช้ได้: "*/5 * * * *", "@daily", "every 15m")`,
    );
  }

  return schedule;
}

module.exports = {
  normalizeCronExpression,
};
