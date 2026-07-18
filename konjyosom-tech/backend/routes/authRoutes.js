const express = require('express');
const router = express.Router();
const { login, getMe, changePassword, firstLoginChange, logout, resetPassword } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.put('/first-login-change', protect, firstLoginChange);
router.post('/logout', protect, logout);
router.post('/reset-password/:id', protect, adminOnly, resetPassword);

module.exports = router;
