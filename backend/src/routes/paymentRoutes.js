const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);

router.post('/razorpay-order', paymentController.createRazorpayOrder);
router.post('/verify-signature', paymentController.verifyPaymentSignature);
router.post('/refund', authorize(ROLES.VENDOR, ROLES.ADMIN), paymentController.processRefund);

module.exports = router;
