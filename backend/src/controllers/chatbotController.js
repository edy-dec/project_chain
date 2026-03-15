const chatbotService = require('../services/chatbotService');
const { success, error } = require('../utils/responseHelper');

const chat = async (req, res, next) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return error(res, 'Chatbot service is not configured', 503);
    }
    const { messages } = req.body;
    if (!Array.isArray(messages) || messages.length === 0) {
      return error(res, 'messages array is required', 400);
    }
    const reply = await chatbotService.chat(req.currentUser.id, messages);
    return success(res, { reply });
  } catch (err) {
    next(err);
  }
};

module.exports = { chat };
