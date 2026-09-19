const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vendor',
      required: true
    },
    tableNo: {
      type: String,
      required: true,
      trim: true
    },
    capacity: {
      type: Number,
      default: 4
    },
    qrCodeDataUrl: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'OCCUPIED', 'RESERVED'],
      default: 'AVAILABLE'
    }
  },
  { timestamps: true }
);

tableSchema.index({ vendor: 1, tableNo: 1 }, { unique: true });

module.exports = mongoose.model('Table', tableSchema);
