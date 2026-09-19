const Review = require('../models/Review');
const Order = require('../models/Order');
const Vendor = require('../models/Vendor');
const apiResponse = require('../utils/apiResponse');
const asyncWrapper = require('../utils/asyncWrapper');
const { ORDER_STATUS } = require('../config/constants');

// Submit Review (Verified Purchase Check)
exports.createReview = asyncWrapper(async (req, res) => {
  const { orderId, rating, comment } = req.body;
  const user = req.user;

  if (!orderId || !rating || rating < 1 || rating > 5) {
    return apiResponse.error(res, 'Valid Order ID and Rating (1-5) required.', null, 400);
  }

  // Check if order exists and belongs to this customer & is COMPLETED
  const order = await Order.findOne({ _id: orderId, customer: user._id });

  if (!order) {
    return apiResponse.error(res, 'Order not found or does not belong to user.', null, 404);
  }

  if (order.orderStatus !== ORDER_STATUS.COMPLETED) {
    return apiResponse.error(res, 'You can only review completed orders.', null, 400);
  }

  const existing = await Review.findOne({ order: order._id, customer: user._id });
  if (existing) {
    return apiResponse.error(res, 'You have already submitted a review for this order.', null, 400);
  }

  const review = await Review.create({
    customer: user._id,
    vendor: order.vendor,
    order: order._id,
    rating,
    comment: comment || '',
    verifiedPurchase: true
  });

  // Recalculate Vendor Rating
  const allReviews = await Review.find({ vendor: order.vendor });
  const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = (totalRating / allReviews.length).toFixed(1);

  await Vendor.findByIdAndUpdate(order.vendor, {
    rating: parseFloat(avgRating),
    totalReviews: allReviews.length
  });

  return apiResponse.success(res, 'Review submitted successfully!', review, 201);
});

// Get Vendor Reviews
exports.getVendorReviews = asyncWrapper(async (req, res) => {
  const { vendorId } = req.params;
  const reviews = await Review.find({ vendor: vendorId, isModerated: false })
    .populate('customer', 'name profileImage')
    .sort({ createdAt: -1 });

  return apiResponse.success(res, 'Vendor reviews fetched', reviews);
});

// Report Review
exports.reportReview = asyncWrapper(async (req, res) => {
  const { reviewId } = req.params;
  await Review.findByIdAndUpdate(reviewId, { isReported: true });
  return apiResponse.success(res, 'Review reported for moderation');
});
