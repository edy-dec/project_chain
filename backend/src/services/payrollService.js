const { Salary, User, Attendance, Bonus, Department, OvertimeBalance, TaxRule, LegalHoliday, Leave, sequelize } = require('../models');
const { Op } = require('sequelize');
const calculationHelper = require('../utils/calculationHelper');
const { fetchHolidayDates, getWorkingDaysInMonth } = require('../utils/dateHelper');
const settingsService = require('./settingsService');

/**
 * Loads the active tax rates from TaxRule table for a given date.
 * Falls back to hardcoded Romanian defaults if the table is empty.
 */
async function loadTaxRates(asOfDate) {
  const rules = await TaxRule.findAll({
    where: {
      country: 'RO',
      validFrom: { [Op.lte]: asOfDate },
      [Op.or]: [{ validUntil: null }, { validUntil: { [Op.gte]: asOfDate } }],
    },
  });

  const map = {};
  for (const r of rules) map[r.ruleType] = r;

  return {
    casRate:                   map['cas']?.rate                   ?? 0.25,
    cassRate:                  map['cass']?.rate                  ?? 0.10,
    incomeTaxRate:             map['income_tax']?.rate            ?? 0.10,
    camRate:                   map['cam']?.rate                   ?? 0.0225,
    overtimeMinBonus:          map['overtime_min_bonus']?.rate    ?? 0.75,
    overtimeCompensationDays:  map['overtime_compensation_days']?.amount ?? 90,
    holidayIndemnityMonths:    map['holiday_indemnity_months']?.amount   ?? 3,
    sickEmployerDays:          map['sick_employer_days']?.amount         ?? 5,
    maxHoursDay:               map['max_hours_day']?.amount              ?? 10,
    maxOvertimeHoursWeek:      map['max_overtime_hours_week']?.amount    ?? 8,
    annualMinDays:             map['annual_min_days']?.amount            ?? 20,
  };
}

/**
 * Calculates the average daily gross salary over the last N months before periodStart.
 * Used for holiday indemnity (Codul Muncii art. 150).
 */
