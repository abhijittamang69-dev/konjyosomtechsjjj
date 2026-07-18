const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  quotationId: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  name: { type: String, required: true },
  company: { type: String },
  phone: { type: String, required: true },
  email: { type: String },
  projectType: { type: String, required: true },
  location: { type: String },
  requirements: { type: String, required: true },
  files: [{ type: String }],
  status: { 
    type: String, 
    enum: ['pending', 'reviewing', 'quoted', 'approved', 'rejected', 'expired'], 
    default: 'pending' 
  },
  quotedAmount: { type: Number },
  quoteDetails: { type: String },
  validUntil: { type: Date },
  approvedBy: { type: String },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

quotationSchema.pre('save', async function(next) {
  if (!this.quotationId) {
    const count = await mongoose.model('Quotation').countDocuments();
    this.quotationId = `QT${Date.now().toString(36).toUpperCase()}${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Quotation', quotationSchema);
