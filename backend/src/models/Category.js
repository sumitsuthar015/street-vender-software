const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    icon: {
      type: String,
      default: 'Utensils'
    },
    displayOrder: {
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

module.exports = mongoose.model('Category', categorySchema);
