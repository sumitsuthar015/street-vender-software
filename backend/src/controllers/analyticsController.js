const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const apiResponse = require('../utils/apiResponse');
const asyncWrapper = require('../utils/asyncWrapper');
const { ORDER_STATUS } = require('../config/constants');

exports.getVendorAnalytics = asyncWrapper(async (req, res) => {
  const vendor = req.vendor;
  if (!vendor) return apiResponse.error(res, 'Vendor context missing', null, 404);

  const completedOrders = await Order.find({
    vendor: vendor._id,
    orderStatus: ORDER_STATUS.COMPLETED
  });

  const totalOrders = await Order.countDocuments({ vendor: vendor._id });

  // 1. Revenue calculations
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.finalAmount, 0);
  const totalCommissionPaid = completedOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
  const netEarnings = totalRevenue - totalCommissionPaid;

  // 2. Peak Hours Analysis (Group completed orders by hour)
  const hourlyCount = Array(24).fill(0);
  completedOrders.forEach(o => {
    const hour = new Date(o.createdAt).getHours();
    hourlyCount[hour] += 1;
  });

  const peakHours = hourlyCount.map((count, hour) => ({
    hour: `${hour % 12 || 12} ${hour >= 12 ? 'PM' : 'AM'}`,
    ordersCount: count
  }));

  // 3. Top Selling Items
  const popularItems = await MenuItem.find({ vendor: vendor._id })
    .sort({ totalOrdersCount: -1 })
    .limit(5)
    .select('name totalOrdersCount price image');

  // 4. Repeat Customer Rate Calculation
  const customerMap = {};
  completedOrders.forEach(o => {
    const custId = o.customer.toString();
    customerMap[custId] = (customerMap[custId] || 0) + 1;
  });

  const totalUniqueCustomers = Object.keys(customerMap).length;
  const repeatCustomersCount = Object.values(customerMap).filter(count => count > 1).length;
  const repeatRatePercentage = totalUniqueCustomers > 0
    ? ((repeatCustomersCount / totalUniqueCustomers) * 100).toFixed(1)
    : 0;

  return apiResponse.success(res, 'Vendor analytics compiled', {
    financials: {
      totalOrders,
      completedOrdersCount: completedOrders.length,
      totalRevenue,
      totalCommissionPaid,
      netEarnings,
      avgOrderValue: completedOrders.length > 0 ? (totalRevenue / completedOrders.length).toFixed(2) : 0
    },
    customerMetrics: {
      totalUniqueCustomers,
      repeatCustomersCount,
      repeatRatePercentage: `${repeatRatePercentage}%`
    },
    popularItems,
    peakHours
  });
});
