const reportService = require('../services/reportService');
const { success } = require('../utils/responseHelper');

const getSummary        = async (req, res, next) => { try { return success(res, { summary: await reportService.getHRSummary(req.query.year, req.query.month) }); } catch (e) { next(e); } };
const getAttendance     = async (req, res, next) => { try { return success(res, { report: await reportService.getAttendanceReport(req.query.year, req.query.month) }); } catch (e) { next(e); } };
const getSalary         = async (req, res, next) => { try { return success(res, await reportService.getSalaryReport(req.query.year, req.query.month)); } catch (e) { next(e); } };
const getDepartments    = async (req, res, next) => { try { return success(res, { stats: await reportService.getDepartmentStats() }); } catch (e) { next(e); } };

module.exports = { getSummary, getAttendance, getSalary, getDepartments };
