const express = require('express');
const { create, getAll, remove, update } = require('../controllers/bonusController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/roleMiddleware');

const ADMIN_ROLES = ['admin'];
const ADMIN_MANAGER_ROLES = ['admin', 'manager'];

const router = express.Router();

// Toate rutele de bonus lucreaza cu userul autentificat din baza.
router.use(checkJwt, attachUser);

router.get('/', requireRole(ADMIN_MANAGER_ROLES), getAll);
router.post('/', requireRole(ADMIN_ROLES), create);
router.put('/:id', requireRole(ADMIN_ROLES), update);
router.delete('/:id', requireRole(ADMIN_ROLES), remove);

module.exports = router;
