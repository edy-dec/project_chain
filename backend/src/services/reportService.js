const { User, Attendance, Leave, Salary, Department } = require('../models');
const { Op } = require('sequelize');

class ReportService {
  async getHRSummary(year, month) {
    const [totalEmployees, activeEmployees, pendingLeaves] = await Promise.all([
      User.count(),
      User.count({ where: { status: 'active' } }),
      Leave.count({ where: { status: 'pending' } }),
    ]);

    let monthlyCosts = 0;
    let totalHoursWorked = 0;

    if (year && month) {
      const start = `${year}-${String(month).padStart(2, '0')}-01`;
      const end = new Date(year, month, 0).toISOString().split('T')[0];

      const [salaries, attendances] = await Promise.all([
        Salary.findAll({ where: { month: +month, year: +year }, attributes: ['grossSalary'] }),
        Attendance.findAll({ where: { date: { [Op.between]: [start, end] } }, attributes: ['totalHours'] }),
      ]);

      monthlyCosts = salaries.reduce((s, r) => s + (+r.grossSalary || 0), 0);
      totalHoursWorked = attendances.reduce((s, a) => s + (+a.totalHours || 0), 0);
    }

    return { totalEmployees, activeEmployees, pendingLeaves, monthlyCosts, totalHoursWorked };
  }

  async getAttendanceReport(year, month) {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = new Date(year, month, 0).toISOString().split('T')[0];

    const attendances = await Attendance.findAll({
      where: { date: { [Op.between]: [start, end] } },
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
        byEmployee[empId] = { employee: att.employee, presentDays: 0, lateDays: 0, absentDays: 0, totalHours: 0, overtimeHours: 0 };
      }
      const rec = byEmployee[empId];
      if (att.status === 'present') rec.presentDays++;
      else if (att.status === 'late') { rec.lateDays++; rec.presentDays++; }
      else if (att.status === 'absent') rec.absentDays++;
      rec.totalHours += +att.totalHours || 0;
      rec.overtimeHours += +att.overtimeHours || 0;
    }

    return Object.values(byEmployee);
  }

  async getSalaryReport(year, month) {
    const where = { year: +year };
    if (month) where.month = +month;

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
