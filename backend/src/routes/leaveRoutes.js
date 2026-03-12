const express = require('express');
const ctrl = require('../controllers/leaveController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(checkJwt, attachUser);

router.post('/',              ctrl.requestLeave);
router.get('/my',             ctrl.getMyLeaves);
router.get('/balance',        ctrl.getMyBalance);
router.patch('/:id/cancel',   ctrl.cancelLeave);

router.get('/',                        requireRole(['admin', 'manager']), ctrl.getAllLeaves);
router.get('/employee/:userId',        requireRole(['admin', 'manager']), ctrl.getUserLeaves);
router.patch('/:id/approve',           requireRole(['admin', 'manager']), ctrl.approveLeave);
router.patch('/:id/reject',            requireRole(['admin', 'manager']), ctrl.rejectLeave);

module.exports = router;
