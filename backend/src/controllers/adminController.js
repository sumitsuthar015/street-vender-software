const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Order = require('../models/Order');
const Payment = require('../models/Payment');
const SupportTicket = require('../models/SupportTicket');
const AuditLog = require('../models/AuditLog');
const apiResponse = require('../utils/apiResponse');
const asyncWrapper = require('../utils/asyncWrapper');
const { VENDOR_STATUS, ORDER_STATUS, PAYMENT_STATUS } = require('../config/constants');

// Super Admin Platform KPI Overview
exports.getAdminDashboardStats = asyncWrapper(async (req, res) => {
  const totalCustomers = await User.countDocuments({ role: 'CUSTOMER' });
  const totalVendors = await Vendor.countDocuments();
  const pendingVendorsCount = await Vendor.countDocuments({ status: VENDOR_STATUS.PENDING });
  const approvedVendorsCount = await Vendor.countDocuments({ status: VENDOR_STATUS.APPROVED });

  const totalOrders = await Order.countDocuments();
  const completedOrders = await Order.countDocuments({ orderStatus: ORDER_STATUS.COMPLETED });
  const pendingOrders = await Order.countDocuments({ orderStatus: { $in: [ORDER_STATUS.PENDING, ORDER_STATUS.PREPARING] } });

  // Financial aggregates
  const completedOrdersList = await Order.find({ orderStatus: ORDER_STATUS.COMPLETED });

  const totalGrossRevenue = completedOrdersList.reduce((sum, o) => sum + o.finalAmount, 0);
  const totalPlatformCommission = completedOrdersList.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);

  const openTickets = await SupportTicket.countDocuments({ status: 'OPEN' });

  return apiResponse.success(res, 'Admin stats fetched', {
    overview: {
      totalCustomers,
      totalVendors,
      pendingVendorsCount,
      approvedVendorsCount,
      totalOrders,
      completedOrders,
      pendingOrders,
      totalGrossRevenue,
      totalPlatformCommission,
      openTickets
    }
  });
});

// Approve / Reject / Suspend Vendor Application
exports.updateVendorStatus = asyncWrapper(async (req, res) => {
  const { vendorId } = req.params;
  const { status, commissionRate } = req.body;

  if (!Object.values(VENDOR_STATUS).includes(status)) {
    return apiResponse.error(res, 'Invalid vendor status value.', null, 400);
  }

  const vendor = await Vendor.findById(vendorId).populate('owner');
  if (!vendor) return apiResponse.error(res, 'Vendor not found', null, 404);

  vendor.status = status;
  if (status === VENDOR_STATUS.APPROVED) {
    vendor.isVerified = true;
  }
  if (commissionRate !== undefined) {
    vendor.commissionRate = commissionRate;
  }

  await vendor.save();

  // Audit Log Entry
  await AuditLog.create({
    performedBy: req.user._id,
    action: `VENDOR_STATUS_CHANGE_${status}`,
    targetModel: 'Vendor',
    targetId: vendor._id,
    details: { status, commissionRate }
  });

  return apiResponse.success(res, `Vendor status updated to ${status}`, vendor);
});

// List All Vendors for Admin
exports.getAllVendorsAdmin = asyncWrapper(async (req, res) => {
  const { status } = req.query;
  let filter = {};
  if (status) filter.status = status;

  const vendors = await Vendor.find(filter)
    .populate('owner', 'name mobile email createdAt')
    .sort({ createdAt: -1 });

  return apiResponse.success(res, 'Admin vendors fetched', vendors);
});

// Customer Management (Block/Unblock)
exports.toggleCustomerBlock = asyncWrapper(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  if (!user) return apiResponse.error(res, 'User not found', null, 404);

  user.status = user.status === 'BLOCKED' ? 'ACTIVE' : 'BLOCKED';
  await user.save();

  return apiResponse.success(res, `Customer account status updated to ${user.status}`, user);
});

// Support Tickets Resolution
exports.getSupportTickets = asyncWrapper(async (req, res) => {
  const tickets = await SupportTicket.find()
    .populate('user', 'name mobile')
    .populate('vendor', 'stallName')
    .sort({ createdAt: -1 });

  return apiResponse.success(res, 'Support tickets fetched', tickets);
});

exports.replySupportTicket = asyncWrapper(async (req, res) => {
  const { ticketId } = req.params;
  const { message, status } = req.body;

  const ticket = await SupportTicket.findById(ticketId);
  if (!ticket) return apiResponse.error(res, 'Ticket not found', null, 404);

  if (message) {
    ticket.replies.push({
      sender: req.user._id,
      senderRole: req.user.role,
      message
    });
  }

  if (status) ticket.status = status;
  await ticket.save();

  return apiResponse.success(res, 'Ticket response saved', ticket);
});
