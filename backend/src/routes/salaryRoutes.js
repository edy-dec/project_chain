const express = require('express');
const ctrl = require('../controllers/salaryController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(checkJwt, attachUser);

router.get('/my', ctrl.getMySalaries);

router.get('/',                          requireRole(['admin']), ctrl.getAllSalaries);
router.get('/employee/:userId',          requireRole(['admin']), ctrl.getUserSalaries);
router.post('/generate/:userId',         requireRole(['admin']), ctrl.generateSalary);
router.post('/generate-all',             requireRole(['admin']), ctrl.generateAll);
router.patch('/:id/paid',                requireRole(['admin']), ctrl.markAsPaid);

module.exports = router;
