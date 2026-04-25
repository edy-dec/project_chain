const settingsService = require('../services/settingsService');
const { success } = require('../utils/responseHelper');

const getSettings = async (_req, res, next) => {
  try {
    return success(res, { settings: await settingsService.getSettings() });
  } catch (e) {
    next(e);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    return success(res, { settings: await settingsService.updateSettings(req.body || {}) }, 'Settings updated');
  } catch (e) {
    next(e);
  }
};

module.exports = { getSettings, updateSettings };