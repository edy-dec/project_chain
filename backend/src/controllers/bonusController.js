const bonusService = require('../services/bonusService');
const { success } = require('../utils/responseHelper');

const getAll = async (req, res, next) => {
  try {
    const bonuses = await bonusService.findAll({ activeOnly: req.query.activeOnly === 'true' });
    return success(res, { bonuses });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const bonus = await bonusService.create(req.body);
    return success(res, { bonus }, 'Bonus created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const bonus = await bonusService.update(req.params.id, req.body);
    return success(res, { bonus }, 'Bonus updated successfully');
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const result = await bonusService.delete(req.params.id);
    return success(res, result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create, update, remove };
