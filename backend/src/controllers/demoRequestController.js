const demoRequestService = require('../services/demoRequestService');
const { success } = require('../utils/responseHelper');

const getAll = async (req, res, next) => {
  try {
    const demoRequests = await demoRequestService.findAll({ status: req.query?.status });
    return success(res, { demoRequests });
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const demoRequest = await demoRequestService.create(req.body || {});
    return success(res, { demoRequest }, 'Demo request submitted', 201);
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const demoRequest = await demoRequestService.updateStatus(req.params.id, req.body?.status);
    return success(res, { demoRequest }, 'Demo request updated');
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, create, updateStatus };
