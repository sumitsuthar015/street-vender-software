const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User name is required'],
      trim: true
    },
    mobile: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    password: {
      type: String,
      select: false
    },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.CUSTOMER
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'BLOCKED'],
      default: 'ACTIVE'
    },
    profileImage: {
      type: String,
      default: ''
    },
    otpHash: {
      type: String,
      select: false
    },
    otpExpiresAt: {
      type: Date,
      select: false
    },
    favorites: {
      vendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
      menuItems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' }]
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