async function calcAverageDailyRate(userId, periodStart, months, holidayDates) {
  const refEnd = new Date(periodStart);
  refEnd.setDate(0); // last day of previous month
  const refStart = new Date(refEnd);
  refStart.setMonth(refStart.getMonth() - months + 1);
  refStart.setDate(1);

  const refStartStr = refStart.toISOString().split('T')[0];
  const refEndStr   = refEnd.toISOString().split('T')[0];

  const salaries = await Salary.findAll({
    where: {
      userId,
      status: { [Op.in]: ['generated', 'paid'] },
    },
    order: [['year', 'DESC'], ['month', 'DESC']],
    limit: months,
  });

  if (!salaries.length) return null;

  const totalGross = salaries.reduce((s, sal) => s + +sal.grossSalary, 0);

  let totalWorkDays = 0;
  for (const sal of salaries) {
    const monthHolidays = holidayDates.filter((d) => d.startsWith(`${sal.year}-${String(sal.month).padStart(2, '0')}`));
    totalWorkDays += calculationHelper.getWorkingDaysInMonth(sal.year, sal.month, monthHolidays);
  }

  if (totalWorkDays === 0) return null;
  return totalGross / totalWorkDays;
}

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
    const periodStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const periodEnd   = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const [user, settings, taxRates, holidayDates] = await Promise.all([
      User.findByPk(userId, {
        include: [{ model: Department, as: 'department', attributes: ['id', 'name'], required: false }],
      }),
      settingsService.getSettings(),
      loadTaxRates(periodStart),
      fetchHolidayDates(LegalHoliday, year),
    ]);

    if (!user) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });

    const workingDaysInMonth = calculationHelper.getWorkingDaysInMonth(year, month, holidayDates);

    // --- Attendance for the period ---
    const attendances = await Attendance.findAll({
      where: {
        userId,
        date: { [Op.between]: [periodStart, periodEnd] },
        status: { [Op.in]: ['present', 'late', 'half_day'] },
      },
    });

    const trackedWorkedDays = attendances.reduce((sum, a) => {
      if (a.status === 'half_day') return sum + 0.5;
      return sum + 1;
    }, 0);
    const workedDays  = Math.min(workingDaysInMonth, trackedWorkedDays);
    const workedHours = attendances.reduce((s, a) => s + (+a.totalHours || 0), 0);

    // --- Overtime: only expired uncompensated hours (art. 122) ---
    const expiredOvertimeRecords = await OvertimeBalance.findAll({
      where: {
        userId,
        expirationDate: { [Op.lte]: periodEnd },
        [Op.and]: sequelize.literal('"OvertimeBalance"."paid_hours" < ("OvertimeBalance"."accumulated_hours" - "OvertimeBalance"."compensated_hours")'),
      },
    });

    let overtimeHoursToPay = 0;
    for (const rec of expiredOvertimeRecords) {
      const unpaid = +rec.accumulatedHours - +rec.compensatedHours - +rec.paidHours;
      if (unpaid > 0) overtimeHoursToPay += unpaid;
    }

    const earnedBase  = +user.baseSalary || 0;
    const hourlyRate  = +user.hourlyRate || earnedBase / (workingDaysInMonth * 8);
    // Codul Muncii art. 123: minim 75% spor pentru ore suplimentare necompensate
    const overtimePay = overtimeHoursToPay * hourlyRate * (1 + taxRates.overtimeMinBonus);

    // --- Bonuses ---
    const availableBonuses = await Bonus.findAll({
      where: { [Op.or]: [{ userId }, { userId: null }] },
      order: [['createdAt', 'DESC']],
    });
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
      periodStart,
      periodEnd,
    });

    // --- Holiday indemnity (Codul Muncii art. 150) ---
    // Applies only if the employee has approved annual leave in this period.
    const approvedAnnualLeave = await Leave.findAll({
      where: {
        userId,
        type: 'annual',
        status: 'approved',
        startDate: { [Op.lte]: periodEnd },
        endDate:   { [Op.gte]: periodStart },
      },
    });

    let holidayIndemnity = 0;
    let holidayDaysCount = 0;
    if (approvedAnnualLeave.length) {
      holidayDaysCount = approvedAnnualLeave.reduce((s, l) => s + l.days, 0);
      const avgDaily = await calcAverageDailyRate(
        userId, periodStart, taxRates.holidayIndemnityMonths, holidayDates
      );
      if (avgDaily) {
        holidayIndemnity = avgDaily * holidayDaysCount;
      }
    }

    const grossSalary = earnedBase + overtimePay + bonusesTotal + holidayIndemnity;

    const { casAmount, cassAmount, socialContributions, taxAmount, camAmount, netSalary } =
      calculationHelper.calculateRomanianTaxes(grossSalary, taxRates, user.fiscalExemption);

    return {
      userId,
      month,
      year,
      baseSalary:          +earnedBase.toFixed(2),
      workedDays,
      workedHours:         +workedHours.toFixed(2),
      overtimeHours:       +overtimeHoursToPay.toFixed(2),
      overtimePay:         +overtimePay.toFixed(2),
      bonusesTotal:        +bonusesTotal.toFixed(2),
      holidayIndemnity:    +holidayIndemnity.toFixed(2),
      holidayDays:         holidayDaysCount,
      deductions:          0,
      casAmount,
      cassAmount,
      socialContributions,
      taxAmount,
      camAmount,
      grossSalary:         +grossSalary.toFixed(2),
      netSalary,
      status:              'generated',
    };
  }

  /**
   * After generating salary, marks the expired OvertimeBalance records as paid.
   * Must be called within the same transaction or right after successful salary creation.
   */
  async markOvertimeAsPaid(userId, periodEnd) {
    const expiredRecords = await OvertimeBalance.findAll({
      where: {
        userId,
        expirationDate: { [Op.lte]: periodEnd },
        [Op.and]: sequelize.literal('"OvertimeBalance"."paid_hours" < ("OvertimeBalance"."accumulated_hours" - "OvertimeBalance"."compensated_hours")'),
      },
    });
    for (const rec of expiredRecords) {
      const unpaid = +rec.accumulatedHours - +rec.compensatedHours - +rec.paidHours;
      if (unpaid > 0) {
        await rec.update({ paidHours: +rec.paidHours + unpaid });
      }
    }
  }

  async generateSalary(userId, month, year) {
    ({ month, year } = this.normalizePeriod(month, year));
    const existing = await Salary.findOne({ where: { userId, month, year } });
    if (existing) throw Object.assign(new Error('Salary already generated for this period'), { statusCode: 409 });

    const payload = await this.buildSalaryPayload(userId, month, year);
    const salary = await Salary.create(payload);

    const periodEnd = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    await this.markOvertimeAsPaid(userId, periodEnd);

    return salary;
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
    const periodEnd = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

    const employees = await User.findAll({
      where: { status: 'active', role: { [Op.in]: ['employee', 'manager'] } },
      attributes: ['id'],
    });

    const summary = { month, year, employees: employees.length, generated: 0, paidNow: 0, alreadyPaid: 0, errors: [] };

    for (const emp of employees) {
      try {
        let salary = await Salary.findOne({ where: { userId: emp.id, month, year } });

        if (!salary) {
          salary = await this.generateSalary(emp.id, month, year);
          summary.generated += 1;
        }

        const recalculated = await this.buildSalaryPayload(emp.id, month, year);

        if (salary.status === 'paid') {
          await salary.update({ ...recalculated, status: 'paid', paidAt: salary.paidAt || new Date() });
          summary.alreadyPaid += 1;
          continue;
        }

        await salary.update({ ...recalculated, status: 'paid', paidAt: new Date() });
        await this.markOvertimeAsPaid(emp.id, periodEnd);
        summary.paidNow += 1;
      } catch (err) {
        summary.errors.push({ employeeId: emp.id, message: err.message });
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
