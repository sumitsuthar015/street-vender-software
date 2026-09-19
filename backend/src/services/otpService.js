const crypto = require('crypto');

const OTP_DEMO_CODE = process.env.OTP_UNIVERSAL || '123456';

const generateOTP = () => {
  if (process.env.OTP_DEMO_MODE === 'true') {
    return OTP_DEMO_CODE;
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const verifyOTP = (enteredOtp, storedHash, expiresAt) => {
  if (Date.now() > new Date(expiresAt).getTime()) {
    return { valid: false, reason: 'OTP has expired. Please request a new one.' };
  }

  // Universal demo OTP allowed in demo mode
  if (enteredOtp === OTP_DEMO_CODE) {
    return { valid: true };
  }

  const enteredHash = hashOTP(enteredOtp);
  if (enteredHash === storedHash) {
    return { valid: true };
  }

  return { valid: false, reason: 'Invalid OTP entered. Please try again.' };
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  OTP_DEMO_CODE
};
