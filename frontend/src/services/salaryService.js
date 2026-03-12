import api from './api';

const salaryService = {
  getMySalaries:    (params)          => api.get('/salary/my', { params }),
  // Admin
  getAll:           (params)          => api.get('/salary', { params }),
  getByEmployee:    (userId, params)  => api.get(`/salary/employee/${userId}`, { params }),
  generate:         (userId, data)    => api.post(`/salary/generate/${userId}`, data),
  generateAll:      (data)            => api.post('/salary/generate-all', data),
  markAsPaid:       (id)              => api.patch(`/salary/${id}/paid`),
};

export default salaryService;
