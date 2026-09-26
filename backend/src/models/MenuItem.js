const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true, maxlength: 40, default: 'Main' },
    isVeg: { type: Boolean, default: true },
    prepTime: { type: Number, min: 1, max: 180, default: 10 }, // minutes
    isAvailable: { type: Boolean, default: true },

    // Photo is stored in MongoDB itself and served by GET /api/images/menu/:id
    image: {
      type: { data: Buffer, contentType: String },
      select: false,
    },
    imageUpdatedAt: { type: Date, default: null },

    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 }, // total quantity sold (completed orders)
  },
  { timestamps: true }
);

menuItemSchema.virtual('rating').get(function () {
  return this.ratingCount ? Math.round((this.ratingSum / this.ratingCount) * 10) / 10 : null;
});

menuItemSchema.virtual('imageUrl').get(function () {
  return this.imageUpdatedAt ? `/api/images/menu/${this._id}?v=${this.imageUpdatedAt.getTime()}` : null;
});

menuItemSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.image;
    delete ret.ratingSum;
    return ret;
  },
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
