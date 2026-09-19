const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['PERCENTAGE', 'FIXED'],
      default: 'PERCENTAGE'
    },
    discountValue: {
      type: Number,
      required: true
    },
    minOrderValue: {
      type: Number,
      default: 0
    },
    maxDiscountAmount: {
      type: Number,
      default: 100
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      default: null // null means platform-wide
    },
    validFrom: {
      type: Date,
      default: Date.now
    },
    validTill: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number,
      default: 1000
    },
    perUserLimit: {
      type: Number,
      default: 3
    },
    timesUsed: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Coupon', couponSchema);
