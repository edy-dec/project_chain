const { Salary, User, Attendance, Bonus } = require('../models');
const { Op } = require('sequelize');
const calculationHelper = require('../utils/calculationHelper');

/**
 * PayrollService – Single Responsibility: salary computation and storage.
 * Romanian tax system is applied (CAS 25 %, CASS 10 %, income tax 10 %).
 */
class PayrollService {
  async generateSalary(userId, month, year) {
    const existing = await Salary.findOne({ where: { userId, month, year } });
    if (existing) throw Object.assign(new Error('Salary already generated for this period'), { statusCode: 409 });

    const user = await User.findByPk(userId, {
      include: [{ model: Bonus, as: 'bonuses', where: { isActive: true }, required: false }],
    });
    if (!user) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });

    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().split('T')[0];

    const attendances = await Attendance.findAll({
      where: {
        userId,
        date: { [Op.between]: [start, end] },
        status: { [Op.in]: ['present', 'late', 'half_day'] },
      },
    });

    const workedDays = attendances.length;
    const workedHours = attendances.reduce((s, a) => s + (+a.totalHours || 0), 0);
    const overtimeHours = attendances.reduce((s, a) => s + (+a.overtimeHours || 0), 0);

    const workingDaysInMonth = calculationHelper.getWorkingDaysInMonth(year, month);
    const dailySalary = +user.baseSalary / workingDaysInMonth;
    const earnedBase = dailySalary * workedDays;

    const hourlyRate = +user.hourlyRate || +user.baseSalary / (workingDaysInMonth * 8);
    const overtimePay = overtimeHours * hourlyRate * 1.5;

    const bonusesTotal = calculationHelper.calculateBonuses(user.bonuses || [], earnedBase);
    const grossSalary = earnedBase + overtimePay + bonusesTotal;

    const { taxAmount, socialContributions, netSalary } =
      calculationHelper.calculateRomanianTaxes(grossSalary);

    return Salary.create({
      userId,
      month,
      year,
      baseSalary: +earnedBase.toFixed(2),
      workedDays,
      workedHours: +workedHours.toFixed(2),
      overtimeHours: +overtimeHours.toFixed(2),
      overtimePay: +overtimePay.toFixed(2),
      bonusesTotal: +bonusesTotal.toFixed(2),
      deductions: 0,
      taxAmount: +taxAmount.toFixed(2),
      socialContributions: +socialContributions.toFixed(2),
      grossSalary: +grossSalary.toFixed(2),
      netSalary: +netSalary.toFixed(2),
      status: 'generated',
    });
  }

  async generateAllSalaries(month, year) {
    const employees = await User.findAll({
      where: { status: 'active', role: { [Op.in]: ['employee', 'manager'] } },
      attributes: ['id'],
    });

    const results = [];
    for (const emp of employees) {
      try {
        const salary = await this.generateSalary(emp.id, month, year);
        results.push({ employeeId: emp.id, status: 'success', salary });
      } catch (err) {
        results.push({ employeeId: emp.id, status: 'error', message: err.message });
      }
    }
    return results;
  }

  async getUserSalaries(userId, { year, page = 1, limit = 12 } = {}) {
    const where = { userId };
    if (year) where.year = year;

    const { count, rows } = await Salary.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    return { salaries: rows, total: count };
  }

  async getAllSalaries({ month, year, status, page = 1, limit = 20 } = {}) {
    const where = {};
    if (month) where.month = month;
    if (year) where.year = year;
    if (status) where.status = status;

    const { count, rows } = await Salary.findAndCountAll({
      where,
      include: [{ model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      limit: parseInt(limit),
      offset: (page - 1) * limit,
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    return { salaries: rows, total: count };
  }

  async markAsPaid(salaryId) {
    const salary = await Salary.findByPk(salaryId);
    if (!salary) throw Object.assign(new Error('Salary record not found'), { statusCode: 404 });
    return salary.update({ status: 'paid', paidAt: new Date() });
  }
}

module.exports = new PayrollService();
