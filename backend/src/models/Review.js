const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    itemName: { type: String, required: true },
    customerName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

// Only customers who actually ordered (and received) a dish can rate it, once per order.
reviewSchema.index({ order: 1, item: 1 }, { unique: true });
reviewSchema.index({ item: 1, createdAt: -1 });

reviewSchema.set('toJSON', {
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    return ret;
  },
});

module.exports = mongoose.model('Review', reviewSchema);
