const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, createTechnician, updateUser, toggleUserStatus, deleteUser, getTechnicianStats } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getAllUsers);
router.get('/technicians/stats', protect, adminOnly, getTechnicianStats);
router.get('/:id', protect, adminOnly, getUserById);
router.post('/technician', protect, adminOnly, createTechnician);
router.put('/:id', protect, adminOnly, updateUser);
router.put('/:id/toggle-status', protect, adminOnly, toggleUserStatus);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
