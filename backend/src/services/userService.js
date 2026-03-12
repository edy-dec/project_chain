const { User, Department, Shift, Bonus } = require('../models');
const { Op } = require('sequelize');

class UserService {
  /**
   * Paginated list with optional filters.
   */
  async findAll({ page = 1, limit = 10, search, role, departmentId, status } = {}) {
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (role) where.role = role;
    if (departmentId) where.departmentId = departmentId;
    if (status) where.status = status;

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'color'] },
        { model: Shift, as: 'shift', attributes: ['id', 'name', 'startTime', 'endTime'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['auth0Id'] },
    });

    return {
      employees: rows,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
    };
  }

  async findById(id) {
    const user = await User.findByPk(id, {
      include: [
        { model: Department, as: 'department' },
        { model: Shift, as: 'shift' },
        { model: Bonus, as: 'bonuses', where: { isActive: true }, required: false },
      ],
    });
    if (!user) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
    return user;
  }

  async findByAuth0Id(auth0Id) {
    return User.findOne({
      where: { auth0Id },
      include: [
        { model: Department, as: 'department', attributes: ['id', 'name', 'color'] },
        { model: Shift, as: 'shift', attributes: ['id', 'name', 'startTime', 'endTime'] },
      ],
    });
  }

  async create(data) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw Object.assign(new Error('Email already in use'), { statusCode: 409 });
    return User.create(data);
  }

  async update(id, data) {
    const user = await User.findByPk(id);
    if (!user) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
    // Prevent role escalation by non-admin callers is enforced at middleware level
    return user.update(data);
  }

  async delete(id) {
    const user = await User.findByPk(id);
    if (!user) throw Object.assign(new Error('Employee not found'), { statusCode: 404 });
    await user.update({ status: 'inactive' });
    return { message: 'Employee deactivated successfully' };
  }

  /**
   * First-login sync: create a User row from Auth0 payload if it doesn't exist yet.
   * If a user with the same email already exists (created manually), link the auth0Id.
   */
  async syncAuth0User(auth0Id, email, name) {
    // 1. Caută după auth0Id
    let user = await this.findByAuth0Id(auth0Id);

    if (!user) {
      // 2. Caută după email (user creat manual fără auth0Id)
      user = await User.findOne({ where: { email } });

      if (user) {
        // Leagă auth0Id-ul de userul existent, păstrând rolul
        await user.update({ auth0Id });
      } else {
        // 3. Creează user nou
        const [firstName, ...rest] = (name || '').split(' ');
        user = await User.create({
          auth0Id,
          email,
          firstName: firstName || email.split('@')[0],
          lastName: rest.join(' ') || '-',
          role: 'employee',
          baseSalary: 0,
          hireDate: new Date(),
        });
      }
    }
    return user;
  }
}

module.exports = new UserService();
