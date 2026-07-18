const express = require('express');
const router = express.Router();
const { createQuotation, getAllQuotations, getQuotationById, updateQuotation, deleteQuotation, getQuotationStats } = require('../controllers/quotationController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', createQuotation);
router.get('/', protect, adminOnly, getAllQuotations);
router.get('/stats/overview', protect, adminOnly, getQuotationStats);
router.get('/:id', protect, adminOnly, getQuotationById);
router.put('/:id', protect, adminOnly, updateQuotation);
router.delete('/:id', protect, adminOnly, deleteQuotation);

module.exports = router;
