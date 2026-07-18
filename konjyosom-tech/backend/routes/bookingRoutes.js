const express = require('express');
const router = express.Router();
const { createBooking, getAllBookings, getBookingById, updateBookingStatus, assignTechnician, deleteBooking, getBookingStats } = require('../controllers/bookingController');
const { protect, adminOnly, adminOrTechnician } = require('../middleware/auth');

router.post('/', createBooking);
router.get('/', protect, adminOnly, getAllBookings);
router.get('/stats/overview', protect, adminOnly, getBookingStats);
router.get('/:id', protect, adminOrTechnician, getBookingById);
router.put('/:id/status', protect, adminOnly, updateBookingStatus);
router.put('/:id/assign', protect, adminOnly, assignTechnician);
router.delete('/:id', protect, adminOnly, deleteBooking);

module.exports = router;
