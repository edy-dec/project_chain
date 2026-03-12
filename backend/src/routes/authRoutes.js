const express = require('express');
const { syncUser, getMe } = require('../controllers/authController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/sync', checkJwt, syncUser);        // no attachUser – user may not exist yet
router.get('/me',   checkJwt, attachUser, getMe);

module.exports = router;
