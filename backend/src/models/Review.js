const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem'
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true,
      default: ''
    },
    verifiedPurchase: {
      type: Boolean,
      default: true
    },
    isReported: {
      type: Boolean,
      default: false
    },
    isModerated: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

reviewSchema.index({ order: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
