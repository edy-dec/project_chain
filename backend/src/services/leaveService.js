const { Leave, User, LegalHoliday, LeaveBalanceHistory, sequelize } = require('../models');
const { Op } = require('sequelize');
const dateHelper = require('../utils/dateHelper');
const settingsService = require('./settingsService');

// Leave types that consume from annualLeaveBalance
const BALANCE_DEDUCTED_TYPES = ['annual'];

// Leave types that must NOT deduce from any balance — they have separate legal frameworks
const NO_BALANCE_TYPES = ['sick', 'maternity', 'paternity', 'parental', 'study', 'unpaid', 'personal'];

class LeaveService {
  async _getHolidayDates(startDate, endDate) {
    const { Op: OpInner } = require('sequelize');
    const holidays = await LegalHoliday.findAll({
      where: {
        country: 'RO',
        holidayDate: { [OpInner.between]: [startDate, endDate] },
        [OpInner.or]: [{ validUntil: null }, { validUntil: { [OpInner.gte]: startDate } }],
      },
      attributes: ['holidayDate'],
    });
    return holidays.map((h) => h.holidayDate);
  }

  async _logBalanceChange(userId, performedBy, leaveType, changeAmount, balanceAfter, reason, transaction) {
    await LeaveBalanceHistory.create({
      userId,
      performedBy,
      leaveType,
      changeAmount,
      balanceAfter,
      reason,
    }, { transaction });
  }

  async requestLeave(userId, { type, startDate, endDate, reason }) {
    const holidayDates = await this._getHolidayDates(startDate, endDate);
    const days = dateHelper.calculateWorkDays(startDate, endDate, holidayDates);
    if (days <= 0) throw Object.assign(new Error('Intervalul de date nu contine zile lucratoare'), { statusCode: 400 });

    // Concediu medical, maternitate, paternitate, parental, studii, fara plata:
    // nu se verifica sold — au regim juridic propriu (OUG 158/2005, Legea 210/1999 etc.)
    if (NO_BALANCE_TYPES.includes(type)) {
      const overlap = await Leave.findOne({
        where: {
          userId,
          status: { [Op.in]: ['pending', 'approved'] },
          [Op.or]: [
            { startDate: { [Op.between]: [startDate, endDate] } },
            { endDate:   { [Op.between]: [startDate, endDate] } },
            { [Op.and]:  [{ startDate: { [Op.lte]: startDate } }, { endDate: { [Op.gte]: endDate } }] },
          ],
        },
      });
      if (overlap) throw Object.assign(new Error('Cererea se suprapune cu un concediu existent'), { statusCode: 409 });

      return Leave.create({
        userId, type, startDate, endDate, days, reason, status: 'pending',
      });
    }

    // Concediu de odihna: verifica sold + auto-aprobare
    const settings = await settingsService.getSettings();
    const autoApproveShortLeave = Boolean(settings.leavePolicy?.autoApproveShortLeave);
    const shouldAutoApprove = autoApproveShortLeave && days <= 1;

    return sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user) throw Object.assign(new Error('Angajatul nu a fost gasit'), { statusCode: 404 });

      if (user.annualLeaveBalance < days) {
        throw Object.assign(
          new Error(`Sold insuficient. Disponibil: ${user.annualLeaveBalance} zile`),
          { statusCode: 400 }
        );
      }

      const overlap = await Leave.findOne({
        where: {
          userId,
          status: { [Op.in]: ['pending', 'approved'] },
          [Op.or]: [
            { startDate: { [Op.between]: [startDate, endDate] } },
            { endDate:   { [Op.between]: [startDate, endDate] } },
            { [Op.and]:  [{ startDate: { [Op.lte]: startDate } }, { endDate: { [Op.gte]: endDate } }] },
          ],
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (overlap) throw Object.assign(new Error('Cererea se suprapune cu un concediu existent'), { statusCode: 409 });

      if (shouldAutoApprove) {
        const newBalance = user.annualLeaveBalance - days;
        await user.update({ annualLeaveBalance: newBalance }, { transaction });
        await this._logBalanceChange(
          userId, userId, 'annual', -days, newBalance,
          'Auto-aprobare cerere concediu odihna', transaction
        );
      }

      return Leave.create({
        userId, type, startDate, endDate, days, reason,
        status: shouldAutoApprove ? 'approved' : 'pending',
        approvedAt: shouldAutoApprove ? new Date() : null,
        approvedBy: null,
      }, { transaction });
    });
  }

