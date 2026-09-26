const express = require('express');
const Order = require('../models/Order');
const orders = require('../services/orders');
const payments = require('../services/payments');
const { validate, objectId } = require('../utils');

const router = express.Router();

/**
 * Razorpay webhook (optional but recommended in production): confirms payments even if the
 * customer closes the browser before Checkout reports back. Each vendor sets it up in their own
 * Razorpay dashboard (the URL and steps are shown in Dashboard > Settings):
 *   URL: https://<your-domain>/api/webhooks/razorpay/<vendorId>   Events: payment.captured, order.paid
 * and pastes the webhook secret next to their Razorpay keys.
 */
router.post('/razorpay/:vendorId', express.raw({ type: 'application/json' }), async (req, res) => {
  const vendorId = validate(objectId, req.params.vendorId);
  if (!(await payments.verifyWebhookSignature(vendorId, req.body, req.headers['x-razorpay-signature']))) {
    return res.status(400).json({ message: 'Invalid signature' });
  }

  const event = JSON.parse(req.body.toString('utf8'));
  const payment = event.payload?.payment?.entity;
  if (['payment.captured', 'order.paid'].includes(event.event) && payment?.order_id) {
    // Only this vendor's orders: a webhook can never mark another shop's order as paid
    const order = await Order.findOne({ vendor: vendorId, 'payment.gatewayOrderId': payment.order_id });
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
