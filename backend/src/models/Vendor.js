const mongoose = require('mongoose');
const { VENDOR_STATUS } = require('../config/constants');

const vendorSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    registrationEmail: {
      type: String,
      required: [true, 'Vendor email is required'],
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true
    },
    stallName: {
      type: String,
      required: [true, 'Stall name is required'],
      trim: true
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true
    },
    description: {
      type: String,
      default: 'Delicious local street food prepared fresh.'
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&auto=format&fit=crop&q=80'
    },
    coverImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80'
    },
    cuisineType: [{ type: String }],
    address: {
      street: String,
      city: String,
      pincode: String,
      landmark: String
    },
    location: {
      type: { type: String, default: 'Point' },
      coordinates: { type: [Number], default: [77.209, 28.6139] } // [lng, lat]
    },
    openingHours: {
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '22:00' }
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    preparationTimeMin: {
      type: Number,
      default: 15
    },
    status: {
      type: String,
      enum: Object.values(VENDOR_STATUS),
      default: VENDOR_STATUS.PENDING
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    commissionRate: {
      type: Number,
      default: 5.0 // 5% default platform commission
    },
    qrCodeUrl: {
      type: String,
      default: ''
    },
    rating: {
      type: Number,
      default: 4.5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String,
      upiId: String
    }
  },
  { timestamps: true }
);

vendorSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Vendor', vendorSchema);
