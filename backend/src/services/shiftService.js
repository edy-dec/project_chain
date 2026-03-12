const { Shift, Department, User } = require('../models');

class ShiftService {
  async findAll(departmentId) {
    const where = { isActive: true };
    if (departmentId) where.departmentId = departmentId;
    return Shift.findAll({
      where,
      include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'color'] }],
      order: [['name', 'ASC']],
    });
  }

  async findById(id) {
    const shift = await Shift.findByPk(id, {
      include: [
        { model: Department, as: 'department' },
        { model: User, as: 'employees', attributes: ['id', 'firstName', 'lastName'], required: false },
      ],
    });
    if (!shift) throw Object.assign(new Error('Shift not found'), { statusCode: 404 });
    return shift;
  }

  async create(data) {
    return Shift.create(data);
  }

  async update(id, data) {
    const shift = await Shift.findByPk(id);
    if (!shift) throw Object.assign(new Error('Shift not found'), { statusCode: 404 });
    return shift.update(data);
  }

  async delete(id) {
    const shift = await Shift.findByPk(id);
    if (!shift) throw Object.assign(new Error('Shift not found'), { statusCode: 404 });
    const count = await User.count({ where: { shiftId: id } });
    if (count > 0) throw Object.assign(new Error('Cannot delete a shift with assigned employees'), { statusCode: 409 });
    return shift.update({ isActive: false });
  }

  async assignShift(userId, shiftId) {
    const [user, shift] = await Promise.all([User.findByPk(userId), Shift.findByPk(shiftId)]);
    if (!user) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
    if (!shift) throw Object.assign(new Error('Shift not found'), { statusCode: 404 });
    return user.update({ shiftId });
  }
}

module.exports = new ShiftService();