  async resolveLeave(leaveId, approvedBy, isApproved, rejectionReason = null) {
    return sequelize.transaction(async (transaction) => {
      const leave = await Leave.findByPk(leaveId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!leave) throw Object.assign(new Error('Cererea de concediu nu a fost gasita'), { statusCode: 404 });
      if (leave.status !== 'pending') throw Object.assign(new Error('Cererea nu este in asteptare'), { statusCode: 400 });

      if (isApproved && BALANCE_DEDUCTED_TYPES.includes(leave.type)) {
        const user = await User.findByPk(leave.userId, { transaction, lock: transaction.LOCK.UPDATE });
        if (!user) throw Object.assign(new Error('Angajatul nu a fost gasit'), { statusCode: 404 });

        if (user.annualLeaveBalance < leave.days) {
          throw Object.assign(
            new Error(`Sold insuficient la aprobare. Disponibil: ${user.annualLeaveBalance} zile`),
            { statusCode: 400 }
          );
        }
        const newBalance = user.annualLeaveBalance - leave.days;
        await user.update({ annualLeaveBalance: newBalance }, { transaction });
        await this._logBalanceChange(
          leave.userId, approvedBy, 'annual', -leave.days, newBalance,
          `Aprobare concediu odihna de catre manager`, transaction
        );
      }

      return leave.update({
        status: isApproved ? 'approved' : 'rejected',
        approvedBy,
        approvedAt: new Date(),
        rejectionReason: isApproved ? null : rejectionReason,
      }, { transaction });
    });
  }

  async cancelLeave(leaveId, userId) {
    return sequelize.transaction(async (transaction) => {
      const leave = await Leave.findOne({
        where: { id: leaveId, userId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!leave) throw Object.assign(new Error('Cererea de concediu nu a fost gasita'), { statusCode: 404 });
      if (!['pending', 'approved'].includes(leave.status)) {
        throw Object.assign(new Error('Aceasta cerere nu poate fi anulata'), { statusCode: 400 });
      }

      if (leave.status === 'approved' && BALANCE_DEDUCTED_TYPES.includes(leave.type)) {
        const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
        const newBalance = user.annualLeaveBalance + leave.days;
        await user.update({ annualLeaveBalance: newBalance }, { transaction });
        await this._logBalanceChange(
          userId, userId, 'annual', +leave.days, newBalance,
          'Anulare concediu odihna aprobat', transaction
        );
      }

      return leave.update({ status: 'cancelled' }, { transaction });
    });
  }

  async getUserLeaves(userId, { status, type, year, page = 1, limit = 20 } = {}) {
    const where = { userId };
    if (status) where.status = status;
    if (type) where.type = type;
    if (year) where.startDate = { [Op.between]: [`${year}-01-01`, `${year}-12-31`] };

    const { count, rows } = await Leave.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });

    return { leaves: rows, total: count, page: +page, totalPages: Math.ceil(count / limit) };
  }

  async getAllLeaves({ status, type, page = 1, limit = 20 } = {}) {
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;

    const { count, rows } = await Leave.findAndCountAll({
      where,
      include: [{ model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });

    return { leaves: rows, total: count, page: +page, totalPages: Math.ceil(count / limit) };
  }

  async getLeaveBalance(userId) {
    const user = await User.findByPk(userId, { attributes: ['annualLeaveBalance'] });
    if (!user) throw Object.assign(new Error('Angajatul nu a fost gasit'), { statusCode: 404 });
    return { annual: user.annualLeaveBalance };
  }

  async getLeaveBalanceHistory(userId, { year, page = 1, limit = 30 } = {}) {
    const where = { userId };
    if (year) {
      where.createdAt = {
        [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31T23:59:59`)],
      };
    }
    const { count, rows } = await LeaveBalanceHistory.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['createdAt', 'DESC']],
    });
    return { history: rows, total: count, page: +page, totalPages: Math.ceil(count / limit) };
  }
}

module.exports = new LeaveService();
