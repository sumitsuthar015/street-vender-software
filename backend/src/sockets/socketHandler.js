const { Server } = require('socket.io');

let io = null;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket Connected]: ${socket.id}`);

    // Join room based on user role / ID
    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`[Socket] User ${userId} joined room user:${userId}`);
      }
    });

    socket.on('join_vendor_room', (vendorId) => {
      if (vendorId) {
        socket.join(`vendor:${vendorId}`);
        socket.join(`store:${vendorId}`);
        console.log(`[Socket] Vendor ${vendorId} joined room vendor:${vendorId}`);
      }
    });

    socket.on('join_store_room', (vendorId) => {
      if (vendorId) {
        socket.join(`store:${vendorId}`);
        console.log(`[Socket] Joined store room store:${vendorId}`);
      }
    });

    socket.on('join_order_room', (orderId) => {
      if (orderId) {
        socket.join(`order:${orderId}`);
        console.log(`[Socket] Joined room order:${orderId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected]: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

// Helper broadcaster functions
const notifyVendorNewOrder = (vendorId, order) => {
  if (io) {
    io.to(`vendor:${vendorId}`).emit('order:created', {
      message: `🔔 New Order Received: ${order.orderNumber}`,
      order
    });
  }
};

const notifyCustomerOrderStatus = (order) => {
  if (io) {
    const payload = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      updatedAt: new Date()
    };
    io.to(`order:${order._id}`).emit('order:status_updated', payload);
    io.to(`user:${order.customer}`).emit('order:status_updated', payload);
    if (order.vendor) {
      io.to(`vendor:${order.vendor}`).emit('order:status_updated', payload);
    }
  }
};

const notifyVendorLowStock = (vendorId, menuItem) => {
  if (io) {
    io.to(`vendor:${vendorId}`).emit('inventory:low_stock', {
      message: `⚠️ Low Stock Warning: ${menuItem.name} (${menuItem.stockQuantity} remaining)`,
      menuItem
    });
  }
};

const notifyMenuUpdated = (vendorId) => {
  if (io) {
    io.to(`vendor:${vendorId}`).emit('menu:updated');
    io.to(`store:${vendorId}`).emit('menu:updated');
  }
};

module.exports = {
  initSocket,
  getIO,
  notifyVendorNewOrder,
  notifyCustomerOrderStatus,
  notifyVendorLowStock,
  notifyMenuUpdated
};
