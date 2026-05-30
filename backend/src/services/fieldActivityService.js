const { FieldActivity, User, Attendance, AppSetting, sequelize } = require('../models');
const { Op } = require('sequelize');

// Tipuri care dau dreptul la diurna
const ALLOWANCE_TYPES = ['delegation', 'detachment'];

// Tipuri care implica timp de munca efectiv (conteaza in totalHours)
const COUNTS_AS_WORK_TIME = ['delegation', 'detachment', 'field_work', 'transport', 'training'];

/**
 * Calculeaza numarul de zile dintr-un interval.
 */
function calcDays(startDate, endDate) {
  const s = new Date(startDate);
  const e = new Date(endDate);
  return Math.max(1, Math.round((e - s) / 86_400_000) + 1);
}

/**
 * Incarca rata diurnei din AppSettings.
 * Cheia 'fieldActivityPolicy' stocheaza configuratia deplasarilor.
 * Fallback la 0 daca nu e configurata (admin o seteaza in Settings).
 *
 * Structura setare:
 * {
 *   dailyAllowanceRate: 50,       // RON/zi — rata implicita diurna
 *   taxFreeThresholdPerDay: 0,    // RON/zi — plafon neimpozabil (Z-01 — verifica fiscal 2026)
 *   autoCalculateAllowance: true  // calculeaza automat la submit
 * }
 */
async function loadFieldPolicy() {
  const setting = await AppSetting.findOne({ where: { key: 'fieldActivityPolicy' } });
  const defaults = {
    dailyAllowanceRate: 0,
    taxFreeThresholdPerDay: 0,
    autoCalculateAllowance: true,
  };
  if (!setting) return defaults;
  return { ...defaults, ...(setting.value || {}) };
}

class FieldActivityService {
  _validate({ activityType, startDate, endDate }) {
    const valid = ['delegation', 'detachment', 'field_work', 'remote', 'transport', 'training'];
    if (!valid.includes(activityType)) {
      throw Object.assign(new Error(`Tip invalid. Valori permise: ${valid.join(', ')}`), { statusCode: 400 });
    }
    if (!startDate || !endDate) {
      throw Object.assign(new Error('startDate si endDate sunt obligatorii'), { statusCode: 400 });
    }
    if (endDate < startDate) {
      throw Object.assign(new Error('endDate nu poate fi inainte de startDate'), { statusCode: 400 });
    }
  }

  async create(userId, data) {
    const {
      activityType, destination, startDate, endDate,
      startTime, endTime, notes, attachmentUrl, attendanceId,
      dailyAllowance: manualDailyAllowance,
      transportCost = 0, accommodationCost = 0, otherCosts = 0,
    } = data;

    this._validate({ activityType, startDate, endDate });

    const policy    = await loadFieldPolicy();
    const totalDays = calcDays(startDate, endDate);

    // Ore lucrate: daca se da startTime+endTime (zi unica) se calculeaza, altfel totalDays * 8
    let totalHours = 0;
    if (startTime && endTime && startDate === endDate) {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      totalHours = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
    } else if (COUNTS_AS_WORK_TIME.includes(activityType)) {
      totalHours = totalDays * 8;
    }

    // Diurna: auto-calculata daca e tip eligibil si policy.autoCalculateAllowance=true
    let dailyAllowance = 0;
    if (ALLOWANCE_TYPES.includes(activityType)) {
      dailyAllowance = manualDailyAllowance != null
        ? +manualDailyAllowance
        : (policy.autoCalculateAllowance ? policy.dailyAllowanceRate : 0);
    }
    const totalAllowance = dailyAllowance * totalDays;

    // Marcheaza ca impozabil daca totalAllowance depaseste plafonul neimpozabil
    // NOTA (Z-01): plafonul exact pentru 2026 necesita verificare juridica.
    const isTaxable = policy.taxFreeThresholdPerDay > 0
      ? dailyAllowance > policy.taxFreeThresholdPerDay
      : false;

    const activity = await FieldActivity.create({
      userId,
      activityType,
      destination: destination || null,
      startDate,
      endDate,
      startTime: startTime || null,
      endTime:   endTime   || null,
      totalDays,
      totalHours: +totalHours.toFixed(2),
      dailyAllowance,
      totalAllowance: +totalAllowance.toFixed(2),
      transportCost:     +transportCost,
      accommodationCost: +accommodationCost,
      otherCosts:        +otherCosts,
      isTaxable,
      status: 'pending',
      notes: notes || null,
      attachmentUrl: attachmentUrl || null,
      attendanceId: attendanceId || null,
    });

    return activity;
  }

  async resolve(activityId, approverId, isApproved, rejectionReason = null) {
    const activity = await FieldActivity.findByPk(activityId);
    if (!activity) throw Object.assign(new Error('Activitatea nu a fost gasita'), { statusCode: 404 });
    if (activity.status !== 'pending') {
      throw Object.assign(new Error('Activitatea nu este in asteptare'), { statusCode: 400 });
    }
    return activity.update({
      status:          isApproved ? 'approved' : 'rejected',
      approvedBy:      approverId,
      approvedAt:      new Date(),
      rejectionReason: isApproved ? null : rejectionReason,
    });
  }

  async cancel(activityId, userId) {
    const activity = await FieldActivity.findOne({ where: { id: activityId, userId } });
    if (!activity) throw Object.assign(new Error('Activitatea nu a fost gasita'), { statusCode: 404 });
    if (!['pending', 'approved'].includes(activity.status)) {
      throw Object.assign(new Error('Aceasta activitate nu poate fi anulata'), { statusCode: 400 });
    }
    return activity.update({ status: 'draft' });
  }

