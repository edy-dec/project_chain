const express = require('express');
const {
  checkIn,
  checkOut,
  getToday,
  getHistory,
  getMonthly,
  getAll,
  manualEntry,
} = require('../controllers/attendanceController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const ADMIN_MANAGER_ROLES = ['admin', 'manager'];

const router = express.Router();
router.use(checkJwt, attachUser);

// Rutele personale folosesc direct userul autentificat.
router.post('/check-in', checkIn);
router.post('/check-out', checkOut);
router.get('/today', getToday);
router.get('/my-history', getHistory);
router.get('/my-monthly', getMonthly);

// Managementul poate vedea sau completa pontajele altor angajati.
router.get('/', requireRole(ADMIN_MANAGER_ROLES), getAll);
router.get('/employee/:userId', requireRole(ADMIN_MANAGER_ROLES), getHistory);
router.get('/employee/:userId/monthly', requireRole(ADMIN_MANAGER_ROLES), getMonthly);
router.post('/manual', requireRole(ADMIN_MANAGER_ROLES), manualEntry);

module.exports = router;
