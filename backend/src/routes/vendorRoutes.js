const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

// Public storefront routes
router.get('/public', vendorController.getPublicVendors);
router.get('/public/:identifier', vendorController.getVendorByIdOrSlug);

// Vendor Store management routes
router.put('/profile', authenticate, authorize(ROLES.VENDOR), vendorController.updateVendorProfile);

// Table & QR management
router.get('/tables', authenticate, authorize(ROLES.VENDOR), vendorController.getVendorTables);
router.post('/tables', authenticate, authorize(ROLES.VENDOR), vendorController.createVendorTable);
router.delete('/tables/:tableId', authenticate, authorize(ROLES.VENDOR), vendorController.deleteVendorTable);

module.exports = router;
