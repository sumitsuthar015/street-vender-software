const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const Vendor = require('../models/Vendor');
const { signToken, requireVendor } = require('../middleware/auth');
const { HttpError, validate, slugify, randomCode, z } = require('../utils');

const router = express.Router();

// Slows down password guessing
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  message: { message: 'Too many attempts. Please wait a few minutes and try again.' },
});

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Please enter your name').max(80),
  email: z.string().trim().toLowerCase().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  shopName: z.string().trim().min(2, 'Please enter your shop name').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,15}$/, 'Please enter a valid phone number')
    .optional()
    .or(z.literal('')),
});

async function uniqueSlug(shopName) {
  const base = slugify(shopName);
  if (!(await Vendor.exists({ slug: base }))) return base;
  return `${base}-${randomCode(4).toLowerCase()}`;
}

router.post('/register', authLimiter, async (req, res) => {
  const data = validate(registerSchema, req.body);
  if (await Vendor.exists({ email: data.email })) {
    throw new HttpError(409, 'An account with this email already exists. Please log in.');
  }

  const vendor = await Vendor.create({
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    passwordHash: await bcrypt.hash(data.password, 10),
    shopName: data.shopName,
    slug: await uniqueSlug(data.shopName),
  });

  res.status(201).json({ token: signToken(vendor), vendor });
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email'),
  password: z.string().min(1, 'Please enter your password'),
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = validate(loginSchema, req.body);
  const vendor = await Vendor.findOne({ email }).select('+passwordHash');
  if (!vendor || !(await bcrypt.compare(password, vendor.passwordHash))) {
    throw new HttpError(401, 'Wrong email or password');
  }
  res.json({ token: signToken(vendor), vendor });
});

router.get('/me', requireVendor, (req, res) => {
  res.json({ vendor: req.vendor });
});

module.exports = router;
