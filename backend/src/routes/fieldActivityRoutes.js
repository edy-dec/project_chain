const express = require('express');
const ctrl = require('../controllers/fieldActivityController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(checkJwt, attachUser);

// ── Angajat ──────────────────────────────────────────────────────────
router.post('/',                 ctrl.create);             // Inregistreaza activitate noua
router.get('/my',                ctrl.getMyActivities);    // Lista activitatilor proprii
router.get('/my/summary',        ctrl.getMySummary);       // Sumar lunar propriu (?year=&month=)
router.get('/:id',               ctrl.getById);            // Detalii activitate
router.put('/:id',               ctrl.update);             // Editeaza (doar draft/pending)
router.patch('/:id/cancel',      ctrl.cancel);             // Anuleaza

// ── Admin / Manager ───────────────────────────────────────────────────
router.get('/', requireRole(['admin', 'manager']),                          ctrl.getAll);
router.get('/employee/:userId/summary', requireRole(['admin', 'manager']),  ctrl.getSummaryByUser);
router.patch('/:id/approve',     requireRole(['admin', 'manager']),         ctrl.approve);
router.patch('/:id/reject',      requireRole(['admin', 'manager']),         ctrl.reject);

module.exports = router;
