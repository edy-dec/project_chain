const shiftService = require('../services/shiftService');
const { success } = require('../utils/responseHelper');

const getAll  = async (req, res, next) => { try { return success(res, { shifts: await shiftService.findAll(req.query.departmentId) }); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { return success(res, { shift: await shiftService.findById(req.params.id) }); } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { return success(res, { shift: await shiftService.create(req.body) }, 'Shift created', 201); } catch (e) { next(e); } };
const update  = async (req, res, next) => { try { return success(res, { shift: await shiftService.update(req.params.id, req.body) }, 'Shift updated'); } catch (e) { next(e); } };
const remove  = async (req, res, next) => { try { await shiftService.delete(req.params.id); return success(res, null, 'Shift deleted'); } catch (e) { next(e); } };
const assign  = async (req, res, next) => { try { return success(res, { user: await shiftService.assignShift(req.body.userId, req.body.shiftId) }, 'Shift assigned'); } catch (e) { next(e); } };

module.exports = { getAll, getById, create, update, remove, assign };
