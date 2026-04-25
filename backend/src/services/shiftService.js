const { Shift, Department, User } = require('../models');

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

class ShiftService {
  normalizeTime(value, fieldName) {
    if (typeof value !== 'string' || !TIME_PATTERN.test(value)) {
      throw Object.assign(new Error(`${fieldName} must be in HH:MM format`), { statusCode: 400 });
    }
    return value.length === 5 ? `${value}:00` : value;
  }

  normalizeDaysOfWeek(daysOfWeek) {
    if (!Array.isArray(daysOfWeek)) {
      throw Object.assign(new Error('daysOfWeek must be an array'), { statusCode: 400 });
    }

    const normalized = [...new Set(daysOfWeek
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
      .sort((a, b) => DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b));

    if (normalized.length === 0) {
      throw Object.assign(new Error('At least one working day is required'), { statusCode: 400 });
    }

    return normalized;
  }

  normalizePayload(data = {}, { partial = false } = {}) {
    const payload = {};

    if (!partial || Object.prototype.hasOwnProperty.call(data, 'name')) {
      const name = String(data.name || '').trim();
      if (!name) throw Object.assign(new Error('Shift name is required'), { statusCode: 400 });
      payload.name = name;
    }

    if (!partial || Object.prototype.hasOwnProperty.call(data, 'startTime')) {
      payload.startTime = this.normalizeTime(data.startTime, 'startTime');
    }

    if (!partial || Object.prototype.hasOwnProperty.call(data, 'endTime')) {
      payload.endTime = this.normalizeTime(data.endTime, 'endTime');
    }

    if (Object.prototype.hasOwnProperty.call(data, 'daysOfWeek')) {
      payload.daysOfWeek = this.normalizeDaysOfWeek(data.daysOfWeek);
    } else if (!partial) {
      payload.daysOfWeek = [1, 2, 3, 4, 5];
    }

    if (Object.prototype.hasOwnProperty.call(data, 'breakMinutes')) {
      const breakMinutes = Number(data.breakMinutes);
      if (!Number.isInteger(breakMinutes) || breakMinutes < 0 || breakMinutes > 720) {
        throw Object.assign(new Error('breakMinutes must be a whole number between 0 and 720'), { statusCode: 400 });
      }
      payload.breakMinutes = breakMinutes;
    } else if (!partial) {
      payload.breakMinutes = 30;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'color')) {
      const color = String(data.color || '').trim();
      if (!HEX_COLOR_PATTERN.test(color)) {
        throw Object.assign(new Error('color must be a valid hex value'), { statusCode: 400 });
      }
      payload.color = color;
    } else if (!partial) {
      payload.color = '#22c55e';
    }

    if (Object.prototype.hasOwnProperty.call(data, 'departmentId')) {
      payload.departmentId = data.departmentId || null;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'isActive')) {
      payload.isActive = Boolean(data.isActive);
    } else if (!partial) {
      payload.isActive = true;
    }

    return payload;
  }

  async findAll(departmentId) {
    const where = { isActive: true };
    if (departmentId) where.departmentId = departmentId;
    return Shift.findAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'color'] },
        { model: User, as: 'employees', attributes: ['id'], required: false },
      ],
      order: [['name', 'ASC']],
    });
  }

  async findById(id) {
    const shift = await Shift.findByPk(id, {
      include: [
        { model: Department, as: 'department' },
        { model: User, as: 'employees', attributes: ['id', 'firstName', 'lastName'], required: false },
      ],
    });
    if (!shift) throw Object.assign(new Error('Shift not found'), { statusCode: 404 });
    return shift;
  }

  async create(data) {
    return Shift.create(this.normalizePayload(data));
  }

  async update(id, data) {
    const shift = await Shift.findByPk(id);
    if (!shift) throw Object.assign(new Error('Shift not found'), { statusCode: 404 });
    const payload = this.normalizePayload(data, { partial: true });
    return Object.keys(payload).length === 0 ? shift : shift.update(payload);
  }

  async delete(id) {
    const shift = await Shift.findByPk(id);
    if (!shift) throw Object.assign(new Error('Shift not found'), { statusCode: 404 });
    const count = await User.count({ where: { shiftId: id } });
    if (count > 0) throw Object.assign(new Error('Cannot delete a shift with assigned employees'), { statusCode: 409 });
    return shift.update({ isActive: false });
  }

  async assignShift(userId, shiftId) {
    const user = await User.findByPk(userId);
    if (!user) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });

    if (!shiftId) {
      return user.update({ shiftId: null });
    }

    const shift = await Shift.findByPk(shiftId);
    if (!shift || !shift.isActive) throw Object.assign(new Error('Shift not found'), { statusCode: 404 });

    return user.update({ shiftId });
  }
}

module.exports = new ShiftService();
