const jwt = require('jsonwebtoken');
const config = require('../config');
const Vendor = require('../models/Vendor');
const { HttpError } = require('../utils');

function signToken(vendor) {
  return jwt.sign({ sub: String(vendor._id) }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwtSecret).sub;
  } catch {
    return null;
  }
}

/** Requires "Authorization: Bearer <token>" and puts the logged-in vendor on req.vendor. */
async function requireVendor(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const vendorId = token && verifyToken(token);
  if (!vendorId) throw new HttpError(401, 'Please log in again');

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new HttpError(401, 'Account not found, please log in again');

  req.vendor = vendor;
  next();
}

module.exports = { signToken, verifyToken, requireVendor };
