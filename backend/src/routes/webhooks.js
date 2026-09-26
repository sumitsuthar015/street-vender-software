const express = require('express');
const Order = require('../models/Order');
const orders = require('../services/orders');
const payments = require('../services/payments');

const router = express.Router();

/**
 * Razorpay webhook (optional but recommended in production): confirms payments even if the
 * customer closes the browser before Checkout reports back. Set it up in the Razorpay dashboard:
 *   URL: https://<your-domain>/api/webhooks/razorpay   Events: payment.captured, order.paid
 * and put the webhook secret in RAZORPAY_WEBHOOK_SECRET.
 */
router.post('/razorpay', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!payments.verifyWebhookSignature(req.body, req.headers['x-razorpay-signature'])) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = JSON.parse(req.body.toString('utf8'));
  const payment = event.payload?.payment?.entity;
  if (['payment.captured', 'order.paid'].includes(event.event) && payment?.order_id) {
    const order = await Order.findOne({ 'payment.gatewayOrderId': payment.order_id });
    if (order) {
      await orders.markPaid(order._id, {
        provider: 'razorpay',
        paymentId: payment.id,
        gatewayOrderId: payment.order_id,
      });
    }
  }
  res.json({ ok: true });
});

module.exports = router;
