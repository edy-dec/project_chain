const svc = require('../services/fieldActivityService');
const { success, paginated } = require('../utils/responseHelper');

const create = async (req, res, next) => {
  try {
    const activity = await svc.create(req.currentUser.id, req.body);
    return success(res, { activity }, 'Activitate inregistrata', 201);
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    const activity = await svc.update(req.params.id, req.currentUser.id, req.body);
    return success(res, { activity }, 'Activitate actualizata');
  } catch (e) { next(e); }
};

const cancel = async (req, res, next) => {
  try {
    const activity = await svc.cancel(req.params.id, req.currentUser.id);
    return success(res, { activity }, 'Activitate anulata');
  } catch (e) { next(e); }
};

const getMyActivities = async (req, res, next) => {
  try {
    const result = await svc.getMyActivities(req.currentUser.id, req.query);
    return paginated(res, result.activities, result.total, result.page, result.totalPages);
  } catch (e) { next(e); }
};

const getMySummary = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const summary = await svc.getMonthlySummary(req.currentUser.id, +year, +month);
    return success(res, { summary });
  } catch (e) { next(e); }
};

const getById = async (req, res, next) => {
  try {
    const activity = await svc.getById(req.params.id);
    if (!activity) return res.status(404).json({ error: 'Nu a fost gasita' });
    return success(res, { activity });
  } catch (e) { next(e); }
};

// Admin / Manager
const getAll = async (req, res, next) => {
  try {
    const result = await svc.getAllActivities(req.query);
    return paginated(res, result.activities, result.total, result.page, result.totalPages);
  } catch (e) { next(e); }
};

const getSummaryByUser = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const summary = await svc.getMonthlySummary(req.params.userId, +year, +month);
    return success(res, { summary });
  } catch (e) { next(e); }
};

const approve = async (req, res, next) => {
  try {
    const activity = await svc.resolve(req.params.id, req.currentUser.id, true);
    return success(res, { activity }, 'Activitate aprobata');
  } catch (e) { next(e); }
};

const reject = async (req, res, next) => {
  try {
    const activity = await svc.resolve(req.params.id, req.currentUser.id, false, req.body.reason);
    return success(res, { activity }, 'Activitate respinsa');
  } catch (e) { next(e); }
};

module.exports = {
  create, update, cancel,
  getMyActivities, getMySummary, getById,
  getAll, getSummaryByUser, approve, reject,
};
