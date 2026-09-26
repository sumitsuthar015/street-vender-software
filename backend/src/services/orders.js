const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Counter = require('../models/Counter');
const payments = require('./payments');
const { emitOrderChange } = require('./realtime');
const { HttpError, dayKey, randomCode } = require('../utils');

/** Moves an order into the vendor's queue and gives it today's next token number. */
async function placeInQueue(order) {
  order.dayKey = dayKey();
  order.token = await Counter.next(`token:${order.vendor}:${order.dayKey}`);
  order.setStatus('placed');
}

/**
 * Creates an order from what the customer picked. Prices always come from the database,
 * never from the browser, so nobody can change what they pay.
 */
async function createOrder(vendor, { customerName, customerPhone, note, paymentMethod, items, tableCode }) {
  if (!vendor.isOpen) throw new HttpError(409, `${vendor.shopName} is closed right now`);

  let table = null;
  if (tableCode) {
    table = vendor.tables.find((t) => t.code === tableCode.toUpperCase());
    if (!table) {
      throw new HttpError(400, "This table's QR code is not active anymore. Please order for pickup, or ask the shop.");
    }
  }
  if (paymentMethod === 'counter' && !vendor.acceptCounter) throw new HttpError(400, 'This shop only accepts online payment');
  if (paymentMethod === 'online' && !vendor.acceptOnline) throw new HttpError(400, 'This shop only accepts payment at the counter');

  // Merge duplicate lines (same item added twice)
  const quantities = new Map();
  for (const { itemId, qty } of items) quantities.set(itemId, (quantities.get(itemId) || 0) + qty);

  const menuItems = await MenuItem.find({ _id: { $in: [...quantities.keys()] }, vendor: vendor._id });
  if (menuItems.length !== quantities.size) {
    throw new HttpError(400, 'Some items in your cart are no longer on the menu. Please refresh the menu.');
  }
  const soldOut = menuItems.find((m) => !m.isAvailable);
  if (soldOut) throw new HttpError(409, `Sorry, ${soldOut.name} just sold out. Please remove it from your cart.`);

  const lines = menuItems.map((m) => ({
    item: m._id,
    name: m.name,
    price: m.price,
    isVeg: m.isVeg,
    qty: Math.min(quantities.get(String(m._id)), 50),
  }));
  const total = lines.reduce((sum, l) => sum + l.price * l.qty, 0);

  const order = new Order({
    vendor: vendor._id,
    code: randomCode(),
    dayKey: dayKey(),
    table: table ? { code: table.code, name: table.name } : null,
    customerName,
    customerPhone,
    note,
    items: lines,
    total,
    paymentMethod,
    status: 'awaiting_payment',
  });

  // Pay-at-counter orders go straight to the vendor. Online orders wait until payment succeeds.
  if (paymentMethod === 'counter') await placeInQueue(order);
  else order.setStatus('awaiting_payment');
  await order.save();
  if (order.status === 'placed') emitOrderChange(order, 'order:new');
  return order;
}

/**
 * Records a successful payment. Safe to call twice (checkout callback + webhook can both arrive):
 * only the first call changes anything.
 */
async function markPaid(orderId, { provider, paymentId = null, gatewayOrderId = null }) {
  const update = {
    paymentStatus: 'paid',
    'payment.provider': provider,
    'payment.paymentId': paymentId,
    'payment.paidAt': new Date(),
  };
  if (gatewayOrderId) update['payment.gatewayOrderId'] = gatewayOrderId;

  // $inc __v so any other request still holding the old version of this order fails instead of overwriting it
  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: 'pending' },
    { $set: update, $inc: { __v: 1 } },
    { new: true }
  );
  if (!order) return Order.findById(orderId); // already handled

  let event = 'order:updated';
  if (order.status === 'awaiting_payment') {
    await placeInQueue(order);
    event = 'order:new';
  } else if (order.status === 'cancelled' || order.status === 'rejected') {
    // Customer paid after the order was cancelled: give the money back
    await refundIfPaid(order);
  }
  await order.save();
  emitOrderChange(order, event);
  return order;
}

async function refundIfPaid(order) {
  if (order.paymentStatus !== 'paid') return;
  if (order.payment.provider === 'cash') {
    order.paymentStatus = 'refunded'; // vendor hands the cash back
    return;
  }
  const result = await payments.refund(order);
  order.paymentStatus = result.ok ? 'refunded' : 'refund_pending';
  order.payment.refundId = result.refundId || null;
}

// Which status a vendor can move an order to from its current status
const VENDOR_TRANSITIONS = {
  placed: ['preparing', 'ready', 'rejected'],
  preparing: ['ready', 'rejected'],
  ready: ['completed'],
};

async function vendorSetStatus(order, next, reason = '') {
  if (!VENDOR_TRANSITIONS[order.status]?.includes(next)) {
    throw new HttpError(409, `This order is already "${order.status}", it can't be changed to "${next}".`);
  }

  if (next === 'preparing') {
    const prepTimes = await MenuItem.find({ _id: { $in: order.items.map((i) => i.item) } }).select('prepTime');
    const minutes = Math.max(5, ...prepTimes.map((m) => m.prepTime || 0));
    order.estimatedReadyAt = new Date(Date.now() + minutes * 60000);
  }

  if (next === 'completed') {
    // Food handed over at the counter = cash collected
    if (order.paymentStatus === 'pending') {
      order.paymentStatus = 'paid';
      order.payment.provider = 'cash';
      order.payment.paidAt = new Date();
    }
    await MenuItem.bulkWrite(
      order.items.map((line) => ({
        updateOne: { filter: { _id: line.item }, update: { $inc: { orderCount: line.qty } } },
      }))
    );
  }

  if (next === 'rejected') await refundIfPaid(order);

  order.setStatus(next, next === 'rejected' ? reason || 'Rejected by the shop' : undefined);
  await order.save();
  emitOrderChange(order);
  return order;
}

async function vendorMarkCashPaid(order) {
  if (order.paymentStatus !== 'pending' || !Order.ACTIVE_STATUSES.includes(order.status)) {
    throw new HttpError(409, 'This order has no pending payment');
  }
  order.paymentStatus = 'paid';
  order.payment.provider = 'cash';
  order.payment.paidAt = new Date();
  await order.save();
  emitOrderChange(order);
  return order;
}

async function customerCancel(order) {
  if (!['awaiting_payment', 'placed'].includes(order.status)) {
    throw new HttpError(409, 'The shop has already started on your order, so it can no longer be cancelled.');
  }
  await refundIfPaid(order);
  order.setStatus('cancelled', 'Cancelled by customer');
  await order.save();
  emitOrderChange(order);
  return order;
}

/** An online order whose payment failed can be switched to "pay at counter" instead. */
async function switchToCounter(order, vendor) {
  if (order.status !== 'awaiting_payment' || order.paymentStatus !== 'pending') {
    throw new HttpError(409, 'This order is already confirmed');
  }
  if (!vendor.acceptCounter) throw new HttpError(400, 'This shop only accepts online payment');
  if (!vendor.isOpen) throw new HttpError(409, `${vendor.shopName} is closed right now`);
  order.paymentMethod = 'counter';
  await placeInQueue(order);
  await order.save();
  emitOrderChange(order, 'order:new');
  return order;
}

module.exports = { createOrder, markPaid, vendorSetStatus, vendorMarkCashPaid, customerCancel, switchToCounter };
