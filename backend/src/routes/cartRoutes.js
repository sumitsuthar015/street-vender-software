const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/item/:itemId', cartController.updateCartItem);
router.post('/coupon', cartController.applyCouponToCart);
router.delete('/clear', cartController.clearCart);

module.exports = router;
