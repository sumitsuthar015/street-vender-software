const { Server } = require('socket.io');
const { verifyToken } = require('../middleware/auth');

let io = null;

/**
 * Rooms:
 *   vendor:<vendorId>  - the vendor's dashboard (joins automatically with its login token)
 *   order:<code>       - a customer's order tracking page
 */
function initRealtime(httpServer) {
  io = new Server(httpServer);

  io.on('connection', (socket) => {
    const vendorId = verifyToken(socket.handshake.auth?.token);
    if (vendorId) socket.join(`vendor:${vendorId}`);

    socket.on('order:watch', (code) => {
      if (typeof code === 'string' && /^[A-Z0-9]{6,20}$/.test(code)) socket.join(`order:${code}`);
    });
  });
}

/** Tells the vendor dashboard and the customer's tracking page that an order changed. */
function emitOrderChange(order, event = 'order:updated') {
  if (!io) return;
  // Unpaid online orders stay hidden from the vendor until payment succeeds
  if (order.status !== 'awaiting_payment') {
    io.to(`vendor:${order.vendor}`).emit(event, order.toJSON());
  }
  io.to(`order:${order.code}`).emit('order:changed', {
    code: order.code,
    status: order.status,
    paymentStatus: order.paymentStatus,
  });
}

module.exports = { initRealtime, emitOrderChange };
