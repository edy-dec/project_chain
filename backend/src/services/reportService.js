const { User, Attendance, Leave, Salary, Department } = require('../models');
const { Op } = require('sequelize');

class ReportService {
  normalizeDateRange({ year, month, dateFrom, dateTo } = {}) {
    if (dateFrom || dateTo) {
      const start = String(dateFrom || '').slice(0, 10);
      const end = String(dateTo || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
        throw Object.assign(new Error('dateFrom and dateTo must use YYYY-MM-DD format'), { statusCode: 400 });
      }
      if (start > end) {
        throw Object.assign(new Error('dateFrom must be on or before dateTo'), { statusCode: 400 });
      }
      return {
        start,
        end,
        startYear: Number(start.slice(0, 4)),
        startMonth: Number(start.slice(5, 7)),
        endYear: Number(end.slice(0, 4)),
        endMonth: Number(end.slice(5, 7)),
      };
    }

    const parsedYear = Number(year);
    const parsedMonth = Number(month);
    if (!Number.isInteger(parsedYear) || !Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
      throw Object.assign(new Error('year and month are required when dateFrom/dateTo are missing'), { statusCode: 400 });
    }

    const start = `${parsedYear}-${String(parsedMonth).padStart(2, '0')}-01`;
    const end = new Date(parsedYear, parsedMonth, 0).toISOString().split('T')[0];
    return {
      start,
      end,
      startYear: parsedYear,
      startMonth: parsedMonth,
      endYear: parsedYear,
      endMonth: parsedMonth,
    };
  }

  buildSalaryRangeWhere(range) {
    const { startYear, startMonth, endYear, endMonth } = range;

    if (startYear === endYear && startMonth === endMonth) {
      return { year: startYear, month: startMonth };
    }

    return {
      [Op.and]: [
        {
          [Op.or]: [
            { year: { [Op.gt]: startYear } },
            { year: startYear, month: { [Op.gte]: startMonth } },
          ],
        },
        {
          [Op.or]: [
            { year: { [Op.lt]: endYear } },
            { year: endYear, month: { [Op.lte]: endMonth } },
          ],
        },
      ],
    };
  }

  async getHRSummary(year, month, dateFrom, dateTo) {
    const range = year && month || dateFrom && dateTo
      ? this.normalizeDateRange({ year, month, dateFrom, dateTo })
      : null;

    const [totalEmployees, activeEmployees, pendingLeaves] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      Leave.count({ where: { status: 'pending' } }),
    ]);

    let monthlyCosts = 0;
    let totalHoursWorked = 0;

    if (range) {
      const [salaries, attendances] = await Promise.all([
        Salary.findAll({ where: this.buildSalaryRangeWhere(range), attributes: ['grossSalary'] }),
        Attendance.findAll({ where: { date: { [Op.between]: [range.start, range.end] } }, attributes: ['totalHours'] }),
      ]);

      monthlyCosts = salaries.reduce((s, r) => s + (+r.grossSalary || 0), 0);
      totalHoursWorked = attendances.reduce((s, a) => s + (+a.totalHours || 0), 0);
    }

    return { totalEmployees, activeEmployees, pendingLeaves, monthlyCosts, totalHoursWorked };
  }

  async getAttendanceReport({ year, month, dateFrom, dateTo } = {}) {
    const range = this.normalizeDateRange({ year, month, dateFrom, dateTo });

    const attendances = await Attendance.findAll({
      where: { date: { [Op.between]: [range.start, range.end] } },
      include: [{
        model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName'],
        include: [{ model: Department, as: 'department', attributes: ['name', 'color'] }],
      }],
      order: [['date', 'ASC']],
    });

    const byEmployee = {};
    for (const att of attendances) {
      const empId = att.employee?.id;
      if (!empId) continue;
      if (!byEmployee[empId]) {
        byEmployee[empId] = {
          employee: att.employee,
          presentDays: 0,
          lateDays: 0,
          absentDays: 0,
          totalHours: 0,
          overtimeHours: 0,
          activityByDate: {},
        };
      }
      const rec = byEmployee[empId];
      if (att.status === 'present') rec.presentDays++;
      else if (att.status === 'late') { rec.lateDays++; rec.presentDays++; }
      else if (att.status === 'half_day') rec.presentDays += 0.5;
      else if (att.status === 'absent') rec.absentDays++;
      rec.totalHours += +att.totalHours || 0;
      rec.overtimeHours += +att.overtimeHours || 0;

      const dateKey = String(att.date).slice(0, 10);
      if (!rec.activityByDate[dateKey]) {
        rec.activityByDate[dateKey] = {
          status: att.status,
          totalHours: 0,
          overtimeHours: 0,
        };
      }
      rec.activityByDate[dateKey].status = att.status;
      rec.activityByDate[dateKey].totalHours += +att.totalHours || 0;
      rec.activityByDate[dateKey].overtimeHours += +att.overtimeHours || 0;
    }

    return Object.values(byEmployee);
  }

  async getSalaryReport({ year, month, dateFrom, dateTo } = {}) {
    const range = this.normalizeDateRange({ year, month, dateFrom, dateTo });
    const where = this.buildSalaryRangeWhere(range);

    const salaries = await Salary.findAll({
      where,
      include: [{
        model: User, as: 'employee', attributes: ['id', 'firstName', 'lastName'],
        include: [{ model: Department, as: 'department', attributes: ['name'] }],
      }],
      order: [['year', 'DESC'], ['month', 'DESC']],
    });

    const totalGross = salaries.reduce((s, r) => s + (+r.grossSalary || 0), 0);
    const totalNet = salaries.reduce((s, r) => s + (+r.netSalary || 0), 0);
    const totalTax = salaries.reduce((s, r) => s + (+r.taxAmount || 0), 0);

    return { salaries, summary: { totalGross: +totalGross.toFixed(2), totalNet: +totalNet.toFixed(2), totalTax: +totalTax.toFixed(2) } };
  }

  async getDepartmentStats() {
    const departments = await Department.findAll({
      include: [{ model: User, as: 'employees', attributes: ['id', 'status', 'baseSalary'] }],
    });

    return departments.map((d) => ({
      id: d.id,
      name: d.name,
      color: d.color,
      totalEmployees: d.employees.length,
      activeEmployees: d.employees.filter((e) => e.status === 'active').length,
      avgSalary:
        d.employees.length > 0
          ? +(d.employees.reduce((s, e) => s + (+e.baseSalary || 0), 0) / d.employees.length).toFixed(2)
          : 0,
    }));
  }
}

module.exports = new ReportService();
