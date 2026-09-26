const mongoose = require('mongoose');

const imageField = { type: { data: Buffer, contentType: String }, select: false };

// A table in the shop. Each one gets its own QR code: /s/<slug>?table=<code>
const tableSchema = new mongoose.Schema(
  {
    code: { type: String, required: true }, // short random code, stays the same when the table is renamed
    name: { type: String, required: true, trim: true, maxlength: 30 },
  },
  { _id: false }
);

const vendorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, default: '' },

    shopName: { type: String, required: true, trim: true, maxlength: 80 },
    // Used in the customer URL / QR code: /s/<slug>
    slug: { type: String, required: true, unique: true },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    address: { type: String, trim: true, maxlength: 200, default: '' },
    openingHours: { type: String, trim: true, maxlength: 60, default: '' }, // free text, e.g. "5 PM - 11 PM"

    // Stall photo (big banner) and logo, stored in MongoDB and served by /api/images/shop/:id/...
    cover: imageField,
    coverUpdatedAt: { type: Date, default: null },
    logo: imageField,
    logoUpdatedAt: { type: Date, default: null },

    tables: { type: [tableSchema], default: [] },

    isOpen: { type: Boolean, default: true },
    acceptCounter: { type: Boolean, default: true },
    acceptOnline: { type: Boolean, default: true },

    // Sum/count of every food rating the shop received; average is derived.
    ratingSum: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

vendorSchema.virtual('rating').get(function () {
  return this.ratingCount ? Math.round((this.ratingSum / this.ratingCount) * 10) / 10 : null;
});

vendorSchema.virtual('coverUrl').get(function () {
  return this.coverUpdatedAt ? `/api/images/shop/${this._id}/cover?v=${this.coverUpdatedAt.getTime()}` : null;
});

vendorSchema.virtual('logoUrl').get(function () {
  return this.logoUpdatedAt ? `/api/images/shop/${this._id}/logo?v=${this.logoUpdatedAt.getTime()}` : null;
});

vendorSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = String(ret._id);
    delete ret._id;
    delete ret.passwordHash;
    delete ret.ratingSum;
    delete ret.cover;
    delete ret.logo;
    return ret;
  },
});

module.exports = mongoose.model('Vendor', vendorSchema);
