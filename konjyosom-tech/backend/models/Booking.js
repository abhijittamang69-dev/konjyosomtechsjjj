const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  name: { type: String, required: true },
  company: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  location: { type: String, required: true },
  serviceType: { type: String, required: true },
  preferredDate: { type: Date },
  description: { type: String },
  photos: [{ type: String }],
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  workOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Auto-generate booking ID
bookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    const count = await mongoose.model('Booking').countDocuments();
    this.bookingId = `BK${Date.now().toString(36).toUpperCase()}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
