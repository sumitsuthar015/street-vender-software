const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const apiResponse = require('../utils/apiResponse');
const asyncWrapper = require('../utils/asyncWrapper');
const razorpayService = require('../config/razorpay');
const { PAYMENT_STATUS, ORDER_STATUS } = require('../config/constants');
const { notifyCustomerOrderStatus } = require('../sockets/socketHandler');

// 1. Create Razorpay Payment Order
exports.createRazorpayOrder = asyncWrapper(async (req, res) => {
  const { orderId } = req.body;
  const order = await Order.findById(orderId);

  if (!order) {
    return apiResponse.error(res, 'Order not found', null, 404);
  }

  const amountInPaisa = Math.round(order.finalAmount * 100);

  // Call Razorpay Service (supports production & mock sandbox)
  const razorpayOrder = await razorpayService.createOrder(
    amountInPaisa,
    'INR',
    `receipt_${order.orderNumber}`
  );

  // Store payment initialization log
  await Payment.create({
    order: order._id,
    customer: req.user._id,
    vendor: order.vendor,
    razorpayOrderId: razorpayOrder.id,
    amount: order.finalAmount,
    currency: 'INR',
    status: PAYMENT_STATUS.PENDING
  });

  return apiResponse.success(res, 'Razorpay order created', {
    razorpayOrderId: razorpayOrder.id,
    amount: amountInPaisa,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock1234567890',
    orderNumber: order.orderNumber,
    isMock: razorpayOrder.mock || false
  });
});

// 2. Verify Razorpay Payment Signature
exports.verifyPaymentSignature = asyncWrapper(async (req, res) => {
  const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return apiResponse.error(res, 'Order not found', null, 404);

  const isValid = razorpayService.verifySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);

  if (!isValid) {
    order.paymentStatus = PAYMENT_STATUS.FAILED;
    await order.save();
    return apiResponse.error(res, 'Payment signature verification failed.', null, 400);
  }

  // Payment successful!
  order.paymentStatus = PAYMENT_STATUS.PAID;
  order.paymentMethod = 'ONLINE_RAZORPAY';
  await order.save();

  const cart = await Cart.findOne({ user: order.customer });
  if (cart) {
    cart.items = [];
    cart.couponCode = '';
    cart.discountAmount = 0;
    await cart.save();
  }

  // Update Payment record
  await Payment.findOneAndUpdate(
    { order: order._id, razorpayOrderId },
    {
      razorpayPaymentId: razorpayPaymentId || `pay_mock_${Date.now()}`,
      razorpaySignature: razorpaySignature || 'mock_signature_valid',
      status: PAYMENT_STATUS.PAID
    },
    { upsert: true }
  );

  notifyCustomerOrderStatus(order);

  await Notification.create({
    recipient: order.customer,
    title: 'Payment Successful!',
    message: `Payment of ₹${order.finalAmount} received for order ${order.orderNumber}.`,
    type: 'PAYMENT',
    link: `/orders/${order._id}`
  });

  return apiResponse.success(res, 'Payment verified & order confirmed successfully!', {
    orderId: order._id,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus
  });
});

// 3. Initiate Refund (Vendor / Admin action)
exports.processRefund = asyncWrapper(async (req, res) => {
  const { orderId, reason, amount } = req.body;

  const order = await Order.findById(orderId);
  if (!order) return apiResponse.error(res, 'Order not found', null, 404);

  if (order.paymentStatus !== PAYMENT_STATUS.PAID) {
    return apiResponse.error(res, 'Only paid orders can be refunded.', null, 400);
  }

  const refundAmount = amount || order.finalAmount;

  const payment = await Payment.findOne({ order: order._id });
  if (payment) {
    payment.status = PAYMENT_STATUS.REFUNDED;
    payment.refundId = `ref_mock_${Date.now()}`;
    payment.refundAmount = refundAmount;
    await payment.save();
  }

  order.paymentStatus = PAYMENT_STATUS.REFUNDED;
  order.orderStatus = ORDER_STATUS.CANCELLED;
  order.cancellationReason = `Refunded: ${reason || 'Vendor/Admin initiated refund'}`;
  await order.save();

  notifyCustomerOrderStatus(order);

  await Notification.create({
    recipient: order.customer,
    title: 'Refund Processed',
    message: `Refund of ₹${refundAmount} for order ${order.orderNumber} has been completed.`,
    type: 'PAYMENT',
    link: `/orders/${order._id}`
  });

  return apiResponse.success(res, 'Refund completed successfully', {
    orderId: order._id,
    refundAmount
  });
});
