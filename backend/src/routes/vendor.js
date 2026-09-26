const express = require('express');
const bcrypt = require('bcryptjs');
const Vendor = require('../models/Vendor');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Review = require('../models/Review');
const { requireVendor } = require('../middleware/auth');
const orders = require('../services/orders');
const payments = require('../services/payments');
const { HttpError, validate, objectId, dayKey, lastDayKeys, randomCode, parseImageDataUrl, encryptSecret, z } = require('../utils');

// Everything here is for the logged-in vendor's dashboard
const router = express.Router();
router.use(requireVendor);

/* ---------------------------------- Profile & settings ---------------------------------- */

const profileSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    shopName: z.string().trim().min(2, 'Shop name is too short').max(80),
    phone: z.string().trim().max(15),
    description: z.string().trim().max(300),
    address: z.string().trim().max(200),
    openingHours: z.string().trim().max(60),
    // data:image/...;base64 string to set, null to remove
    cover: z.string().nullable(),
    logo: z.string().nullable(),
    isOpen: z.boolean(),
    acceptCounter: z.boolean(),
    acceptOnline: z.boolean(),
  })
  .partial();

/** field = "cover" | "logo"; value = data URL to set, null to remove, undefined to keep */
function setShopImage(vendor, field, value) {
  if (value === undefined) return;
  if (value === null) {
    vendor[field] = undefined;
    vendor[`${field}UpdatedAt`] = null;
  } else {
    vendor[field] = parseImageDataUrl(value, 2 * 1024 * 1024);
    vendor[`${field}UpdatedAt`] = new Date();
  }
}

/** Customers must always have some way to pay. */
function assertCanTakePayment(vendor) {
  if (vendor.acceptCounter || (vendor.acceptOnline && vendor.onlinePaymentMode)) return;
  throw new HttpError(
    400,
    vendor.acceptOnline
      ? 'Keep "Pay at counter" on until your Razorpay account is connected'
      : 'Keep at least one payment option switched on'
  );
}

router.patch('/profile', async (req, res) => {
  const { cover, logo, ...data } = validate(profileSchema, req.body);
  const vendor = req.vendor;
  Object.assign(vendor, data);
  setShopImage(vendor, 'cover', cover);
  setShopImage(vendor, 'logo', logo);
  assertCanTakePayment(vendor);
  await vendor.save();
  res.json({ vendor });
});

/* ------------------------------------ Razorpay account ------------------------------------ */

const razorpaySchema = z.object({
  keyId: z
    .string()
    .trim()
    .regex(/^rzp_(test|live)_[A-Za-z0-9]+$/, 'Key ID should look like rzp_test_... or rzp_live_...'),
  keySecret: z.string().trim().min(10, 'Please paste your Key Secret').max(100),
  webhookSecret: z.string().trim().max(100).optional().or(z.literal('')),
});

// Connect (or change) the vendor's own Razorpay account. Their online payments go straight to it.
router.put('/razorpay', async (req, res) => {
  const { keyId, keySecret, webhookSecret } = validate(razorpaySchema, req.body);
  await payments.checkKeys(keyId, keySecret);

  const vendor = await Vendor.findById(req.vendor._id).select('+razorpayKeySecret');
  vendor.razorpayKeyId = keyId;
  vendor.razorpayKeySecret = encryptSecret(keySecret);
  vendor.razorpayWebhookSecret = webhookSecret ? encryptSecret(webhookSecret) : '';
  await vendor.save();
  res.json({ vendor });
});

router.delete('/razorpay', async (req, res) => {
  const vendor = await Vendor.findById(req.vendor._id).select('+razorpayKeySecret');
  vendor.razorpayKeyId = '';
  vendor.razorpayKeySecret = '';
  vendor.razorpayWebhookSecret = '';
  if (!vendor.acceptCounter && !vendor.onlinePaymentMode) {
    throw new HttpError(400, 'Turn on "Pay at counter" first, otherwise customers will have no way to pay you');
  }
  await vendor.save();
  res.json({ vendor });
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
});

