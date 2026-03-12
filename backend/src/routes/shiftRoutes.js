const express = require('express');
const ctrl = require('../controllers/shiftController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(checkJwt, attachUser);

router.get('/',      ctrl.getAll);
router.get('/:id',   ctrl.getById);

router.post('/',           requireRole(['admin', 'manager']), ctrl.create);
router.put('/:id',         requireRole(['admin', 'manager']), ctrl.update);
router.delete('/:id',      requireRole(['admin']),            ctrl.remove);
router.post('/assign',     requireRole(['admin', 'manager']), ctrl.assign);

module.exports = router;
