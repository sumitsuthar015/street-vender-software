const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const env = (key, fallback) => {
  const value = process.env[key];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
};

const isProduction = env('NODE_ENV', 'development') === 'production';

const jwtSecret = env('JWT_SECRET');
if (!jwtSecret) {
  console.error('[config] JWT_SECRET is missing in backend/.env. Add a long random string, e.g. JWT_SECRET=change_me_to_something_long');
  process.exit(1);
}

const razorpayKeyId = env('RAZORPAY_KEY_ID');
const razorpayKeySecret = env('RAZORPAY_KEY_SECRET');
// Placeholder keys (like the "rzp_test_mock..." ones in old setups) can't talk to Razorpay,
// so treat them the same as "no keys" and fall back to the built-in demo payment screen.
const hasRealRazorpayKeys =
  Boolean(razorpayKeyId && razorpayKeySecret) &&
  !/mock|your_|xxxx/i.test(`${razorpayKeyId}${razorpayKeySecret}`);

module.exports = {
  isProduction,
  port: Number(env('PORT', 5001)),
  mongoUri: env('MONGODB_URI', 'mongodb://127.0.0.1:27017'),
  dbName: env('DB_NAME', 'street_vendor'),
  jwtSecret,
  jwtExpiresIn: env('JWT_EXPIRES_IN', '7d'),
  timezone: env('TIMEZONE', 'Asia/Kolkata'),
  payments: {
    // "razorpay" = real Razorpay checkout, "demo" = simulated gateway for development
    mode: hasRealRazorpayKeys ? 'razorpay' : 'demo',
    razorpayKeyId: hasRealRazorpayKeys ? razorpayKeyId : null,
    razorpayKeySecret: hasRealRazorpayKeys ? razorpayKeySecret : null,
    webhookSecret: env('RAZORPAY_WEBHOOK_SECRET'),
  },
};
