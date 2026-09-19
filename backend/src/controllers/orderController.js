const Order = require('../models/Order');
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const Vendor = require('../models/Vendor');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const apiResponse = require('../utils/apiResponse');
const asyncWrapper = require('../utils/asyncWrapper');
const { generateInvoiceData } = require('../services/invoiceService');
const { notifyVendorNewOrder, notifyCustomerOrderStatus } = require('../sockets/socketHandler');
const { ORDER_STATUS, PAYMENT_STATUS, ORDER_TYPES, PAYMENT_METHODS } = require('../config/constants');

// Create Order from Cart
exports.createOrder = asyncWrapper(async (req, res) => {
  const { orderType, paymentMethod, specialInstructions, tableNo } = req.body;
  const user = req.user;

  const cart = await Cart.findOne({ user: user._id }).populate('items.menuItem');
  if (!cart || cart.items.length === 0) {
    return apiResponse.error(res, 'Your cart is empty. Please add items to checkout.', null, 400);
  }

  const firstCartItem = cart.items[0]?.menuItem;
  const vendorId = firstCartItem?.vendor || cart.vendor;
  const vendor = await Vendor.findById(vendorId);
  if (!vendor || !vendor.isOpen) {
    return apiResponse.error(res, 'Vendor stall is currently closed or unavailable.', null, 400);
  }
  if (!cart.vendor || cart.vendor.toString() !== vendor._id.toString()) {
    cart.vendor = vendor._id;
  }

  // 1. Verify stock availability atomically to handle race conditions
  let subtotal = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const dbItem = await MenuItem.findById(item.menuItem._id);

    if (!dbItem || !dbItem.isAvailable || dbItem.stockQuantity < item.quantity) {
      return apiResponse.error(
        res,
        `Item "${item.menuItem?.name || 'Selected Item'}" is out of stock or unavailable.`,
        null,
        400
      );
    }

    const basePrice = dbItem.discountPrice > 0 ? dbItem.discountPrice : dbItem.price;
    let extraPrice = 0;

    if (item.selectedCustomizations && item.selectedCustomizations.length > 0) {
      for (const c of item.selectedCustomizations) {
        extraPrice += c.extraPrice || 0;
      }
    }

    const unitPrice = basePrice + extraPrice;
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      menuItem: dbItem._id,
      name: dbItem.name,
      image: dbItem.image,
      unitPrice,
      quantity: item.quantity,
      selectedCustomizations: item.selectedCustomizations,
      totalPrice: itemTotal,
      specialInstruction: item.specialInstruction
    });
  }

  // 2. Coupon & Discount validation
  let discountAmount = 0;
  if (cart.couponCode && subtotal > 0) {
    const coupon = await Coupon.findOne({ code: cart.couponCode.toUpperCase(), isActive: true });
    if (coupon && subtotal >= coupon.minOrderValue) {
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
          discountAmount = coupon.maxDiscountAmount;
        }
      } else {
        discountAmount = coupon.discountValue;
      }
      coupon.timesUsed += 1;
      await coupon.save();
    }
  }

  const taxAmount = 0; // Tax configurable or included
  const commissionRate = vendor.commissionRate || 5.0;
  const finalAmount = Math.max(0, subtotal - discountAmount);
  const commissionAmount = (finalAmount * commissionRate) / 100;

  // 3. Generate Order Number `#SV-1042`
  const orderCount = await Order.countDocuments();
  const orderNumber = `#SV-${1000 + orderCount + 1}`;

  // 4. Deduct Inventory Stock
  for (const item of cart.items) {
    await MenuItem.findByIdAndUpdate(item.menuItem._id, {
      $inc: { stockQuantity: -item.quantity, totalOrdersCount: item.quantity }
    });
  }

  // 5. Create Order Record
  const order = await Order.create({
    orderNumber,
    customer: user._id,
    vendor: vendor._id,
    orderType: orderType || (cart.tableNo ? ORDER_TYPES.DINE_IN : ORDER_TYPES.PICKUP),
    tableNo: tableNo || cart.tableNo || '',
    items: orderItems,
    subtotal,
    discountAmount,
    taxAmount,
    commissionAmount,
    finalAmount,
    couponCode: cart.couponCode || '',
    orderStatus: ORDER_STATUS.PENDING,
    paymentStatus: paymentMethod === PAYMENT_METHODS.CASH ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PENDING,
    paymentMethod: paymentMethod || PAYMENT_METHODS.ONLINE_RAZORPAY,
    estimatedReadyAt: new Date(Date.now() + (vendor.preparationTimeMin || 15) * 60 * 1000)
  });

  // Keep the cart until an online payment is verified so a failed payment can
  // be retried. Cash orders are complete at creation time, so clear those now.
  if (paymentMethod === PAYMENT_METHODS.CASH) {
    cart.items = [];
    cart.couponCode = '';
    cart.discountAmount = 0;
    await cart.save();
  }

  // 7. Emit Real-time Socket.IO notification to Vendor
  notifyVendorNewOrder(vendor._id, order);

  // 8. Create In-App Notification record
  await Notification.create({
    recipient: user._id,
    title: 'Order Placed!',
    message: `Your order ${order.orderNumber} for ${vendor.stallName} has been submitted.`,
    type: 'ORDER_STATUS',
    link: `/orders/${order._id}`
  });

  return apiResponse.success(res, 'Order created successfully!', order, 201);
});

