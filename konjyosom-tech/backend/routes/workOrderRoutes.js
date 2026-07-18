const express = require('express');
const router = express.Router();
const { createWorkOrder, getAllWorkOrders, getWorkOrderById, updateStatus, acceptWorkOrder, uploadPhotos, addNotes, captureSignature, completeWorkOrder, getWorkOrderStats } = require('../controllers/workOrderController');
const { protect, adminOnly, technicianOnly, adminOrTechnician } = require('../middleware/auth');

router.post('/', protect, adminOnly, createWorkOrder);
router.get('/', protect, adminOrTechnician, getAllWorkOrders);
router.get('/stats/overview', protect, adminOnly, getWorkOrderStats);
router.get('/:id', protect, adminOrTechnician, getWorkOrderById);
router.put('/:id/status', protect, adminOrTechnician, updateStatus);
router.put('/:id/accept', protect, technicianOnly, acceptWorkOrder);
router.put('/:id/photos', protect, technicianOnly, uploadPhotos);
router.put('/:id/notes', protect, technicianOnly, addNotes);
router.put('/:id/signature', protect, technicianOnly, captureSignature);
router.put('/:id/complete', protect, technicianOnly, completeWorkOrder);

module.exports = router;
