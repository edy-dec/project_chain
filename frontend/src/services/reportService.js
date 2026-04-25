import api from './api';

const reportService = {
  getSummary:     (params) => api.get('/reports/summary', { params }),
  getAttendance:  (params) => api.get('/reports/attendance', { params }),
  getSalary:      (params) => api.get('/reports/salary', { params }),
  getDepartments: ()            => api.get('/reports/departments'),
};

export default reportService;
