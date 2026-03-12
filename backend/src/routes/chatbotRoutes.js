const express = require('express');
const { chat } = require('../controllers/chatbotController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(checkJwt, attachUser);

router.post('/chat', chat);

module.exports = router;
