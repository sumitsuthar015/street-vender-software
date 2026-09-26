const express = require('express');
const rateLimit = require('express-rate-limit');
const Vendor = require('../models/Vendor');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Review = require('../models/Review');
const orders = require('../services/orders');
const payments = require('../services/payments');
const { HttpError, validate, objectId, shortName, z } = require('../utils');

// Customer-facing API (no login: customers scan the shop QR and order as guests)
const router = express.Router();

const orderLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  message: { message: 'Too many orders from this device. Please wait a few minutes.' },
});

const PUBLIC_SHOP_FIELDS =
  'shopName slug description address phone openingHours coverUpdatedAt logoUpdatedAt isOpen acceptCounter acceptOnline ratingSum ratingCount';

async function findShop(slug) {
  const vendor = await Vendor.findOne({ slug: String(slug).toLowerCase() });
  if (!vendor) throw new HttpError(404, 'Shop not found. Please scan the QR code again.');
  return vendor;
}

function publicShop(vendor) {
  return {
    id: String(vendor._id),
    shopName: vendor.shopName,
    slug: vendor.slug,
    description: vendor.description,
    address: vendor.address,
    phone: vendor.phone,
    openingHours: vendor.openingHours,
    coverUrl: vendor.coverUrl,
    logoUrl: vendor.logoUrl,
    isOpen: vendor.isOpen,
    rating: vendor.rating,
    ratingCount: vendor.ratingCount,
    payments: { counter: vendor.acceptCounter, online: vendor.acceptOnline },
  };
}

/* -------------------------------------------- Menu -------------------------------------------- */

router.get('/shops/:slug', async (req, res) => {
  const vendor = await findShop(req.params.slug);
  const items = await MenuItem.find({ vendor: vendor._id }).sort({ category: 1, createdAt: 1 });

  // Opened from a table QR (?table=CODE): tell the page which table it is (null if the code is unknown)
  let table;
  if (req.query.table) {
    const found = vendor.tables.find((t) => t.code === String(req.query.table).toUpperCase());
    table = found ? { code: found.code, name: found.name } : null;
  }
  res.json({ shop: publicShop(vendor), items, table });
});

