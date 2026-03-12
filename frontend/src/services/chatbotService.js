import api from './api';

const chatbotService = {
  chat: (messages) => api.post('/chatbot/chat', { messages }),
};

export default chatbotService;
