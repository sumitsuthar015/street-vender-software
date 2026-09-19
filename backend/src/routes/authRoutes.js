const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/mobile/otp-request', authController.requestMobileOTP);
router.post('/mobile/otp-verify', authController.verifyMobileOTP);
router.post('/email/otp-request', authController.requestEmailOTP);
router.post('/email/otp-verify', authController.verifyEmailOTP);
router.post('/vendor/register', authController.registerVendor);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
