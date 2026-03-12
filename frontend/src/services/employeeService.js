import api from './api';

const employeeService = {
  getAll:    (params) => api.get('/employees', { params }),
  getById:   (id)     => api.get(`/employees/${id}`),
  create:    (data)   => api.post('/employees', data),
  update:    (id, d)  => api.put(`/employees/${id}`, d),
  delete:    (id)     => api.delete(`/employees/${id}`),
};

export default employeeService;
