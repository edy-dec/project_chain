const { Bonus } = require('../models');
const { getDepartmentKey } = require('../utils/departmentHelper');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

class BonusService {
  normalizePayload(data = {}, { partial = false, current = null } = {}) {
    const payload = {};

    if (!partial || Object.prototype.hasOwnProperty.call(data, 'name')) {
      const name = String(data.name || '').trim();
      if (!name) throw Object.assign(new Error('Bonus name is required'), { statusCode: 400 });
      payload.name = name;
    }

    if (!partial || Object.prototype.hasOwnProperty.call(data, 'type')) {
      const type = String(data.type || '').trim().toLowerCase();
      if (!['fixed', 'percentage', 'overtime_multiplier'].includes(type)) {
        throw Object.assign(new Error('Bonus type is invalid'), { statusCode: 400 });
      }
      payload.type = type;
    }

    if (!partial || Object.prototype.hasOwnProperty.call(data, 'amount')) {
      const amount = Number(data.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw Object.assign(new Error('Bonus amount must be a non-negative number'), { statusCode: 400 });
      }

      const effectiveType = payload.type
        || String(data.type || current?.type || '').trim().toLowerCase();
      if (effectiveType === 'percentage' && amount > 100) {
        throw Object.assign(new Error('Percentage bonuses must be between 0 and 100'), { statusCode: 400 });
      }
      if (effectiveType === 'overtime_multiplier' && (amount < 0.1 || amount > 10)) {
        throw Object.assign(new Error('Overtime multiplier must be between 0.1 and 10'), { statusCode: 400 });
      }

      payload.amount = amount;
    }

    if (!partial || Object.prototype.hasOwnProperty.call(data, 'appliesTo')) {
      const appliesTo = getDepartmentKey(data.appliesTo || 'All');
      payload.appliesTo = appliesTo === 'all' || !appliesTo ? 'All' : appliesTo;
    }

    if (!partial || Object.prototype.hasOwnProperty.call(data, 'applicableFrom')) {
      const applicableFrom = String(data.applicableFrom || '').trim();
      if (!DATE_PATTERN.test(applicableFrom)) {
        throw Object.assign(new Error('applicableFrom must be a valid YYYY-MM-DD date'), { statusCode: 400 });
      }
      payload.applicableFrom = applicableFrom;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'applicableTo')) {
      const applicableTo = data.applicableTo == null || data.applicableTo === ''
        ? null
        : String(data.applicableTo).trim();
      if (applicableTo && !DATE_PATTERN.test(applicableTo)) {
        throw Object.assign(new Error('applicableTo must be a valid YYYY-MM-DD date'), { statusCode: 400 });
      }
      payload.applicableTo = applicableTo;
    } else if (!partial) {
      payload.applicableTo = null;
    }

    const effectiveFrom = payload.applicableFrom ?? data.applicableFrom ?? current?.applicableFrom;
    const effectiveTo = Object.prototype.hasOwnProperty.call(payload, 'applicableTo')
      ? payload.applicableTo
      : data.applicableTo ?? current?.applicableTo;
    if (effectiveFrom && effectiveTo && String(effectiveTo) < String(effectiveFrom)) {
      throw Object.assign(new Error('applicableTo must be on or after applicableFrom'), { statusCode: 400 });
    }

    if (Object.prototype.hasOwnProperty.call(data, 'description')) {
      const description = data.description == null ? null : String(data.description).trim();
      payload.description = description || null;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'isRecurring')) {
      payload.isRecurring = Boolean(data.isRecurring);
    }

    if (Object.prototype.hasOwnProperty.call(data, 'isActive')) {
      payload.isActive = Boolean(data.isActive);
    } else if (!partial) {
      payload.isActive = true;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'userId')) {
      payload.userId = data.userId || null;
    }

    return payload;
  }

  async findAll({ activeOnly = false } = {}) {
    const where = {};
    if (activeOnly) where.isActive = true;
    return Bonus.findAll({ where, order: [['createdAt', 'DESC']] });
  }

  async findById(id) {
    const bonus = await Bonus.findByPk(id);
    if (!bonus) throw Object.assign(new Error('Bonus not found'), { statusCode: 404 });
    return bonus;
  }

  async create(data) {
    return Bonus.create(this.normalizePayload(data));
  }

  async update(id, data) {
    const bonus = await this.findById(id);
    const payload = this.normalizePayload(data, { partial: true, current: bonus });
    return Object.keys(payload).length === 0 ? bonus : bonus.update(payload);
  }

  async delete(id) {
    const bonus = await this.findById(id);
    await bonus.destroy();
    return { message: 'Bonus deleted successfully' };
  }
}

module.exports = new BonusService();
