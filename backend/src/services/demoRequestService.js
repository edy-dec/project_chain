const { DemoRequest } = require('../models');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

class DemoRequestService {
  normalizePayload(data = {}) {
    const fullName = String(data.fullName || '').trim();
    if (!fullName) {
      throw Object.assign(new Error('Full name is required'), { statusCode: 400 });
    }

    const company = String(data.company || '').trim();
    if (!company) {
      throw Object.assign(new Error('Company is required'), { statusCode: 400 });
    }

    const email = String(data.email || '').trim().toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      throw Object.assign(new Error('A valid work email is required'), { statusCode: 400 });
    }

    const role = String(data.role || '').trim();
    if (!role) {
      throw Object.assign(new Error('Role is required'), { statusCode: 400 });
    }

    const teamSize = String(data.teamSize || '').trim();
    if (!teamSize) {
      throw Object.assign(new Error('Team size is required'), { statusCode: 400 });
    }

    const focus = String(data.focus || '').trim();
    if (!focus) {
      throw Object.assign(new Error('Demo focus is required'), { statusCode: 400 });
    }

    const phone = String(data.phone || '').trim();

    return {
      fullName,
      company,
      email,
      phone: phone || null,
      role,
      teamSize,
      focus,
    };
  }

  async create(data) {
    const payload = this.normalizePayload(data);
    return DemoRequest.create(payload);
  }

  async findAll({ status } = {}) {
    const where = {};
    if (status && ['new', 'contacted', 'closed'].includes(status)) {
      where.status = status;
    }

    return DemoRequest.findAll({
      where,
      order: [['createdAt', 'DESC']],
    });
  }

  async updateStatus(id, status) {
    const normalizedStatus = String(status || '').trim().toLowerCase();
    if (!['new', 'contacted', 'closed'].includes(normalizedStatus)) {
      throw Object.assign(new Error('Status is invalid'), { statusCode: 400 });
    }

    const demoRequest = await DemoRequest.findByPk(id);
    if (!demoRequest) {
      throw Object.assign(new Error('Demo request not found'), { statusCode: 404 });
    }

    await demoRequest.update({ status: normalizedStatus });
    return demoRequest;
  }
}

module.exports = new DemoRequestService();
