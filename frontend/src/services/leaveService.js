import api from './api';

const leaveService = {
  request:        (data)       => api.post('/leaves', data),
  getMyLeaves:    (params)     => api.get('/leaves/my', { params }),
  getMyBalance:   ()           => api.get('/leaves/balance'),
  cancel:         (id)         => api.patch(`/leaves/${id}/cancel`),
  // Admin / Manager
  getAll:         (params)     => api.get('/leaves', { params }),
  getByEmployee:  (userId, p)  => api.get(`/leaves/employee/${userId}`, { params: p }),
  approve:        (id)         => api.patch(`/leaves/${id}/approve`),
  reject:         (id, reason) => api.patch(`/leaves/${id}/reject`, { reason }),
};

export default leaveService;
