const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  company: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, trim: true },
  location: {
    lat: Number,
    lng: Number
  },
  type: { 
    type: String, 
    enum: ['individual', 'company'], 
    default: 'individual' 
  },
  totalBookings: { type: Number, default: 0 },
  totalQuotations: { type: Number, default: 0 },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
