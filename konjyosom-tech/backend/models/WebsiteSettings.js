const mongoose = require('mongoose');

const websiteSettingsSchema = new mongoose.Schema({
  // Branding
  logo: { type: String, default: '' },
  favicon: { type: String, default: '' },
  companyName: { type: String, default: 'Konjyosom Tech Solutions Pvt. Ltd.' },
  tagline: { type: String, default: 'Your Trusted Technology Partner' },

  // Hero Section
  heroTitle: { type: String, default: 'Professional Technology Solutions' },
  heroTypingTexts: [{ type: String }],
  heroBackgroundImage: { type: String, default: '' },
  heroBackgroundVideo: { type: String, default: '' },

  // About
  aboutTitle: { type: String, default: 'About Us' },
  aboutContent: { type: String, default: '' },
  aboutImage: { type: String, default: '' },
  mission: { type: String, default: '' },
  vision: { type: String, default: '' },

  // Contact
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  whatsapp: { type: String, default: '' },
  address: { type: String, default: '' },
  googleMapsUrl: { type: String, default: '' },

  // Social Links
  socialLinks: {
    facebook: String,
    twitter: String,
    linkedin: String,
    instagram: String,
    youtube: String
  },

  // SEO
  metaTitle: { type: String, default: 'Konjyosom Tech Solutions - CCTV, Access Control, Networking' },
  metaDescription: { type: String, default: '' },
  metaKeywords: [{ type: String }],

  // Services Display
  servicesDisplay: [{
    category: String,
    icon: String,
    description: String,
    features: [String],
    isActive: { type: Boolean, default: true }
  }],

  // Testimonials
  testimonials: [{
    name: String,
    company: String,
    content: String,
    rating: Number,
    image: String,
    isActive: { type: Boolean, default: true }
  }],

  // FAQ
  faq: [{
    question: String,
    answer: String,
    category: String,
    isActive: { type: Boolean, default: true }
  }],

  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('WebsiteSettings', websiteSettingsSchema);
