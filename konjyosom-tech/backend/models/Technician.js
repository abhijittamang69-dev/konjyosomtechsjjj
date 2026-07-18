const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: String, unique: true },
  specialization: [{ type: String }],
  skills: [{ type: String }],
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalJobs: { type: Number, default: 0 },
  completedJobs: { type: Number, default: 0 },
  currentLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  availability: { 
    type: String, 
    enum: ['available', 'busy', 'offduty'], 
    default: 'available' 
  },
  documents: [{
    type: String,
    url: String,
    uploadedAt: Date
  }]
}, { timestamps: true });

module.exports = mongoose.model('Technician', technicianSchema);
