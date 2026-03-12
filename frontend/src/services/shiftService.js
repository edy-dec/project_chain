import api from './api';

const shiftService = {
  getAll:    (departmentId) => api.get('/shifts', { params: departmentId ? { departmentId } : {} }),
  getById:   (id)           => api.get(`/shifts/${id}`),
  create:    (data)         => api.post('/shifts', data),
  update:    (id, data)     => api.put(`/shifts/${id}`, data),
  delete:    (id)           => api.delete(`/shifts/${id}`),
  assign:    (userId, shiftId) => api.post('/shifts/assign', { userId, shiftId }),
};

export default shiftService;
