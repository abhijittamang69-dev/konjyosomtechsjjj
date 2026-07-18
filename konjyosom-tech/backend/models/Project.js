const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['cctv', 'access_control', 'elv', 'networking', 'website', 'maintenance', 'other'],
    required: true 
  },
  client: { type: String },
  location: { type: String },
  images: [{ type: String }],
  featuredImage: { type: String },
  technologies: [{ type: String }],
  completionDate: { type: Date },
  status: { 
    type: String, 
    enum: ['ongoing', 'completed', 'on_hold'], 
    default: 'completed' 
  },
  testimonial: {
    content: String,
    author: String,
    company: String
  },
  isFeatured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

projectSchema.pre('save', function(next) {
  if (!this.slug) {
    this.slug = this.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
