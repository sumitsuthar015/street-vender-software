const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    subject: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['PAYMENT', 'ORDER', 'MISSING_ITEM', 'REFUND', 'VENDOR_COMPLAINT', 'TECHNICAL', 'OTHER'],
      default: 'OTHER'
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
      default: 'OPEN'
    },
    replies: [
      {
        sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        senderRole: String,
        message: String,
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
