const express = require('express');
const ctrl = require('../controllers/userController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const router = express.Router();
router.use(checkJwt, attachUser);

router.get('/',     requireRole(['admin', 'manager']), ctrl.getAll);
router.get('/:id',  ctrl.getById);
router.post('/',    requireRole(['admin']), ctrl.create);
router.put('/:id',  requireRole(['admin']), ctrl.update);
router.delete('/:id', requireRole(['admin']), ctrl.remove);

module.exports = router;
