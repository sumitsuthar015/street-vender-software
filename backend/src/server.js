require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initSocket } = require('./sockets/socketHandler');

const app = express();
const server = http.createServer(app);

// 1. Global Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. API Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Smart Street Vendor Ordering API',
    timestamp: new Date().toISOString()
  });
});

// 3. Mount API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/vendors', require('./routes/vendorRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));

// 4. Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  initSocket(server);
  server.listen(PORT, () => {
    console.log(`[Smart Street Vendor Server] Running on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`[Smart Street Vendor Server] Startup failed: ${error.message}`);
  process.exitCode = 1;
});
