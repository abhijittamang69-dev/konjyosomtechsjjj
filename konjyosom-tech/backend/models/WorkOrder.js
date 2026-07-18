const mongoose = require('mongoose');

const workOrderSchema = new mongoose.Schema({
  workOrderId: { type: String, unique: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  customerEmail: { type: String },
  serviceType: { type: String, required: true },
  location: { type: String, required: true },
  locationCoords: {
    lat: Number,
    lng: Number
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date },
  description: { type: String },
  attachments: [{ type: String }],
  status: { 
    type: String, 
    enum: ['pending', 'assigned', 'accepted', 'on_site', 'in_progress', 'completed', 'closed', 'cancelled'], 
    default: 'pending' 
  },
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    notes: String
  }],
  // Technician Work Details
  beforePhotos: [{ type: String }],
  afterPhotos: [{ type: String }],
  serviceNotes: { type: String },
  materialsUsed: [{
    name: String,
    quantity: Number,
    cost: Number
  }],
  laborHours: { type: Number },
  // Customer Signature
  customerSignature: { type: String },
  signatureDate: { type: Date },
  signedBy: { type: String },
  // Completion
  completedAt: { type: Date },
  completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportGenerated: { type: Boolean, default: false },
  reportUrl: { type: String },
  // Admin
  adminNotes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

workOrderSchema.pre('save', async function(next) {
  if (!this.workOrderId) {
    const count = await mongoose.model('WorkOrder').countDocuments();
    this.workOrderId = `WO${Date.now().toString(36).toUpperCase()}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('WorkOrder', workOrderSchema);
