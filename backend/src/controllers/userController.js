const userService = require('../services/userService');
const { success, paginated } = require('../utils/responseHelper');

const getAll = async (req, res, next) => {
  try {
    const result = await userService.findAll(req.query);
    return paginated(res, result.employees, result.total, result.page, result.totalPages);
  } catch (err) { next(err); }
};

const getById = async (req, res, next) => {
  try {
    const employee = await userService.findById(req.params.id);
    return success(res, { employee });
  } catch (err) { next(err); }
};

const create = async (req, res, next) => {
  try {
    const employee = await userService.create(req.body);
    return success(res, { employee }, 'Employee created successfully', 201);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const employee = await userService.update(req.params.id, req.body);
    return success(res, { employee }, 'Employee updated successfully');
  } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
  try {
    const result = await userService.delete(req.params.id);
    return success(res, result);
  } catch (err) { next(err); }
};

module.exports = { getAll, getById, create, update, remove };