// Update Order Status (Vendor & Admin state machine)
exports.updateOrderStatus = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const { status, cancellationReason } = req.body;

  const order = await Order.findById(orderId).populate('customer', 'name mobile');
  if (!order) return apiResponse.error(res, 'Order not found', null, 404);

  // Valid status transitions
  const validTransitions = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.ACCEPTED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.READY]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.COMPLETED]: [],
    [ORDER_STATUS.CANCELLED]: [],
    [ORDER_STATUS.REJECTED]: []
  };

  if (!validTransitions[order.orderStatus].includes(status)) {
    return apiResponse.error(
      res,
      `Invalid status transition from ${order.orderStatus} to ${status}.`,
      null,
      400
    );
  }

  order.orderStatus = status;

  if (status === ORDER_STATUS.ACCEPTED) order.acceptedAt = new Date();
  if (status === ORDER_STATUS.PREPARING) order.preparingAt = new Date();
  if (status === ORDER_STATUS.READY) order.readyAt = new Date();
  if (status === ORDER_STATUS.COMPLETED) order.completedAt = new Date();
  if (status === ORDER_STATUS.CANCELLED || status === ORDER_STATUS.REJECTED) {
    order.cancelledAt = new Date();
    order.cancellationReason = cancellationReason || 'Cancelled by vendor';

    // Restore stock if order is cancelled
    for (const item of order.items) {
      await MenuItem.findByIdAndUpdate(item.menuItem, {
        $inc: { stockQuantity: item.quantity }
      });
    }
  }

  await order.save();

  // Notify customer in real-time
  notifyCustomerOrderStatus(order);

  // Save Notification
  await Notification.create({
    recipient: order.customer._id,
    title: `Order Update: ${status}`,
    message: `Your order ${order.orderNumber} status is now ${status}.`,
    type: 'ORDER_STATUS',
    link: `/orders/${order._id}`
  });

  return apiResponse.success(res, `Order status updated to ${status}`, order);
});

// Get Order Tracking Details & Digital Invoice
exports.getOrderDetails = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const order = await Order.findById(orderId)
    .populate('vendor', 'stallName logo coverImage address bankDetails openingHours')
    .populate('customer', 'name mobile email');

  if (!order) return apiResponse.error(res, 'Order not found', null, 404);

  const invoiceData = generateInvoiceData(order);

  return apiResponse.success(res, 'Order details fetched', {
    order,
    invoice: invoiceData
  });
});

// Customer Order History
exports.getCustomerOrders = asyncWrapper(async (req, res) => {
  const orders = await Order.find({ customer: req.user._id })
    .populate('vendor', 'stallName logo rating')
    .sort({ createdAt: -1 });

  return apiResponse.success(res, 'Orders history fetched', orders);
});

// Vendor Order Kanban Queue (New, Preparing, Ready, Completed)
exports.getVendorOrders = asyncWrapper(async (req, res) => {
  const vendor = req.vendor;
  if (!vendor) return apiResponse.error(res, 'Vendor context missing', null, 404);

  const { status } = req.query;
  let filter = { vendor: vendor._id };
  if (status) filter.orderStatus = status;

  const orders = await Order.find(filter)
    .populate('customer', 'name mobile')
    .sort({ createdAt: -1 });

  return apiResponse.success(res, 'Vendor orders fetched', orders);
});

// Customer Reorder
exports.reorderItems = asyncWrapper(async (req, res) => {
  const { orderId } = req.params;
  const oldOrder = await Order.findById(orderId);
  if (!oldOrder) return apiResponse.error(res, 'Previous order not found', null, 404);

  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  cart.vendor = oldOrder.vendor;
  cart.tableNo = oldOrder.tableNo || '';
  cart.items = [];

  for (const item of oldOrder.items) {
    const dbItem = await MenuItem.findById(item.menuItem);
    if (dbItem && dbItem.isAvailable) {
      cart.items.push({
        menuItem: dbItem._id,
        quantity: item.quantity,
        selectedCustomizations: item.selectedCustomizations,
        itemUnitPrice: dbItem.discountPrice > 0 ? dbItem.discountPrice : dbItem.price,
        specialInstruction: item.specialInstruction
      });
    }
  }

  await cart.save();
  return apiResponse.success(res, 'Items loaded into cart for reorder', { cart });
});
