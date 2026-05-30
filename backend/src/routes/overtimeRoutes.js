const express = require('express');
const ctrl = require('../controllers/overtimeController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(checkJwt, attachUser);

// Employee: view own overtime balance
router.get('/balance/my', ctrl.getMyBalance);

// Admin/Manager: view balance for any employee + compensate
router.get('/balance/:userId',    requireRole(['admin', 'manager']), ctrl.getBalanceByUser);
router.post('/compensate',        requireRole(['admin', 'manager']), ctrl.compensateOvertime);

module.exports = router;
