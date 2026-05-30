const attendanceService = require('../services/attendanceService');
const { success, paginated } = require('../utils/responseHelper');

// In rutele de admin folosim `userId`, iar in cele personale userul curent.
const getTargetUserId = (req) => req.params.userId || req.currentUser.id;

const checkIn = async (req, res, next) => {
  try {
    const attendance = await attendanceService.checkIn(req.currentUser.id);
    return success(res, { attendance }, 'Checked in');
  } catch (err) {
    return next(err);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const attendance = await attendanceService.checkOut(req.currentUser.id);
    return success(res, { attendance }, 'Checked out');
  } catch (err) {
    return next(err);
  }
};

const getToday = async (req, res, next) => {
  try {
    const attendance = await attendanceService.getTodayAttendance(req.currentUser.id);
    return success(res, { attendance });
  } catch (err) {
    return next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const userId = getTargetUserId(req);
    const result = await attendanceService.getAttendanceHistory(userId, req.query);

    return paginated(res, result.attendances, result.total, result.page, result.totalPages);
  } catch (err) {
    return next(err);
  }
};

const getMonthly = async (req, res, next) => {
  try {
    const userId = getTargetUserId(req);
    const { year, month } = req.query;
    const result = await attendanceService.getMonthlyAttendance(userId, year, month);

    return success(res, result);
  } catch (err) {
    return next(err);
  }
};

const getAll = async (req, res, next) => {
  try {
    const result = await attendanceService.getAllAttendance(req.query);
    return paginated(res, result.attendances, result.total, result.page, result.totalPages);
  } catch (err) {
    return next(err);
  }
};

const manualEntry = async (req, res, next) => {
  try {
    const attendance = await attendanceService.manualEntry(req.body);
    return success(res, { attendance }, 'Attendance entry saved');
  } catch (err) {
    return next(err);
  }
};

module.exports = { checkIn, checkOut, getToday, getHistory, getMonthly, getAll, manualEntry };
