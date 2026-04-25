import api from './api';

const demoRequestsAdminService = {
  getAll: (params) => api.get('/demo-requests', { params }),
  updateStatus: (id, status) => api.patch(`/demo-requests/${id}/status`, { status }),
};

export default demoRequestsAdminService;
