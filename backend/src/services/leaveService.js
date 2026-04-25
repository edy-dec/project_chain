const { Leave, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const dateHelper = require('../utils/dateHelper');
const settingsService = require('./settingsService');

class LeaveService {
  async requestLeave(userId, { type, startDate, endDate, reason }) {
    const days = dateHelper.calculateWorkDays(startDate, endDate);
    if (days <= 0) throw Object.assign(new Error('Invalid date range'), { statusCode: 400 });
    const settings = await settingsService.getSettings();
    const autoApproveShortLeave = Boolean(settings.leavePolicy?.autoApproveShortLeave);
    const shouldAutoApprove = autoApproveShortLeave && days <= 1;

    return sequelize.transaction(async (transaction) => {
      const user = await User.findByPk(userId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

      if (type === 'annual' && user.annualLeaveBalance < days) {
        throw Object.assign(
          new Error(`Insufficient annual leave balance. Available: ${user.annualLeaveBalance} days`),
          { statusCode: 400 }
        );
      }
      if (type === 'sick' && user.sickLeaveBalance < days) {
        throw Object.assign(
          new Error(`Insufficient sick leave balance. Available: ${user.sickLeaveBalance} days`),
          { statusCode: 400 }
        );
      }

      const overlap = await Leave.findOne({
        where: {
          userId,
          status: { [Op.in]: ['pending', 'approved'] },
          [Op.or]: [
            { startDate: { [Op.between]: [startDate, endDate] } },
            { endDate: { [Op.between]: [startDate, endDate] } },
            { [Op.and]: [{ startDate: { [Op.lte]: startDate } }, { endDate: { [Op.gte]: endDate } }] },
          ],
        },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (overlap) throw Object.assign(new Error('Leave request overlaps with existing leave'), { statusCode: 409 });

      if (shouldAutoApprove) {
        if (type === 'annual') {
          await user.update({ annualLeaveBalance: user.annualLeaveBalance - days }, { transaction });
        } else if (type === 'sick') {
          await user.update({ sickLeaveBalance: user.sickLeaveBalance - days }, { transaction });
        }
      }

      return Leave.create({
        userId,
        type,
        startDate,
        endDate,
        days,
        reason,
        status: shouldAutoApprove ? 'approved' : 'pending',
        approvedAt: shouldAutoApprove ? new Date() : null,
        approvedBy: null,
      }, { transaction });
    });
  }

  async resolveLeave(leaveId, approvedBy, isApproved, rejectionReason = null) {
    return sequelize.transaction(async (transaction) => {
      const leave = await Leave.findByPk(leaveId, { transaction, lock: transaction.LOCK.UPDATE });
      if (!leave) throw Object.assign(new Error('Leave request not found'), { statusCode: 404 });
      if (leave.status !== 'pending') throw Object.assign(new Error('Leave is not pending'), { statusCode: 400 });

      if (isApproved) {
        const user = await User.findByPk(leave.userId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });

        if (leave.type === 'annual') {
          if (user.annualLeaveBalance < leave.days) {
            throw Object.assign(
              new Error(`Insufficient annual leave balance. Available: ${user.annualLeaveBalance} days`),
              { statusCode: 400 }
            );
          }
          await user.update({ annualLeaveBalance: user.annualLeaveBalance - leave.days }, { transaction });
        } else if (leave.type === 'sick') {
          if (user.sickLeaveBalance < leave.days) {
            throw Object.assign(
              new Error(`Insufficient sick leave balance. Available: ${user.sickLeaveBalance} days`),
              { statusCode: 400 }
            );
          }
          await user.update({ sickLeaveBalance: user.sickLeaveBalance - leave.days }, { transaction });
        }
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
      if (!leave) throw Object.assign(new Error('Leave request not found'), { statusCode: 404 });
      if (!['pending', 'approved'].includes(leave.status)) {
        throw Object.assign(new Error('Cannot cancel this leave request'), { statusCode: 400 });
      }

      if (leave.status === 'approved') {
        const user = await User.findByPk(userId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });
        if (leave.type === 'annual') {
          await user.update({ annualLeaveBalance: user.annualLeaveBalance + leave.days }, { transaction });
        } else if (leave.type === 'sick') {
          await user.update({ sickLeaveBalance: user.sickLeaveBalance + leave.days }, { transaction });
        }
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
    const user = await User.findByPk(userId, { attributes: ['annualLeaveBalance', 'sickLeaveBalance'] });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return { annual: user.annualLeaveBalance, sick: user.sickLeaveBalance };
  }
}

module.exports = new LeaveService();
