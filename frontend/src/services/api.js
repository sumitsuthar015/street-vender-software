import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT Bearer Token to outgoing requests automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('sv_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Unified Error Handling Interceptor
API.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export default API;

// --- Auth Services ---
export const authService = {
  requestMobileOTP: (mobile, name) => API.post('/auth/mobile/otp-request', { mobile, name }),
  verifyMobileOTP: (mobile, otp) => API.post('/auth/mobile/otp-verify', { mobile, otp }),
  requestEmailOTP: (email, name) => API.post('/auth/email/otp-request', { email, name }),
  verifyEmailOTP: (email, otp) => API.post('/auth/email/otp-verify', { email, otp }),
  registerVendor: (data) => API.post('/auth/vendor/register', data),
  getMe: () => API.get('/auth/me')
};

// --- Vendor Services ---
export const vendorService = {
  getPublicVendors: (params) => API.get('/vendors/public', { params }),
  getVendorDetails: (identifier) => API.get(`/vendors/public/${identifier}`),
  updateVendorProfile: (data) => API.put('/vendors/profile', data),
  getVendorTables: () => API.get('/vendors/tables'),
  createVendorTable: (data) => API.post('/vendors/tables', data),
  deleteVendorTable: (tableId) => API.delete(`/vendors/tables/${tableId}`)
};

// --- Menu & Inventory Services ---
export const menuService = {
  getCategories: (vendorId) => API.get(`/menu/categories${vendorId ? `/${vendorId}` : ''}`),
  createCategory: (data) => API.post('/menu/categories', data),
  updateCategory: (id, data) => API.put(`/menu/categories/${id}`, data),
  deleteCategory: (id) => API.delete(`/menu/categories/${id}`),

  getMenuItems: (vendorId) => API.get(`/menu/items${vendorId ? `/${vendorId}` : ''}`),
  createMenuItem: (data) => API.post('/menu/items', data),
  updateMenuItem: (id, data) => API.put(`/menu/items/${id}`, data),
  deleteMenuItem: (id) => API.delete(`/menu/items/${id}`),
  updateStock: (id, data) => API.patch(`/menu/items/${id}/stock`, data)
};

// --- Cart Services ---
export const cartService = {
  getCart: () => API.get('/cart'),
  addToCart: (data) => API.post('/cart/add', data),
  updateCartItem: (itemId, quantity) => API.put(`/cart/item/${itemId}`, { quantity }),
  applyCoupon: (couponCode) => API.post('/cart/coupon', { couponCode }),
  clearCart: () => API.delete('/cart/clear')
};

// --- Order Services ---
export const orderService = {
  createOrder: (data) => API.post('/orders/create', data),
  getCustomerOrders: () => API.get('/orders/my-orders'),
  getOrderDetails: (orderId) => API.get(`/orders/${orderId}`),
  reorderItems: (orderId) => API.post(`/orders/${orderId}/reorder`),
  getVendorOrders: (status) => API.get('/orders/vendor/queue', { params: { status } }),
  updateOrderStatus: (orderId, status, cancellationReason) => API.patch(`/orders/${orderId}/status`, { status, cancellationReason })
};

// --- Payment Services ---
export const paymentService = {
  createRazorpayOrder: (orderId) => API.post('/payments/razorpay-order', { orderId }),
  verifyPaymentSignature: (data) => API.post('/payments/verify-signature', data),
  processRefund: (data) => API.post('/payments/refund', data)
};

// --- Review Services ---
export const reviewService = {
  getVendorReviews: (vendorId) => API.get(`/reviews/vendor/${vendorId}`),
  createReview: (data) => API.post('/reviews/create', data)
};

// --- Coupon Services ---
export const couponService = {
  getActiveCoupons: (vendorId) => API.get('/coupons/active', { params: { vendorId } }),
  createCoupon: (data) => API.post('/coupons/create', data)
};

// --- Admin Services ---
export const adminService = {
  getAdminStats: () => API.get('/admin/dashboard-stats'),
  getAllVendors: (status) => API.get('/admin/vendors', { params: { status } }),
  updateVendorStatus: (vendorId, status, commissionRate) => API.patch(`/admin/vendors/${vendorId}/status`, { status, commissionRate }),
  toggleCustomerBlock: (userId) => API.patch(`/admin/customers/${userId}/toggle-block`),
  getSupportTickets: () => API.get('/admin/support-tickets'),
  replySupportTicket: (ticketId, message, status) => API.post(`/admin/support-tickets/${ticketId}/reply`, { message, status })
};

// --- Analytics Services ---
export const analyticsService = {
  getVendorAnalytics: () => API.get('/analytics/vendor')
};
