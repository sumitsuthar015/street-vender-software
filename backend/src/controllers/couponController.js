const Coupon = require('../models/Coupon');
const apiResponse = require('../utils/apiResponse');
const asyncWrapper = require('../utils/asyncWrapper');

// Vendor / Admin Create Coupon
exports.createCoupon = asyncWrapper(async (req, res) => {
  const { code, discountType, discountValue, minOrderValue, maxDiscountAmount, validTill, usageLimit } = req.body;

  if (!code || !discountValue || !validTill) {
    return apiResponse.error(res, 'Code, discount value, and valid till date required.', null, 400);
  }

  const existing = await Coupon.findOne({ code: code.toUpperCase() });
  if (existing) {
    return apiResponse.error(res, `Coupon code "${code.toUpperCase()}" already exists.`, null, 400);
  }

  const vendorId = req.user.role === 'VENDOR' ? req.vendor._id : null;

  const coupon = await Coupon.create({
    code: code.toUpperCase(),
    discountType: discountType || 'PERCENTAGE',
    discountValue,
    minOrderValue: minOrderValue || 0,
    maxDiscountAmount: maxDiscountAmount || 100,
    vendor: vendorId,
    validTill,
    usageLimit: usageLimit || 1000
  });

  return apiResponse.success(res, 'Coupon created successfully', coupon, 201);
});

// List Active Coupons for User
exports.getActiveCoupons = asyncWrapper(async (req, res) => {
  const { vendorId } = req.query;
  let filter = {
    isActive: true,
    validTill: { $gte: new Date() }
  };

  if (vendorId) {
    filter.$or = [{ vendor: null }, { vendor: vendorId }];
  }

  const coupons = await Coupon.find(filter).sort({ createdAt: -1 });
  return apiResponse.success(res, 'Active coupons fetched', coupons);
});
