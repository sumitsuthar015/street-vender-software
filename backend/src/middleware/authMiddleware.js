const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const apiResponse = require('../utils/apiResponse');

const authenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return apiResponse.error(res, 'Authentication token missing. Please log in.', null, 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_street_vendor_2026_safe');
    const user = await User.findById(decoded.id);

    if (!user || user.status === 'BLOCKED') {
      return apiResponse.error(res, 'User account is invalid or blocked.', null, 403);
    }

    req.user = user;

    // If user is a vendor, attach vendor context
    if (user.role === 'VENDOR') {
      const vendor = await Vendor.findOne({ owner: user._id });
      if (vendor) {
        req.vendor = vendor;
      }
    }

    next();
  } catch (error) {
    return apiResponse.error(res, 'Invalid or expired token.', error.message, 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return apiResponse.error(res, 'Unauthorized access.', null, 401);
    }
    if (!roles.includes(req.user.role)) {
      return apiResponse.error(
        res,
        `Access denied. Requires one of roles: [${roles.join(', ')}]`,
        null,
        403
      );
    }
    next();
  };
};

// Optional auth: attaches user/vendor if token is present, but never blocks the request.
// Used for GET routes that are public for customers but need vendor context for the vendor portal.
const optionalAuthenticate = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_jwt_key_street_vendor_2026_safe');
    const user = await User.findById(decoded.id);

    if (user && user.status !== 'BLOCKED') {
      req.user = user;
      if (user.role === 'VENDOR') {
        const vendor = await Vendor.findOne({ owner: user._id });
        if (vendor) req.vendor = vendor;
      }
    }
  } catch (_) {
    // Silently ignore invalid/expired tokens on optional routes
  }
  next();
};

module.exports = { authenticate, authorize, optionalAuthenticate };
