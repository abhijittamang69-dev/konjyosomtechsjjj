const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recipientEmail: { type: String },
  recipientPhone: { type: String },
  type: { 
    type: String, 
    enum: ['email', 'whatsapp', 'push', 'sms'], 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['booking', 'quotation', 'workorder', 'system', 'password', 'general'], 
    required: true 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedModel: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'failed', 'read'], 
    default: 'pending' 
  },
  sentAt: { type: Date },
  readAt: { type: Date },
  errorMessage: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
