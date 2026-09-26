const mongoose = require('mongoose');

const STATUSES = [
  'awaiting_payment', // online order created, customer hasn't paid yet (vendor doesn't see it)
  'placed', //           new order in the vendor's queue
  'preparing',
  'ready', //            customer can collect it
  'completed',
  'rejected', //         vendor declined it
  'cancelled', //        customer cancelled before the vendor accepted
];

const orderItemSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    // Snapshot of the menu item at order time, so later menu edits don't change old orders
    name: { type: String, required: true },
    price: { type: Number, required: true },
    isVeg: { type: Boolean, default: true },
    qty: { type: Number, required: true, min: 1 },
    reviewed: { type: Boolean, default: false },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    // Secret code in the customer's tracking link (/order/<code>). Acts as their "login" for this order.
    code: { type: String, required: true, unique: true },
    // Short number called out at the counter, restarts every day. Given once the order is placed.
    token: { type: Number, default: null },
    dayKey: { type: String, required: true }, // YYYY-MM-DD in the shop's timezone

    // Set when the customer scanned a table QR (dine-in); null = pickup at the counter
    table: {
      type: new mongoose.Schema({ code: String, name: String }, { _id: false }),
      default: null,
    },

    customerName: { type: String, required: true, trim: true, maxlength: 60 },
    customerPhone: { type: String, trim: true, default: '' },
    note: { type: String, trim: true, maxlength: 200, default: '' },

    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true, min: 0 },

    status: { type: String, enum: STATUSES, required: true },
    statusHistory: [{ _id: false, status: String, at: { type: Date, default: Date.now } }],
    cancelReason: { type: String, default: '' },
    estimatedReadyAt: { type: Date, default: null },

    paymentMethod: { type: String, enum: ['counter', 'online'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded', 'refund_pending'],
      default: 'pending',
    },
    payment: {
      provider: { type: String, enum: ['cash', 'razorpay', 'demo', null], default: null },
      gatewayOrderId: { type: String, default: null },
      gatewayKeyId: { type: String, default: null }, // which Razorpay account the gateway order was made on
      paymentId: { type: String, default: null },
      refundId: { type: String, default: null },
      paidAt: { type: Date, default: null },
    },
  },
  // optimisticConcurrency: if two people change the same order at once, the second save fails
  // with a VersionError instead of silently overwriting the first change.
  { timestamps: true, optimisticConcurrency: true }
);

orderSchema.index({ vendor: 1, status: 1, createdAt: -1 });
orderSchema.index({ vendor: 1, dayKey: 1 });
orderSchema.index({ 'payment.gatewayOrderId': 1 }, { sparse: true });

orderSchema.methods.setStatus = function (status, reason) {
  this.status = status;
  this.statusHistory.push({ status, at: new Date() });
  if (reason) this.cancelReason = reason;
};

orderSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

orderSchema.statics.STATUSES = STATUSES;
orderSchema.statics.ACTIVE_STATUSES = ['placed', 'preparing', 'ready'];

module.exports = mongoose.model('Order', orderSchema);
