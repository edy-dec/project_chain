import api from './api';

export const subscribeToNewsletter = async (email) => {
  const response = await api.post('/newsletter/subscribe', { email });
  return response.data;
};
