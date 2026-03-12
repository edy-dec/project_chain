const leaveService = require('../services/leaveService');
const { success, paginated } = require('../utils/responseHelper');

const requestLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.requestLeave(req.currentUser.id, req.body);
    return success(res, { leave }, 'Leave request submitted', 201);
  } catch (e) { next(e); }
};

const approveLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.resolveLeave(req.params.id, req.currentUser.id, true);
    return success(res, { leave }, 'Leave approved');
  } catch (e) { next(e); }
};

const rejectLeave = async (req, res, next) => {
  try {
    const leave = await leaveService.resolveLeave(req.params.id, req.currentUser.id, false, req.body.reason);
    return success(res, { leave }, 'Leave rejected');
  } catch (e) { next(e); }
};

const cancelLeave  = async (req, res, next) => { try { return success(res, { leave: await leaveService.cancelLeave(req.params.id, req.currentUser.id) }, 'Leave cancelled'); } catch (e) { next(e); } };
const getMyBalance = async (req, res, next) => { try { return success(res, { balance: await leaveService.getLeaveBalance(req.currentUser.id) }); } catch (e) { next(e); } };

const getMyLeaves = async (req, res, next) => {
  try {
    const result = await leaveService.getUserLeaves(req.currentUser.id, req.query);
    return paginated(res, result.leaves, result.total, result.page, result.totalPages);
  } catch (e) { next(e); }
};

const getUserLeaves = async (req, res, next) => {
  try {
    const result = await leaveService.getUserLeaves(req.params.userId, req.query);
    return paginated(res, result.leaves, result.total, result.page, result.totalPages);
  } catch (e) { next(e); }
};

const getAllLeaves = async (req, res, next) => {
  try {
    const result = await leaveService.getAllLeaves(req.query);
    return paginated(res, result.leaves, result.total, result.page, result.totalPages);
  } catch (e) { next(e); }
};

module.exports = { requestLeave, approveLeave, rejectLeave, cancelLeave, getMyLeaves, getUserLeaves, getAllLeaves, getMyBalance };
