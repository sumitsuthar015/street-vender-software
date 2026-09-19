const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.get('/active', couponController.getActiveCoupons);
router.post('/create', authenticate, authorize(ROLES.VENDOR, ROLES.ADMIN), couponController.createCoupon);

module.exports = router;
