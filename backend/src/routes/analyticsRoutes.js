const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.get('/vendor', authenticate, authorize(ROLES.VENDOR), analyticsController.getVendorAnalytics);

module.exports = router;
