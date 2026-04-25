const { Salary, User, Attendance, Bonus, Department } = require('../models');
const { Op } = require('sequelize');
const calculationHelper = require('../utils/calculationHelper');
const settingsService = require('./settingsService');

/**
 * PayrollService – Single Responsibility: salary computation and storage.
 * Romanian tax system is applied (CAS 25 %, CASS 10 %, income tax 10 %).
 */
class PayrollService {
  normalizePeriod(month, year) {
    const parsedMonth = Number(month);
    const parsedYear = Number(year);
    if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      throw Object.assign(new Error('Month must be an integer between 1 and 12'), { statusCode: 400 });
    }
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 2100) {
      throw Object.assign(new Error('Year must be a valid 4-digit year'), { statusCode: 400 });
    }
    return { month: parsedMonth, year: parsedYear };
  }

  async buildSalaryPayload(userId, month, year) {
    const [user, settings] = await Promise.all([
      User.findByPk(userId, {
        include: [
          { model: Department, as: 'department', attributes: ['id', 'name'], required: false },
        ],
      }),
      settingsService.getSettings(),
    ]);
    if (!user) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });

    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const availableBonuses = await Bonus.findAll({
      where: {
        [Op.or]: [
          { userId },
          { userId: null },
        ],
      },
      order: [['createdAt', 'DESC']],
    });

    const attendances = await Attendance.findAll({
      where: {
        userId,
        date: { [Op.between]: [start, end] },
        status: { [Op.in]: ['present', 'late', 'half_day'] },
      },
    });

    const workingDaysInMonth = calculationHelper.getWorkingDaysInMonth(year, month);

    const trackedWorkedDays = attendances.reduce((sum, a) => {
      if (a.status === 'half_day') return sum + 0.5;
      return sum + 1;
    }, 0);

    const workedDays = Math.min(workingDaysInMonth, trackedWorkedDays);
    const workedHours = attendances.reduce((s, a) => s + (+a.totalHours || 0), 0);

    const overtimeHours = attendances.reduce((s, a) => s + (+a.overtimeHours || 0), 0);

    const earnedBase = +user.baseSalary || 0;

    const hourlyRate = +user.hourlyRate || +user.baseSalary / (workingDaysInMonth * 8);
    const overtimePay = overtimeHours * hourlyRate * 1.5;

    const overrides = settings?.bonusOverrides?.[userId] || {};
    const effectiveBonuses = availableBonuses.map((bonus) => {
      const override = overrides[bonus.id] || 'inherit';
      const raw = bonus.toJSON();
      if (override === 'enabled') return { ...raw, isActive: true };
      if (override === 'disabled') return { ...raw, isActive: false };
      return raw;
    });

    const bonusesTotal = calculationHelper.calculateBonuses(effectiveBonuses, earnedBase, {
      employeeDepartment: user.department?.name || null,
      periodStart: start,
      periodEnd: end,
    });
    const grossSalary = earnedBase + overtimePay + bonusesTotal;

    const { taxAmount, socialContributions, netSalary } =
      calculationHelper.calculateRomanianTaxes(grossSalary);

    return {
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
    };
  }

  async generateSalary(userId, month, year) {
    ({ month, year } = this.normalizePeriod(month, year));
    const existing = await Salary.findOne({ where: { userId, month, year } });
    if (existing) throw Object.assign(new Error('Salary already generated for this period'), { statusCode: 409 });

    const payload = await this.buildSalaryPayload(userId, month, year);
    return Salary.create(payload);
  }

  async generateAllSalaries(month, year) {
    ({ month, year } = this.normalizePeriod(month, year));
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

  async payAllSalaries(month, year) {
    ({ month, year } = this.normalizePeriod(month, year));
    const employees = await User.findAll({
      where: { status: 'active', role: { [Op.in]: ['employee', 'manager'] } },
      attributes: ['id'],
    });

    const summary = {
      month,
      year,
      employees: employees.length,
      generated: 0,
      paidNow: 0,
      alreadyPaid: 0,
      errors: [],
    };

    for (const emp of employees) {
      try {
        let salary = await Salary.findOne({ where: { userId: emp.id, month, year } });

        if (!salary) {
          salary = await this.generateSalary(emp.id, month, year);
          summary.generated += 1;
        }

        const recalculated = await this.buildSalaryPayload(emp.id, month, year);

        if (salary.status === 'paid') {
          await salary.update({
            ...recalculated,
            status: 'paid',
            paidAt: salary.paidAt || new Date(),
          });
          summary.alreadyPaid += 1;
          continue;
        }

        await salary.update({
          ...recalculated,
          status: 'paid',
          paidAt: new Date(),
        });
        summary.paidNow += 1;
      } catch (err) {
        summary.errors.push({
          employeeId: emp.id,
          message: err.message,
        });
      }
    }

    return summary;
  }

  async getUserSalaries(userId, { year, page = 1, limit = 12 } = {}) {
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 12;
    const where = { userId };
    if (year) where.year = year;

    const { count, rows } = await Salary.findAndCountAll({
      where,
      limit,
      offset: (page - 1) * limit,
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    return { salaries: rows, total: count, page, totalPages: Math.max(1, Math.ceil(count / limit)) };
  }

  async getAllSalaries({ month, year, status, page = 1, limit = 20 } = {}) {
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 20;
    const where = {};
    if (month) where.month = month;
    if (year) where.year = year;
    if (status) where.status = status;

    const { count, rows } = await Salary.findAndCountAll({
      where,
      include: [{ model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      limit,
      offset: (page - 1) * limit,
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    return { salaries: rows, total: count, page, totalPages: Math.max(1, Math.ceil(count / limit)) };
  }

  async markAsPaid(salaryId) {
    const salary = await Salary.findByPk(salaryId);
    if (!salary) throw Object.assign(new Error('Salary record not found'), { statusCode: 404 });
    return salary.update({ status: 'paid', paidAt: new Date() });
  }
}

module.exports = new PayrollService();
