const WebsiteSettings = require('../models/WebsiteSettings');

// Get or create default settings
const getSettings = async () => {
  let settings = await WebsiteSettings.findOne();
  if (!settings) {
    settings = await WebsiteSettings.create({
      heroTypingTexts: [
        'CCTV Installation',
        'CCTV Maintenance',
        'Access Control Systems',
        'ELV Solutions',
        'Networking Solutions',
        'Fiber Optic Installation',
        'Website Design',
        'Annual Maintenance Contract',
        'Preventive Maintenance',
        '24/7 Technical Support'
      ]
    });
  }
  return settings;
};

// @desc    Get website settings (public)
// @route   GET /api/website/settings
// @access  Public
const getWebsiteSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update website settings
// @route   PUT /api/website/settings
// @access  Admin
const updateWebsiteSettings = async (req, res) => {
  try {
    let settings = await getSettings();

    const updateData = { ...req.body, updatedBy: req.user._id };

    settings = await WebsiteSettings.findByIdAndUpdate(
      settings._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Settings updated', settings });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get hero section data
// @route   GET /api/website/hero
// @access  Public
const getHeroData = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      hero: {
        title: settings.heroTitle,
        typingTexts: settings.heroTypingTexts,
        backgroundImage: settings.heroBackgroundImage,
        backgroundVideo: settings.heroBackgroundVideo
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get contact info
// @route   GET /api/website/contact
// @access  Public
const getContactInfo = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      contact: {
        phone: settings.phone,
        email: settings.email,
        whatsapp: settings.whatsapp,
        address: settings.address,
        googleMapsUrl: settings.googleMapsUrl,
        socialLinks: settings.socialLinks
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get services
// @route   GET /api/website/services
// @access  Public
const getServices = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      services: settings.servicesDisplay.filter(s => s.isActive)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get testimonials
// @route   GET /api/website/testimonials
// @access  Public
const getTestimonials = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      testimonials: settings.testimonials.filter(t => t.isActive)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get FAQ
// @route   GET /api/website/faq
// @access  Public
const getFAQ = async (req, res) => {
  try {
    const settings = await getSettings();
    res.json({
      success: true,
      faq: settings.faq.filter(f => f.isActive)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWebsiteSettings,
  updateWebsiteSettings,
  getHeroData,
  getContactInfo,
  getServices,
  getTestimonials,
  getFAQ
};
