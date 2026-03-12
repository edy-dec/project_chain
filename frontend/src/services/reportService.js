import api from './api';

const reportService = {
  getSummary:     (year, month) => api.get('/reports/summary', { params: { year, month } }),
  getAttendance:  (year, month) => api.get('/reports/attendance', { params: { year, month } }),
  getSalary:      (year, month) => api.get('/reports/salary', { params: { year, month } }),
  getDepartments: ()            => api.get('/reports/departments'),
};

export default reportService;
