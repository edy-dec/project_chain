const { OvertimeBalance } = require('../models');
const { Op } = require('sequelize');
const attendanceService = require('../services/attendanceService');

/**
 * GET /overtime/balance/my
 * Employee: view own overtime balance.
 */
const getMyBalance = async (req, res, next) => {
  try {
    const data = await attendanceService.getOvertimeBalance(req.currentUser.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /overtime/balance/:userId
 * Admin/Manager: view overtime balance for any employee.
 */
const getBalanceByUser = async (req, res, next) => {
  try {
    const data = await attendanceService.getOvertimeBalance(req.params.userId);
    res.json(data);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /overtime/compensate
 * Admin/Manager: mark overtime hours as compensated with paid time-off.
 *
 * Body: { userId, periodStart, hours }
 * - userId: employee to compensate
 * - periodStart: 'YYYY-MM-DD' of the OvertimeBalance record
 * - hours: number of hours being offset with time-off
 */
const compensateOvertime = async (req, res, next) => {
  try {
    const { userId, periodStart, hours } = req.body;

    if (!userId || !periodStart || !hours || hours <= 0) {
      return res.status(400).json({ error: 'userId, periodStart si hours sunt obligatorii' });
    }

    const record = await OvertimeBalance.findOne({ where: { userId, periodStart } });
    if (!record) {
      return res.status(404).json({ error: 'Nu exista inregistrare OvertimeBalance pentru aceasta perioada' });
    }

    const available = +record.accumulatedHours - +record.compensatedHours - +record.paidHours;
    if (hours > available) {
      return res.status(400).json({ error: `Nu pot fi compensate mai mult de ${available.toFixed(2)} ore` });
    }

    await record.update({ compensatedHours: +record.compensatedHours + hours });
    res.json({ message: `${hours} ore marcate ca compensate cu timp liber`, record });
  } catch (err) {
    next(err);
  }
};

module.exports = { getMyBalance, getBalanceByUser, compensateOvertime };
