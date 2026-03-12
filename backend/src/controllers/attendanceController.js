const attendanceService = require('../services/attendanceService');
const { success, paginated } = require('../utils/responseHelper');

const checkIn  = async (req, res, next) => { try { return success(res, { attendance: await attendanceService.checkIn(req.currentUser.id) }, 'Checked in'); } catch (e) { next(e); } };
const checkOut = async (req, res, next) => { try { return success(res, { attendance: await attendanceService.checkOut(req.currentUser.id) }, 'Checked out'); } catch (e) { next(e); } };
const getToday = async (req, res, next) => { try { return success(res, { attendance: await attendanceService.getTodayAttendance(req.currentUser.id) }); } catch (e) { next(e); } };

const getHistory = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.currentUser.id;
    const result = await attendanceService.getAttendanceHistory(userId, req.query);
    return paginated(res, result.attendances, result.total, result.page, result.totalPages);
  } catch (e) { next(e); }
};

const getMonthly = async (req, res, next) => {
  try {
    const userId = req.params.userId || req.currentUser.id;
    const { year, month } = req.query;
    const result = await attendanceService.getMonthlyAttendance(userId, year, month);
    return success(res, result);
  } catch (e) { next(e); }
};

const getAll = async (req, res, next) => {
  try {
    const result = await attendanceService.getAllAttendance(req.query);
    return paginated(res, result.attendances, result.total, result.page, result.totalPages);
  } catch (e) { next(e); }
};

const manualEntry = async (req, res, next) => {
  try {
    const attendance = await attendanceService.manualEntry(req.body);
    return success(res, { attendance }, 'Attendance entry saved');
  } catch (e) { next(e); }
};

module.exports = { checkIn, checkOut, getToday, getHistory, getMonthly, getAll, manualEntry };
