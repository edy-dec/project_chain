const newsletterService = require('../services/newsletterService');
const { success } = require('../utils/responseHelper');

const subscribe = async (req, res, next) => {
  try {
    const email = req.body?.email;
    const result = await newsletterService.subscribe(email);
    return success(res, result, 'Subscription confirmed');
  } catch (error) {
    next(error);
  }
};

module.exports = { subscribe };
