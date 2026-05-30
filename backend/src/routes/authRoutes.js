const express = require('express');
const { syncUser, getMe, updateMe } = require('../controllers/authController');
const { checkJwt } = require('../config/auth');
const { attachUser } = require('../middleware/authMiddleware');

const router = express.Router();

// Sincronizarea merge direct pe JWT, chiar daca userul nu exista inca local.
router.post('/sync', checkJwt, syncUser);

// Profilul cere userul deja atasat din baza de date.
router.get('/me', checkJwt, attachUser, getMe);
router.put('/me', checkJwt, attachUser, updateMe);

module.exports = router;
