const { Attendance, User, Shift, OvertimeBalance } = require('../models');
const { Op } = require('sequelize');
const dateHelper = require('../utils/dateHelper');

// Normal working hours per day (Codul Muncii art. 112 — 8h/day, 40h/week)
const NORMAL_HOURS_PER_DAY = 8;

class AttendanceService {
  async checkIn(userId) {
    const today = dateHelper.getToday();
    const existing = await Attendance.findOne({ where: { userId, date: today } });

    if (existing?.checkIn) {
      throw Object.assign(new Error('Already checked in today'), { statusCode: 400 });
    }

    const user = await User.findByPk(userId, { include: [{ model: Shift, as: 'shift' }] });

    if (existing) {
      return existing.update({ checkIn: new Date(), status: 'present' });
    }

    return Attendance.create({
      userId,
      shiftId: user?.shiftId || null,
      date: today,
      checkIn: new Date(),
      status: 'present',
    });
  }

  async checkOut(userId) {
    const today = dateHelper.getToday();
    const attendance = await Attendance.findOne({
      where: { userId, date: today },
      include: [{ model: Shift, as: 'shift' }],
    });

    if (!attendance?.checkIn) {
      throw Object.assign(new Error('No check-in found for today'), { statusCode: 400 });
    }
    if (attendance.checkOut) {
      throw Object.assign(new Error('Already checked out today'), { statusCode: 400 });
    }

    const checkOut = new Date();
    const rawHours = (checkOut - new Date(attendance.checkIn)) / 3_600_000;

    // Codul Muncii art. 132: pauza de masa nu face parte din timpul de munca.
    // Se scade breakMinutes din tura atribuita (daca exista).
    const breakHours = (attendance.shift?.breakMinutes || 0) / 60;
    const totalHours = Math.max(0, rawHours - breakHours);

    const overtimeHours = Math.max(0, totalHours - NORMAL_HOURS_PER_DAY);

    const updated = await attendance.update({
      checkOut,
      totalHours: +totalHours.toFixed(2),
      overtimeHours: +overtimeHours.toFixed(2),
    });

    // Acumuleaza ore suplimentare in OvertimeBalance (Codul Muncii art. 122).
    // Compensarea cu timp liber are prioritate fata de plata directa.
    // Termenul de compensare este de 90 de zile calendaristice.
    if (overtimeHours > 0) {
      await this._accumulateOvertime(userId, today, overtimeHours);
    }

    return updated;
  }

  async _accumulateOvertime(userId, dateStr, hours) {
    const periodStart = dateStr;
    const expDate = new Date(dateStr);
    expDate.setDate(expDate.getDate() + 90);
    const expirationDate = expDate.toISOString().split('T')[0];

    const existing = await OvertimeBalance.findOne({ where: { userId, periodStart } });
    if (existing) {
      await existing.update({ accumulatedHours: +existing.accumulatedHours + hours });
    } else {
      await OvertimeBalance.create({ userId, periodStart, expirationDate, accumulatedHours: hours });
    }
  }

  async getTodayAttendance(userId) {
    return Attendance.findOne({
      where: { userId, date: dateHelper.getToday() },
      include: [{ model: Shift, as: 'shift', attributes: ['name', 'startTime', 'endTime', 'breakMinutes'] }],
    });
  }

  async getAttendanceHistory(userId, { startDate, endDate, page = 1, limit = 20 } = {}) {
    const where = { userId };
    if (startDate && endDate) where.date = { [Op.between]: [startDate, endDate] };

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['date', 'DESC']],
    });

    return { attendances: rows, total: count, page: +page, totalPages: Math.ceil(count / limit) };
  }

  async getMonthlyAttendance(userId, year, month) {
    const { start, end } = dateHelper.getMonthDateRange(year, month);
    const attendances = await Attendance.findAll({
      where: { userId, date: { [Op.between]: [start, end] } },
      order: [['date', 'ASC']],
    });

    const totalHours    = attendances.reduce((s, a) => s + (+a.totalHours || 0), 0);
    const overtimeHours = attendances.reduce((s, a) => s + (+a.overtimeHours || 0), 0);
    const presentDays   = attendances.filter((a) => ['present', 'late'].includes(a.status)).length;

    return {
      attendances,
      summary: {
        totalHours:    +totalHours.toFixed(2),
        overtimeHours: +overtimeHours.toFixed(2),
        presentDays,
      },
    };
  }

  async getAllAttendance({ date, departmentId, page = 1, limit = 20 } = {}) {
    const where = {};
    if (date) where.date = date;

    const userWhere = {};
    if (departmentId) userWhere.departmentId = departmentId;

    const { count, rows } = await Attendance.findAndCountAll({
      where,
      include: [{ model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'], where: userWhere }],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['date', 'DESC'], ['checkIn', 'DESC']],
    });

    return { attendances: rows, total: count, page: +page, totalPages: Math.ceil(count / limit) };
  }

  async manualEntry({ userId, date, checkIn, checkOut, notes, shiftId }) {
    const existing = await Attendance.findOne({ where: { userId, date } });
    let totalHours    = null;
    let overtimeHours = 0;

    if (checkIn && checkOut) {
      const shift = shiftId
        ? await Shift.findByPk(shiftId, { attributes: ['breakMinutes'] })
        : null;
      const breakHours = (shift?.breakMinutes || 0) / 60;
      const rawHours = (new Date(checkOut) - new Date(checkIn)) / 3_600_000;
      totalHours    = Math.max(0, rawHours - breakHours);
      overtimeHours = Math.max(0, totalHours - NORMAL_HOURS_PER_DAY);
    }

    const payload = {
      checkIn, checkOut,
      totalHours:    totalHours !== null ? +totalHours.toFixed(2) : null,
      overtimeHours: +overtimeHours.toFixed(2),
      notes, shiftId,
      isManualEntry: true,
      status: 'present',
    };

    if (existing) return existing.update(payload);
    return Attendance.create({ userId, date, ...payload });
  }

  // --- OvertimeBalance management ---

  async getOvertimeBalance(userId) {
    const { Op: OpLocal } = require('sequelize');
    const records = await OvertimeBalance.findAll({
      where: { userId },
      order: [['period_start', 'DESC']],
    });
    const totalPending = records.reduce((s, r) => {
      return s + Math.max(0, +r.accumulatedHours - +r.compensatedHours - +r.paidHours);
    }, 0);
    const today = dateHelper.getToday();
    const expired = records.filter((r) => r.expirationDate <= today && (+r.accumulatedHours - +r.compensatedHours - +r.paidHours) > 0);
    return { records, totalPending: +totalPending.toFixed(2), expiredRecords: expired.length };
  }
}

module.exports = new AttendanceService();
