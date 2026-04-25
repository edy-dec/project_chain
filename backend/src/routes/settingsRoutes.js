const express = require('express');
const ctrl = require('../controllers/settingsController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', checkJwt, attachUser, ctrl.getSettings);
router.put('/', checkJwt, attachUser, requireRole(['admin']), ctrl.updateSettings);

module.exports = router;