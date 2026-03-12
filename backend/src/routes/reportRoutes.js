const express = require('express');
const ctrl = require('../controllers/reportController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(checkJwt, attachUser, requireRole(['admin', 'manager']));

router.get('/summary',     ctrl.getSummary);
router.get('/attendance',  ctrl.getAttendance);
router.get('/salary',      ctrl.getSalary);
router.get('/departments', ctrl.getDepartments);

module.exports = router;