  async update(activityId, userId, data) {
    const activity = await FieldActivity.findOne({ where: { id: activityId, userId } });
    if (!activity) throw Object.assign(new Error('Activitatea nu a fost gasita'), { statusCode: 404 });
    if (activity.status === 'approved') {
      throw Object.assign(new Error('Activitatile aprobate nu pot fi modificate'), { statusCode: 400 });
    }

    const merged = { ...activity.toJSON(), ...data };
    this._validate({ activityType: merged.activityType, startDate: merged.startDate, endDate: merged.endDate });

    const policy    = await loadFieldPolicy();
    const totalDays = calcDays(merged.startDate, merged.endDate);

    let totalHours = 0;
    if (merged.startTime && merged.endTime && merged.startDate === merged.endDate) {
      const [sh, sm] = merged.startTime.split(':').map(Number);
      const [eh, em] = merged.endTime.split(':').map(Number);
      totalHours = Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
    } else if (COUNTS_AS_WORK_TIME.includes(merged.activityType)) {
      totalHours = totalDays * 8;
    }

    let dailyAllowance = +merged.dailyAllowance || 0;
    if (ALLOWANCE_TYPES.includes(merged.activityType) && data.dailyAllowance == null && policy.autoCalculateAllowance) {
      dailyAllowance = policy.dailyAllowanceRate;
    }
    const totalAllowance = dailyAllowance * totalDays;
    const isTaxable = policy.taxFreeThresholdPerDay > 0 ? dailyAllowance > policy.taxFreeThresholdPerDay : false;

    return activity.update({
      activityType:      merged.activityType,
      destination:       merged.destination || null,
      startDate:         merged.startDate,
      endDate:           merged.endDate,
      startTime:         merged.startTime || null,
      endTime:           merged.endTime   || null,
      totalDays,
      totalHours:        +totalHours.toFixed(2),
      dailyAllowance,
      totalAllowance:    +totalAllowance.toFixed(2),
      transportCost:     +merged.transportCost     || 0,
      accommodationCost: +merged.accommodationCost || 0,
      otherCosts:        +merged.otherCosts        || 0,
      isTaxable,
      notes:             merged.notes        || null,
      attachmentUrl:     merged.attachmentUrl || null,
    });
  }

  async getMyActivities(userId, { status, activityType, year, month, page = 1, limit = 20 } = {}) {
    const where = { userId };
    if (status) where.status = status;
    if (activityType) where.activityType = activityType;
    if (year && month) {
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
      const endOfMonth   = new Date(year, month, 0).toISOString().split('T')[0];
      where.startDate = { [Op.between]: [startOfMonth, endOfMonth] };
    } else if (year) {
      where.startDate = { [Op.between]: [`${year}-01-01`, `${year}-12-31`] };
    }

    const { count, rows } = await FieldActivity.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['start_date', 'DESC']],
    });

    return { activities: rows, total: count, page: +page, totalPages: Math.ceil(count / limit) || 1 };
  }

  async getAllActivities({ status, activityType, userId, year, month, page = 1, limit = 20 } = {}) {
    const where = {};
    if (status) where.status = status;
    if (activityType) where.activityType = activityType;
    if (userId) where.userId = userId;
    if (year && month) {
      const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
      const endOfMonth   = new Date(year, month, 0).toISOString().split('T')[0];
      where.startDate = { [Op.between]: [startOfMonth, endOfMonth] };
    } else if (year) {
      where.startDate = { [Op.between]: [`${year}-01-01`, `${year}-12-31`] };
    }

    const { count, rows } = await FieldActivity.findAndCountAll({
      where,
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'approver',  attributes: ['id', 'firstName', 'lastName'], required: false },
      ],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['start_date', 'DESC']],
    });

    return { activities: rows, total: count, page: +page, totalPages: Math.ceil(count / limit) || 1 };
  }

  async getById(activityId) {
    return FieldActivity.findByPk(activityId, {
      include: [
        { model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'approver',  attributes: ['id', 'firstName', 'lastName'], required: false },
        { model: Attendance, as: 'attendance', required: false },
      ],
    });
  }

  // Sumar lunar: total zile teren, ore, diurna aprobata
  async getMonthlySummary(userId, year, month) {
    const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
    const endOfMonth   = new Date(year, month, 0).toISOString().split('T')[0];

    const activities = await FieldActivity.findAll({
      where: {
        userId,
        status: 'approved',
        startDate: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    });

    const summary = {
      totalActivities:   activities.length,
      totalDays:         activities.reduce((s, a) => s + +a.totalDays, 0),
      totalHours:        activities.reduce((s, a) => s + +a.totalHours, 0),
      totalAllowance:    activities.reduce((s, a) => s + +a.totalAllowance, 0),
      transportCost:     activities.reduce((s, a) => s + +a.transportCost, 0),
      accommodationCost: activities.reduce((s, a) => s + +a.accommodationCost, 0),
      otherCosts:        activities.reduce((s, a) => s + +a.otherCosts, 0),
      byType: {},
    };

    for (const a of activities) {
      if (!summary.byType[a.activityType]) {
        summary.byType[a.activityType] = { count: 0, days: 0, hours: 0, allowance: 0 };
      }
      summary.byType[a.activityType].count    += 1;
      summary.byType[a.activityType].days     += +a.totalDays;
      summary.byType[a.activityType].hours    += +a.totalHours;
      summary.byType[a.activityType].allowance += +a.totalAllowance;
    }

    summary.totalCosts = +summary.totalAllowance + +summary.transportCost + +summary.accommodationCost + +summary.otherCosts;
    return summary;
  }
}

module.exports = new FieldActivityService();
