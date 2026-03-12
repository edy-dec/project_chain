const payrollService = require('../services/payrollService');
const { success, paginated } = require('../utils/responseHelper');

const generateSalary = async (req, res, next) => {
  try {
    const salary = await payrollService.generateSalary(req.params.userId, req.body.month, req.body.year);
    return success(res, { salary }, 'Salary generated', 201);
  } catch (e) { next(e); }
};

const generateAll = async (req, res, next) => {
  try {
    const results = await payrollService.generateAllSalaries(req.body.month, req.body.year);
    return success(res, { results }, 'Salaries generation completed');
  } catch (e) { next(e); }
};

const getMySalaries   = async (req, res, next) => { try { const r = await payrollService.getUserSalaries(req.currentUser.id, req.query); return paginated(res, r.salaries, r.total, 1, 1); } catch (e) { next(e); } };
const getUserSalaries = async (req, res, next) => { try { const r = await payrollService.getUserSalaries(req.params.userId, req.query); return paginated(res, r.salaries, r.total, 1, 1); } catch (e) { next(e); } };
const getAllSalaries   = async (req, res, next) => { try { const r = await payrollService.getAllSalaries(req.query); return paginated(res, r.salaries, r.total, 1, 1); } catch (e) { next(e); } };
const markAsPaid      = async (req, res, next) => { try { return success(res, { salary: await payrollService.markAsPaid(req.params.id) }, 'Marked as paid'); } catch (e) { next(e); } };

module.exports = { generateSalary, generateAll, getMySalaries, getUserSalaries, getAllSalaries, markAsPaid };
