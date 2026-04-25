const express = require('express');
const ctrl = require('../controllers/demoRequestController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', ctrl.create);
router.get('/', checkJwt, attachUser, requireRole(['admin']), ctrl.getAll);
router.patch('/:id/status', checkJwt, attachUser, requireRole(['admin']), ctrl.updateStatus);

module.exports = router;
