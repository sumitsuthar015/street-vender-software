const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const apiResponse = require('../utils/apiResponse');
const asyncWrapper = require('../utils/asyncWrapper');
const { generateOTP, hashOTP, verifyOTP, OTP_DEMO_CODE } = require('../services/otpService');
const { ROLES, VENDOR_STATUS } = require('../config/constants');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'super_secret_jwt_key_street_vendor_2026_safe', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

// Email OTP request. In demo mode the OTP is returned; configure an email provider
// before setting OTP_DEMO_MODE=false.
exports.requestEmailOTP = asyncWrapper(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { name } = req.body;
  if (!email || !isValidEmail(email)) {
    return apiResponse.error(res, 'Please provide a valid email address.', null, 400);
  }

  // First check if a Vendor exists with this registration email
  const vendorRecord = await Vendor.findOne({ registrationEmail: email });

  let user = await User.findOne({ email });

  if (!user) {
    if (vendorRecord) {
      // Vendor record exists but user account was somehow missing — find by owner
      user = await User.findById(vendorRecord.owner);
    }
    if (!user) {
      // No user at all with this email — reject (vendor-only login now)
      return apiResponse.error(res, 'No vendor account found with this email. Please register first.', null, 404);
    }
  }

  // Ensure user has VENDOR or ADMIN role (no customer login)
  if (user.role === ROLES.CUSTOMER) {
    return apiResponse.error(res, 'This email is not registered as a vendor. Please use your vendor registered email.', null, 403);
  }

  if (user.status === 'BLOCKED') {
    return apiResponse.error(res, 'Your account has been suspended by Admin.', null, 403);
  }

  const otp = generateOTP();
  user.otpHash = hashOTP(otp);
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  console.log(`[OTP Generated] Email: ${email} | Code: ${otp} | Role: ${user.role}`);
  return apiResponse.success(res, 'OTP generated successfully.', {
    email,
    demoOtp: process.env.OTP_DEMO_MODE === 'true' ? OTP_DEMO_CODE : undefined,
    expiresInSeconds: 600
  });
});

exports.verifyEmailOTP = asyncWrapper(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { otp } = req.body;
  if (!email || !otp) return apiResponse.error(res, 'Email address and OTP are required.', null, 400);
  const user = await User.findOne({ email }).select('+otpHash +otpExpiresAt');
  if (!user) return apiResponse.error(res, 'User with this email address does not exist.', null, 404);
  if (user.status === 'BLOCKED') return apiResponse.error(res, 'Your account has been suspended by Admin.', null, 403);
  const verification = verifyOTP(otp, user.otpHash, user.otpExpiresAt);
  if (!verification.valid) return apiResponse.error(res, verification.reason, null, 400);
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  await user.save();
  const vendor = user.role === ROLES.VENDOR ? await Vendor.findOne({ owner: user._id }) : null;
  return apiResponse.success(res, 'Login successful!', { token: generateToken(user._id), user: { id: user._id, name: user.name, email: user.email, role: user.role, profileImage: user.profileImage }, vendor });
});

// Customer Mobile OTP Request
exports.requestMobileOTP = asyncWrapper(async (req, res) => {
  const { mobile, name } = req.body;

  if (!mobile || mobile.length < 10) {
    return apiResponse.error(res, 'Please provide a valid 10-digit mobile number.', null, 400);
  }

  let user = await User.findOne({ mobile });

  if (!user) {
    user = new User({
      mobile,
      name: name || `Customer ${mobile.slice(-4)}`,
      role: ROLES.CUSTOMER
    });
  } else if (user.role !== ROLES.CUSTOMER) {
    return apiResponse.error(res, 'Vendor accounts must use vendor email login.', null, 403);
  } else if (user.status === 'BLOCKED') {
    return apiResponse.error(res, 'Your account has been suspended by Admin.', null, 403);
  }

  const otp = generateOTP();
  const otpHash = hashOTP(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  user.otpHash = otpHash;
  user.otpExpiresAt = expiresAt;
  await user.save();

  console.log(`[OTP Generated] Mobile: ${mobile} | Code: ${otp}`);

  return apiResponse.success(res, 'OTP sent successfully to your mobile number.', {
    mobile,
    demoOtp: process.env.OTP_DEMO_MODE === 'true' ? OTP_DEMO_CODE : undefined,
    expiresInSeconds: 600
  });
});

// Customer Mobile OTP Verify & Login
exports.verifyMobileOTP = asyncWrapper(async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return apiResponse.error(res, 'Mobile number and OTP are required.', null, 400);
  }

  const user = await User.findOne({ mobile }).select('+otpHash +otpExpiresAt');

  if (!user) {
    return apiResponse.error(res, 'User with this mobile number does not exist.', null, 404);
  }

  if (user.role !== ROLES.CUSTOMER) {
    return apiResponse.error(res, 'Vendor accounts must use vendor email login.', null, 403);
  }

  if (user.status === 'BLOCKED') {
    return apiResponse.error(res, 'Your account has been suspended by Admin.', null, 403);
  }

  const verification = verifyOTP(otp, user.otpHash, user.otpExpiresAt);
  if (!verification.valid) {
    return apiResponse.error(res, verification.reason, null, 400);
  }

  // Clear OTP fields after successful verification
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  await user.save();

  const token = generateToken(user._id);
  const vendor = user.role === ROLES.VENDOR ? await Vendor.findOne({ owner: user._id }) : null;

  return apiResponse.success(res, 'Login successful!', {
    token,
    user: {
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      role: user.role,
      profileImage: user.profileImage
    },
    vendor
  });
});

