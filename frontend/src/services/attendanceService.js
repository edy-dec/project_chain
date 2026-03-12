import api from './api';

const attendanceService = {
  checkIn:         ()                        => api.post('/attendance/check-in'),
  checkOut:        ()                        => api.post('/attendance/check-out'),
  getToday:        ()                        => api.get('/attendance/today'),
  getMyHistory:    (params)                  => api.get('/attendance/my-history', { params }),
  getMyMonthly:    (year, month)             => api.get('/attendance/my-monthly', { params: { year, month } }),
  // Admin / Manager
  getAll:          (params)                  => api.get('/attendance', { params }),
  getByEmployee:   (userId, params)          => api.get(`/attendance/employee/${userId}`, { params }),
  getMonthly:      (userId, year, month)     => api.get(`/attendance/employee/${userId}/monthly`, { params: { year, month } }),
  manualEntry:     (data)                    => api.post('/attendance/manual', data),
};

export default attendanceService;