router.post('/password', async (req, res) => {
  const { currentPassword, newPassword } = validate(passwordSchema, req.body);
  const vendor = await Vendor.findById(req.vendor._id).select('+passwordHash');
  if (!(await bcrypt.compare(currentPassword, vendor.passwordHash))) {
    throw new HttpError(400, 'Current password is wrong');
  }
  vendor.passwordHash = await bcrypt.hash(newPassword, 10);
  await vendor.save();
  res.json({ message: 'Password changed' });
});

/* ------------------------------------------ Menu ------------------------------------------ */

const itemSchema = z.object({
  name: z.string().trim().min(1, 'Please enter the dish name').max(80),
  description: z.string().trim().max(300).optional(),
  price: z.number({ invalid_type_error: 'Please enter a price' }).min(0, 'Price cannot be negative').max(100000),
  category: z.string().trim().max(40).optional(),
  isVeg: z.boolean().optional(),
  prepTime: z.number().int().min(1).max(180).optional(),
  isAvailable: z.boolean().optional(),
  // data:image/...;base64 string to set a photo, null to remove it, leave out to keep it
  image: z.string().nullable().optional(),
});

function applyItemData(item, data) {
  const { image, ...fields } = data;
  if (fields.price !== undefined) fields.price = Math.round(fields.price * 100) / 100;
  if (fields.category !== undefined) fields.category = fields.category || 'Main';
  Object.assign(item, fields);

  if (image === null) {
    item.image = undefined;
    item.imageUpdatedAt = null;
  } else if (typeof image === 'string') {
    item.image = parseImageDataUrl(image);
    item.imageUpdatedAt = new Date();
  }
}

router.get('/menu', async (req, res) => {
  const items = await MenuItem.find({ vendor: req.vendor._id }).sort({ category: 1, createdAt: 1 });
  res.json({ items });
});

router.post('/menu', async (req, res) => {
  const data = validate(itemSchema, req.body);
  const item = new MenuItem({ vendor: req.vendor._id });
  applyItemData(item, data);
  await item.save();
  res.status(201).json({ item });
});

async function findOwnItem(req) {
  const id = validate(objectId, req.params.id);
  const item = await MenuItem.findOne({ _id: id, vendor: req.vendor._id });
  if (!item) throw new HttpError(404, 'Menu item not found');
  return item;
}

router.patch('/menu/:id', async (req, res) => {
  const data = validate(itemSchema.partial(), req.body);
  const item = await findOwnItem(req);
  applyItemData(item, data);
  await item.save();
  res.json({ item });
});

router.delete('/menu/:id', async (req, res) => {
  const item = await findOwnItem(req);
  await item.deleteOne();
  res.json({ message: 'Deleted' });
});

/* ----------------------------------------- Tables ----------------------------------------- */

const MAX_TABLES = 100;
const tableName = z.string().trim().min(1, 'Please enter a table name').max(30);

function assertUniqueName(vendor, name, exceptCode) {
  const clash = vendor.tables.find((t) => t.code !== exceptCode && t.name.toLowerCase() === name.toLowerCase());
  if (clash) throw new HttpError(409, `You already have a table called "${name}"`);
}

function newTableCode(vendor) {
  let code;
  do code = randomCode(5);
  while (vendor.tables.some((t) => t.code === code));
  return code;
}

// Add one or more tables: { names: ["Table 1", "Table 2"] }
router.post('/tables', async (req, res) => {
  const { names } = validate(z.object({ names: z.array(tableName).min(1).max(50) }), req.body);
  const vendor = req.vendor;
  if (vendor.tables.length + names.length > MAX_TABLES) {
    throw new HttpError(400, `You can have up to ${MAX_TABLES} tables`);
  }
  for (const name of names) {
    assertUniqueName(vendor, name);
    vendor.tables.push({ code: newTableCode(vendor), name });
  }
  await vendor.save();
  res.status(201).json({ vendor });
});

function findTable(vendor, code) {
  const table = vendor.tables.find((t) => t.code === String(code).toUpperCase());
  if (!table) throw new HttpError(404, 'Table not found');
  return table;
}