// Vendor Registration
exports.registerVendor = asyncWrapper(async (req, res) => {
  const { ownerName, mobile, email, stallName, description, cuisineType, address, openingHours } = req.body;
  const normalizedEmail = email?.trim().toLowerCase();

  if (!mobile || !normalizedEmail || !stallName) {
    return apiResponse.error(res, 'Mobile number, email address, and stall name are required.', null, 400);
  }

  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
    return apiResponse.error(res, 'Please provide a valid email address.', null, 400);
  }

  let user = await User.findOne({ mobile });
  if (user) {
    return apiResponse.error(res, 'User with this mobile number already exists.', null, 400);
  }

  const vendorWithEmail = await Vendor.findOne({ registrationEmail: normalizedEmail });
  const vendorUserWithEmail = await User.findOne({ email: normalizedEmail, role: ROLES.VENDOR });
  if (vendorWithEmail || vendorUserWithEmail) {
    return apiResponse.error(res, 'A vendor is already registered with this email address.', null, 400);
  }

  user = await User.create({
    name: ownerName || stallName,
    mobile,
    email: normalizedEmail,
    role: ROLES.VENDOR
  });

  const slug = stallName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + `-${Date.now().toString().slice(-4)}`;

  const vendor = await Vendor.create({
    owner: user._id,
    registrationEmail: normalizedEmail,
    stallName,
    slug,
    description: description || 'Authentic fresh local street food.',
    cuisineType: Array.isArray(cuisineType) ? cuisineType : ['Street Food', 'Snacks'],
    address: address || { street: 'Main Market Square', city: 'Delhi', pincode: '110001' },
    openingHours: openingHours || { openTime: '09:00', closeTime: '22:00' },
    status: VENDOR_STATUS.PENDING // Requires Super Admin approval
  });

  return apiResponse.success(res, 'Vendor application submitted! Pending Admin approval.', {
    user: {
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      role: user.role
    },
    vendor: {
      id: vendor._id,
      stallName: vendor.stallName,
      status: vendor.status
    }
  }, 201);
});

// Vendor & Admin Password Login
exports.loginWithPassword = asyncWrapper(async (req, res) => {
  const { mobile, email, password } = req.body;

  if ((!mobile && !email) || !password) {
    return apiResponse.error(res, 'Please provide mobile/email and password.', null, 400);
  }

  const query = mobile ? { mobile } : { email: email.toLowerCase() };
  const user = await User.findOne(query).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return apiResponse.error(res, 'Invalid credentials entered.', null, 401);
  }

  if (user.status === 'BLOCKED') {
    return apiResponse.error(res, 'Your account has been suspended by Admin.', null, 403);
  }

  let vendorData = null;
  if (user.role === ROLES.VENDOR) {
    vendorData = await Vendor.findOne({ owner: user._id });
  }

  const token = generateToken(user._id);

  return apiResponse.success(res, 'Login successful!', {
    token,
    user: {
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      role: user.role
    },
    vendor: vendorData
  });
});

// Get Current Logged-in User Profile
exports.getMe = asyncWrapper(async (req, res) => {
  const user = req.user;
  let vendor = null;

  if (user.role === ROLES.VENDOR) {
    vendor = await Vendor.findOne({ owner: user._id });
  }

  return apiResponse.success(res, 'Profile fetched', {
    user,
    vendor
  });
});
