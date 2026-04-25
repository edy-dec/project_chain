const { AppSetting } = require('../models');

const DEFAULT_SETTINGS = {
  general: {
    companyName: 'Chain Technologies SRL',
    timezone: 'Europe/Bucharest',
    currency: 'RON',
    paydayDay: 10,
  },
  notifications: {
    emailNotifications: true,
    slackNotifications: false,
  },
  leavePolicy: {
    maxAnnualLeaveDays: 21,
    autoApproveShortLeave: false,
  },
  bonusOverrides: {},
};

class SettingsService {
  sanitizeSettingsForRead(settings) {
    const safe = structuredClone(settings || DEFAULT_SETTINGS);
    const defaultGeneral = DEFAULT_SETTINGS.general;
    const defaultNotifications = DEFAULT_SETTINGS.notifications;
    const defaultLeavePolicy = DEFAULT_SETTINGS.leavePolicy;

    const companyName = String(safe.general?.companyName || '').trim();
    const timezone = String(safe.general?.timezone || '').trim();
    const currency = String(safe.general?.currency || '').trim().toUpperCase();
    const paydayDay = Number(safe.general?.paydayDay);
    const maxAnnualLeaveDays = Number(safe.leavePolicy?.maxAnnualLeaveDays);

    safe.general = {
      companyName: companyName || defaultGeneral.companyName,
      timezone: timezone || defaultGeneral.timezone,
      currency: ['RON', 'EUR', 'USD', 'GBP'].includes(currency) ? currency : defaultGeneral.currency,
      paydayDay: Number.isInteger(paydayDay) && paydayDay >= 1 && paydayDay <= 28
        ? paydayDay
        : defaultGeneral.paydayDay,
    };

    safe.notifications = {
      emailNotifications: Boolean(safe.notifications?.emailNotifications ?? defaultNotifications.emailNotifications),
      slackNotifications: Boolean(safe.notifications?.slackNotifications ?? defaultNotifications.slackNotifications),
    };

    safe.leavePolicy = {
      maxAnnualLeaveDays: Number.isInteger(maxAnnualLeaveDays) && maxAnnualLeaveDays >= 0 && maxAnnualLeaveDays <= 365
        ? maxAnnualLeaveDays
        : defaultLeavePolicy.maxAnnualLeaveDays,
      autoApproveShortLeave: Boolean(safe.leavePolicy?.autoApproveShortLeave ?? defaultLeavePolicy.autoApproveShortLeave),
    };

    safe.bonusOverrides = this.sanitizeBonusOverrides(safe.bonusOverrides);

    return safe;
  }

  sanitizeBonusOverrides(raw) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

    const sanitized = {};
    Object.entries(raw).forEach(([employeeId, bonusMap]) => {
      if (!bonusMap || typeof bonusMap !== 'object' || Array.isArray(bonusMap)) return;

      const nextBonusMap = {};
      Object.entries(bonusMap).forEach(([bonusId, value]) => {
        if (['inherit', 'enabled', 'disabled'].includes(value)) {
          nextBonusMap[bonusId] = value;
        }
      });

      if (Object.keys(nextBonusMap).length > 0) {
        sanitized[employeeId] = nextBonusMap;
      }
    });

    return sanitized;
  }

  normalizeSettings(merged) {
    const next = structuredClone(merged);

    const companyName = String(next.general?.companyName || '').trim();
    if (!companyName) {
      throw Object.assign(new Error('Company name is required'), { statusCode: 400 });
    }
    next.general.companyName = companyName;

    const timezone = String(next.general?.timezone || '').trim();
    if (!timezone) {
      throw Object.assign(new Error('Timezone is required'), { statusCode: 400 });
    }
    next.general.timezone = timezone;

    const currency = String(next.general?.currency || '').trim().toUpperCase();
    if (!['RON', 'EUR', 'USD', 'GBP'].includes(currency)) {
      throw Object.assign(new Error('Currency must be one of RON, EUR, USD, GBP'), { statusCode: 400 });
    }
    next.general.currency = currency;

    const paydayDay = Number(next.general?.paydayDay);
    if (!Number.isInteger(paydayDay) || paydayDay < 1 || paydayDay > 28) {
      throw Object.assign(new Error('Payday must be an integer between 1 and 28'), { statusCode: 400 });
    }
    next.general.paydayDay = paydayDay;

    next.notifications = {
      emailNotifications: Boolean(next.notifications?.emailNotifications),
      slackNotifications: Boolean(next.notifications?.slackNotifications),
    };

    const maxAnnualLeaveDays = Number(next.leavePolicy?.maxAnnualLeaveDays);
    if (!Number.isInteger(maxAnnualLeaveDays) || maxAnnualLeaveDays < 0 || maxAnnualLeaveDays > 365) {
      throw Object.assign(new Error('Max annual leave days must be an integer between 0 and 365'), { statusCode: 400 });
    }
    next.leavePolicy.maxAnnualLeaveDays = maxAnnualLeaveDays;
    next.leavePolicy.autoApproveShortLeave = Boolean(next.leavePolicy?.autoApproveShortLeave);

    next.bonusOverrides = this.sanitizeBonusOverrides(next.bonusOverrides);

    return next;
  }

  async getSettings() {
    const existing = await AppSetting.findAll();
    if (!existing.length) {
      await Promise.all(
        Object.entries(DEFAULT_SETTINGS).map(([key, value]) => AppSetting.create({ key, value }))
      );
      return structuredClone(DEFAULT_SETTINGS);
    }

    const settings = structuredClone(DEFAULT_SETTINGS);
    existing.forEach((entry) => {
      settings[entry.key] = { ...(settings[entry.key] || {}), ...(entry.value || {}) };
    });
    return this.sanitizeSettingsForRead(settings);
  }

  async updateSettings(partialSettings = {}) {
    const current = await this.getSettings();
    const merged = {
      ...current,
      ...Object.fromEntries(
        Object.entries(partialSettings).map(([key, value]) => [
          key,
          value && typeof value === 'object' && !Array.isArray(value)
            ? { ...(current[key] || {}), ...value }
            : value,
        ])
      ),
    };
    const normalized = this.normalizeSettings(merged);

    await Promise.all(
      Object.entries(normalized).map(async ([key, value]) => {
        const [row] = await AppSetting.findOrCreate({ where: { key }, defaults: { value } });
        if (row) await row.update({ value });
      })
    );

    return normalized;
  }
}

module.exports = new SettingsService();
