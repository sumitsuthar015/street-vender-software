const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate);

// Customer endpoints
router.post('/create', orderController.createOrder);
router.get('/my-orders', orderController.getCustomerOrders);
router.get('/:orderId', orderController.getOrderDetails);
router.post('/:orderId/reorder', orderController.reorderItems);

// Vendor & Admin endpoints
router.get('/vendor/queue', authorize(ROLES.VENDOR, ROLES.ADMIN), orderController.getVendorOrders);
router.patch('/:orderId/status', authorize(ROLES.VENDOR, ROLES.ADMIN), orderController.updateOrderStatus);

module.exports = router;
