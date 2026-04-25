import api from './api';

export const createDemoRequest = async (payload) => {
  const response = await api.post('/demo-requests', payload);
  return response.data;
};
