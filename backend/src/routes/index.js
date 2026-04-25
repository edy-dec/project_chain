const express = require('express');
const authRoutes       = require('./authRoutes');
const userRoutes       = require('./userRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const leaveRoutes      = require('./leaveRoutes');
const salaryRoutes     = require('./salaryRoutes');
const shiftRoutes      = require('./shiftRoutes');
const reportRoutes     = require('./reportRoutes');
const chatbotRoutes    = require('./chatbotRoutes');
const settingsRoutes   = require('./settingsRoutes');
const bonusRoutes      = require('./bonusRoutes');

const router = express.Router();

router.use('/auth',        authRoutes);
router.use('/employees',   userRoutes);
router.use('/attendance',  attendanceRoutes);
router.use('/leaves',      leaveRoutes);
router.use('/salary',      salaryRoutes);
router.use('/shifts',      shiftRoutes);
router.use('/reports',     reportRoutes);
router.use('/chatbot',     chatbotRoutes);
router.use('/settings',    settingsRoutes);
router.use('/bonuses',     bonusRoutes);

module.exports = router;
