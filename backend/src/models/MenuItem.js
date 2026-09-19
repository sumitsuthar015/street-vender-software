const mongoose = require('mongoose');

const customizationOptionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Size", "Extra Cheese", "Spice Level"
  type: { type: String, enum: ['SINGLE', 'MULTIPLE'], default: 'SINGLE' },
  required: { type: Boolean, default: false },
  choices: [
    {
      label: { type: String, required: true }, // e.g. "Medium", "Extra Spicy"
      extraPrice: { type: Number, default: 0 }
    }
  ]
});

const menuItemSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    description: {
      type: String,
      default: ''
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80'
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: 0
    },
    discountPrice: {
      type: Number,
      default: 0
    },
    isVeg: {
      type: Boolean,
      default: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    preparationTime: {
      type: Number,
      default: 10 // minutes
    },
    stockQuantity: {
      type: Number,
      default: 50
    },
    lowStockThreshold: {
      type: Number,
      default: 5
    },
    tags: [{ type: String }],
    customizations: [customizationOptionSchema],
    rating: {
      type: Number,
      default: 4.8
    },
    totalOrdersCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

menuItemSchema.index({ vendor: 1, category: 1 });

module.exports = mongoose.model('MenuItem', menuItemSchema);
