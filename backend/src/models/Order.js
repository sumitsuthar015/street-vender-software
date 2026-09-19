const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, ORDER_TYPES } = require('../config/constants');

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: { type: String, required: true },
  image: String,
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  selectedCustomizations: [
    {
      groupName: String,
      choiceLabel: String,
      extraPrice: { type: Number, default: 0 }
    }
  ],
  totalPrice: { type: Number, required: true },
  specialInstruction: { type: String, default: '' }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
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
    orderType: {
      type: String,
      enum: Object.values(ORDER_TYPES),
      default: ORDER_TYPES.PICKUP
    },
    tableNo: {
      type: String,
      default: ''
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    commissionAmount: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      required: true
    },
    couponCode: {
      type: String,
      default: ''
    },
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING
    },
    paymentMethod: {
      type: String,
      enum: Object.values(PAYMENT_METHODS),
      default: PAYMENT_METHODS.ONLINE_RAZORPAY
    },
    estimatedReadyAt: {
      type: Date
    },
    acceptedAt: Date,
    preparingAt: Date,
    readyAt: Date,
    completedAt: Date,
    cancelledAt: Date,
    cancellationReason: String
  },
  { timestamps: true }
);

orderSchema.index({ customer: 1, createdAt: -1 });
orderSchema.index({ vendor: 1, orderStatus: 1 });

module.exports = mongoose.model('Order', orderSchema);
