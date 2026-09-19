const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { ROLES } = require('../config/constants');

router.use(authenticate, authorize(ROLES.ADMIN));

router.get('/dashboard-stats', adminController.getAdminDashboardStats);
router.get('/vendors', adminController.getAllVendorsAdmin);
router.patch('/vendors/:vendorId/status', adminController.updateVendorStatus);
router.patch('/customers/:userId/toggle-block', adminController.toggleCustomerBlock);
router.get('/support-tickets', adminController.getSupportTickets);
router.post('/support-tickets/:ticketId/reply', adminController.replySupportTicket);

module.exports = router;
