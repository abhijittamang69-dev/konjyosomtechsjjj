const express = require('express');
const router = express.Router();
const { getWebsiteSettings, updateWebsiteSettings, getHeroData, getContactInfo, getServices, getTestimonials, getFAQ } = require('../controllers/websiteController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/settings', getWebsiteSettings);
router.get('/hero', getHeroData);
router.get('/contact', getContactInfo);
router.get('/services', getServices);
router.get('/testimonials', getTestimonials);
router.get('/faq', getFAQ);
router.put('/settings', protect, adminOnly, updateWebsiteSettings);

module.exports = router;
