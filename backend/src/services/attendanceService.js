const { Attendance, User, Shift } = require('../models');
const { Op } = require('sequelize');
const dateHelper = require('../utils/dateHelper');

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
    const attendance = await Attendance.findOne({ where: { userId, date: today } });

    if (!attendance?.checkIn) {
      throw Object.assign(new Error('No check-in found for today'), { statusCode: 400 });
    }
    if (attendance.checkOut) {
      throw Object.assign(new Error('Already checked out today'), { statusCode: 400 });
    }

    const checkOut = new Date();
    const totalHours = (checkOut - new Date(attendance.checkIn)) / 3_600_000;
    const overtimeHours = Math.max(0, totalHours - 8);

    return attendance.update({
      checkOut,
      totalHours: +totalHours.toFixed(2),
      overtimeHours: +overtimeHours.toFixed(2),
    });
  }

  async getTodayAttendance(userId) {
    return Attendance.findOne({
      where: { userId, date: dateHelper.getToday() },
      include: [{ model: Shift, as: 'shift', attributes: ['name', 'startTime', 'endTime'] }],
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

    const totalHours = attendances.reduce((s, a) => s + (+a.totalHours || 0), 0);
    const overtimeHours = attendances.reduce((s, a) => s + (+a.overtimeHours || 0), 0);
    const presentDays = attendances.filter((a) => ['present', 'late'].includes(a.status)).length;

    return { attendances, summary: { totalHours: +totalHours.toFixed(2), overtimeHours: +overtimeHours.toFixed(2), presentDays } };
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
    let totalHours = null;
    if (checkIn && checkOut) {
      totalHours = (new Date(checkOut) - new Date(checkIn)) / 3_600_000;
    }

    const payload = { checkIn, checkOut, totalHours, notes, shiftId, isManualEntry: true, status: 'present' };

    if (existing) return existing.update(payload);
    return Attendance.create({ userId, date, ...payload });
  }
}

module.exports = new AttendanceService();
