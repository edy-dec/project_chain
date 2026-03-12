const express = require('express');
const ctrl = require('../controllers/attendanceController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(checkJwt, attachUser);

// Employee endpoints
router.post('/check-in',  ctrl.checkIn);
router.post('/check-out', ctrl.checkOut);
router.get('/today',      ctrl.getToday);
router.get('/my-history', ctrl.getHistory);
router.get('/my-monthly', ctrl.getMonthly);

// Admin / Manager endpoints
router.get('/',                              requireRole(['admin', 'manager']), ctrl.getAll);
router.get('/employee/:userId',              requireRole(['admin', 'manager']), ctrl.getHistory);
router.get('/employee/:userId/monthly',      requireRole(['admin', 'manager']), ctrl.getMonthly);
router.post('/manual',                       requireRole(['admin', 'manager']), ctrl.manualEntry);

module.exports = router;
