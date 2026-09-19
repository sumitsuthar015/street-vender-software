const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  selectedCustomizations: [
    {
      groupName: String,
      choiceLabel: String,
      extraPrice: { type: Number, default: 0 }
    }
  ],
  itemUnitPrice: {
    type: Number,
    required: true
  },
  specialInstruction: {
    type: String,
    default: ''
  }
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor'
    },
    tableNo: {
      type: String,
      default: ''
    },
    items: [cartItemSchema],
    couponCode: {
      type: String,
      default: ''
    },
    discountAmount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Cart', cartSchema);
