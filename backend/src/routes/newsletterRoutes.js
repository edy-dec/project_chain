const express = require('express');
const ctrl = require('../controllers/newsletterController');

const router = express.Router();

router.post('/subscribe', ctrl.subscribe);

module.exports = router;
