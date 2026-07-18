const express = require('express');
const router = express.Router();
const { getDashboardStats, getActivityLogs, getTechnicianReport, getMonthlyReport } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/dashboard', protect, adminOnly, getDashboardStats);
router.get('/activity', protect, adminOnly, getActivityLogs);
router.get('/technicians', protect, adminOnly, getTechnicianReport);
router.get('/monthly', protect, adminOnly, getMonthlyReport);

module.exports = router;
