import api from './api';

const fieldActivityService = {
  create:      (data)              => api.post('/field-activities', data),
  update:      (id, data)          => api.put(`/field-activities/${id}`, data),
  cancel:      (id)                => api.patch(`/field-activities/${id}/cancel`),
  getById:     (id)                => api.get(`/field-activities/${id}`),
  getMy:       (params)            => api.get('/field-activities/my', { params }),
  getMySummary:(params)            => api.get('/field-activities/my/summary', { params }),
  getAll:      (params)            => api.get('/field-activities', { params }),
  approve:     (id)                => api.patch(`/field-activities/${id}/approve`),
  reject:      (id, reason)        => api.patch(`/field-activities/${id}/reject`, { reason }),
  getSummaryByUser: (userId, params) => api.get(`/field-activities/employee/${userId}/summary`, { params }),
};

export default fieldActivityService;
