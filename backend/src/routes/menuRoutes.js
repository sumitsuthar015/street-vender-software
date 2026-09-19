const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticate, optionalAuthenticate } = require('../middleware/authMiddleware');

// Categories
// optionalAuthenticate: lets vendor portal fetch their OWN categories when logged in,
// while still allowing public store views (by vendorId param) without a token.
router.get('/categories/:vendorId?', optionalAuthenticate, menuController.getCategories);
router.post('/categories', authenticate, menuController.createCategory);
router.put('/categories/:id', authenticate, menuController.updateCategory);
router.delete('/categories/:id', authenticate, menuController.deleteCategory);

// Menu Items
router.get('/items/:vendorId?', optionalAuthenticate, menuController.getMenuItems);
router.post('/items', authenticate, menuController.createMenuItem);
router.put('/items/:id', authenticate, menuController.updateMenuItem);
router.delete('/items/:id', authenticate, menuController.deleteMenuItem);
router.patch('/items/:id/stock', authenticate, menuController.updateInventoryStock);

module.exports = router;
