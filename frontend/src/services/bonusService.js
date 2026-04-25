import api from './api';

const bonusService = {
  getAll: (params) => api.get('/bonuses', { params }),
  create: (data) => api.post('/bonuses', data),
  update: (id, data) => api.put(`/bonuses/${id}`, data),
  delete: (id) => api.delete(`/bonuses/${id}`),
};

export default bonusService;