router.patch('/tables/:code', async (req, res) => {
  const { name } = validate(z.object({ name: tableName }), req.body);
  const table = findTable(req.vendor, req.params.code);
  assertUniqueName(req.vendor, name, table.code);
  table.name = name;
  await req.vendor.save();
  res.json({ vendor: req.vendor });
});

router.delete('/tables/:code', async (req, res) => {
  const table = findTable(req.vendor, req.params.code);
  req.vendor.tables = req.vendor.tables.filter((t) => t.code !== table.code);
  await req.vendor.save();
  res.json({ vendor: req.vendor });
});

/* ----------------------------------------- Orders ----------------------------------------- */

router.get('/orders', async (req, res) => {
  const scope = req.query.scope === 'history' ? 'history' : 'active';
  const query =
    scope === 'active'
      ? Order.find({ vendor: req.vendor._id, status: { $in: Order.ACTIVE_STATUSES } }).sort({ createdAt: 1 })
      : Order.find({ vendor: req.vendor._id, status: { $in: ['completed', 'rejected', 'cancelled'] } })
          .sort({ updatedAt: -1 })
          .limit(100);
  res.json({ orders: await query });
});

async function findOwnOrder(req) {
  const id = validate(objectId, req.params.id);
  const order = await Order.findOne({ _id: id, vendor: req.vendor._id });
  if (!order) throw new HttpError(404, 'Order not found');
  return order;
}

const statusSchema = z.object({
  status: z.enum(['preparing', 'ready', 'completed', 'rejected']),
  reason: z.string().trim().max(200).optional(),
});

router.patch('/orders/:id/status', async (req, res) => {
  const { status, reason } = validate(statusSchema, req.body);
  const order = await orders.vendorSetStatus(await findOwnOrder(req), status, reason);
  res.json({ order });
});

router.post('/orders/:id/mark-paid', async (req, res) => {
  const order = await orders.vendorMarkCashPaid(await findOwnOrder(req));
  res.json({ order });
});

/* ------------------------------------- Stats & reviews ------------------------------------- */

router.get('/stats', async (req, res) => {
  const vendorId = req.vendor._id;
  const days = lastDayKeys(7);
  const today = dayKey();

  const [recentOrders, unpaidCounter, items] = await Promise.all([
    Order.find({ vendor: vendorId, dayKey: { $in: days }, status: { $ne: 'awaiting_payment' } })
      .select('dayKey total status paymentStatus')
      .lean(),
    Order.find({
      vendor: vendorId,
      status: { $in: Order.ACTIVE_STATUSES },
      paymentStatus: 'pending',
    })
      .select('total')
      .lean(),
    MenuItem.find({ vendor: vendorId }),
  ]);

  const counted = recentOrders.filter((o) => !['rejected', 'cancelled'].includes(o.status));
  const daily = days.map((day) => {
    const ofDay = counted.filter((o) => o.dayKey === day);
    return {
      day,
      orders: ofDay.length,
      revenue: ofDay.filter((o) => o.paymentStatus === 'paid').reduce((s, o) => s + o.total, 0),
    };
  });
  const todayStats = daily.find((d) => d.day === today);

  const activeOrders = await Order.countDocuments({ vendor: vendorId, status: { $in: Order.ACTIVE_STATUSES } });

  res.json({
    today: {
      orders: todayStats.orders,
      revenue: todayStats.revenue,
      activeOrders,
      cashToCollect: unpaidCounter.reduce((s, o) => s + o.total, 0),
    },
    rating: req.vendor.rating,
    ratingCount: req.vendor.ratingCount,
    daily,
    bestSellers: [...items]
      .filter((i) => i.orderCount > 0)
      .sort((a, b) => b.orderCount - a.orderCount)
      .slice(0, 5),
    topRated: [...items]
      .filter((i) => i.ratingCount > 0)
      .sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount)
      .slice(0, 5),
    menuCount: items.length,
  });
});

router.get('/reviews', async (req, res) => {
  const reviews = await Review.find({ vendor: req.vendor._id }).sort({ createdAt: -1 }).limit(200);
  res.json({ reviews, rating: req.vendor.rating, ratingCount: req.vendor.ratingCount });
});

module.exports = router;