router.get('/shops/:slug/items/:itemId/reviews', async (req, res) => {
  const vendor = await findShop(req.params.slug);
  const itemId = validate(objectId, req.params.itemId);
  const reviews = await Review.find({ vendor: vendor._id, item: itemId }).sort({ createdAt: -1 }).limit(50);
  res.json({
    reviews: reviews.map((r) => ({
      id: String(r._id),
      customerName: r.customerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
  });
});

/* ------------------------------------------ Ordering ------------------------------------------ */

const placeOrderSchema = z.object({
  customerName: z.string().trim().min(1, 'Please enter your name').max(60),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
  note: z.string().trim().max(200).optional(),
  paymentMethod: z.enum(['counter', 'online']),
  tableCode: z.string().trim().max(10).optional().or(z.literal('')),
  items: z
    .array(z.object({ itemId: objectId, qty: z.number().int().min(1).max(50) }))
    .min(1, 'Your cart is empty')
    .max(30),
});

router.post('/shops/:slug/orders', orderLimiter, async (req, res) => {
  const vendor = await findShop(req.params.slug);
  const data = validate(placeOrderSchema, req.body);
  const order = await orders.createOrder(vendor, data);
  const payment = order.paymentMethod === 'online' ? await payments.startOnlinePayment(order) : null;
  res.status(201).json({ code: order.code, payment });
});

async function findOrderByCode(code) {
  const order = await Order.findOne({ code: String(code).toUpperCase() });
  if (!order) throw new HttpError(404, 'Order not found');
  return order;
}

async function publicOrder(order) {
  const vendor = await Vendor.findById(order.vendor).select(PUBLIC_SHOP_FIELDS);
  const json = order.toJSON();
  delete json.payment.gatewayOrderId;
  return { ...json, shop: vendor ? publicShop(vendor) : null };
}

router.get('/orders/:code', async (req, res) => {
  res.json({ order: await publicOrder(await findOrderByCode(req.params.code)) });
});

router.post('/orders/:code/cancel', async (req, res) => {
  const order = await orders.customerCancel(await findOrderByCode(req.params.code));
  res.json({ order: await publicOrder(order) });
});

router.post('/orders/:code/switch-to-counter', async (req, res) => {
  const order = await findOrderByCode(req.params.code);
  const vendor = await Vendor.findById(order.vendor);
  await orders.switchToCounter(order, vendor);
  res.json({ order: await publicOrder(order) });
});

/* ------------------------------------------ Payments ------------------------------------------ */

async function findUnpaidOnlineOrder(code) {
  const order = await findOrderByCode(code);
  if (order.paymentMethod !== 'online' || order.paymentStatus !== 'pending' || order.status !== 'awaiting_payment') {
    throw new HttpError(409, 'This order does not need a payment');
  }
  return order;
}

// Start (or retry) an online payment
router.post('/orders/:code/pay', async (req, res) => {
  const order = await findUnpaidOnlineOrder(req.params.code);
  res.json({ payment: await payments.startOnlinePayment(order) });
});

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

// Razorpay Checkout calls this (through the browser) after a successful payment
router.post('/orders/:code/pay/verify', async (req, res) => {
  const data = validate(verifySchema, req.body);
  const order = await findOrderByCode(req.params.code);
  const valid =
    data.razorpay_order_id === order.payment.gatewayOrderId &&
    payments.verifyCheckoutSignature({
      gatewayOrderId: data.razorpay_order_id,
      paymentId: data.razorpay_payment_id,
      signature: data.razorpay_signature,
    });
  if (!valid) throw new HttpError(400, 'Payment could not be verified. If money was deducted, it will be refunded.');

  const updated = await orders.markPaid(order._id, {
    provider: 'razorpay',
    paymentId: data.razorpay_payment_id,
    gatewayOrderId: data.razorpay_order_id,
  });
  res.json({ order: await publicOrder(updated) });
});

// Simulated gateway used when no Razorpay keys are configured (development / demos only)
router.post('/orders/:code/pay/demo', async (req, res) => {
  if (payments.mode !== 'demo') throw new HttpError(404, 'Not found');
  const order = await findUnpaidOnlineOrder(req.params.code);
  const updated = await orders.markPaid(order._id, { provider: 'demo', paymentId: `demo_pay_${order.code}` });
  res.json({ order: await publicOrder(updated) });
});

/* ------------------------------------------ Reviews ------------------------------------------- */

const reviewsSchema = z.object({
  reviews: z
    .array(
      z.object({
        itemId: objectId,
        rating: z.number().int().min(1, 'Please pick 1 to 5 stars').max(5),
        comment: z.string().trim().max(500).optional(),
      })
    )
    .min(1, 'Please rate at least one dish')
    .max(30),
});

router.post('/orders/:code/reviews', async (req, res) => {
  const { reviews } = validate(reviewsSchema, req.body);
  const order = await findOrderByCode(req.params.code);
  if (order.status !== 'completed') throw new HttpError(409, 'You can rate the food after you receive your order');

  const saved = [];
  for (const review of reviews) {
    const line = order.items.find((l) => String(l.item) === review.itemId);
    if (!line || line.reviewed) continue;

    try {
      await Review.create({
        vendor: order.vendor,
        item: line.item,
        order: order._id,
        itemName: line.name,
        customerName: shortName(order.customerName),
        rating: review.rating,
        comment: review.comment || '',
      });
    } catch (err) {
      if (err.code === 11000) continue; // already rated (double tap)
      throw err;
    }
    line.reviewed = true;
    saved.push(review);
    await Promise.all([
      MenuItem.updateOne({ _id: line.item }, { $inc: { ratingSum: review.rating, ratingCount: 1 } }),
      Vendor.updateOne({ _id: order.vendor }, { $inc: { ratingSum: review.rating, ratingCount: 1 } }),
    ]);
  }

  if (!saved.length) throw new HttpError(409, 'You have already rated these dishes');
  await order.save();
  res.status(201).json({ order: await publicOrder(order) });
});

/* ------------------------------------------- Config ------------------------------------------- */

router.get('/config', (req, res) => {
  res.json({ paymentMode: payments.mode });
});

module.exports = router;
