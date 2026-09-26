const crypto = require('crypto');
const Razorpay = require('razorpay');
const config = require('../config');

const { mode, razorpayKeyId, razorpayKeySecret, webhookSecret } = config.payments;
const razorpay = mode === 'razorpay' ? new Razorpay({ key_id: razorpayKeyId, key_secret: razorpayKeySecret }) : null;

const toPaise = (rupees) => Math.round(rupees * 100);

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Prepares an online payment for an order. With real Razorpay keys this creates a Razorpay order
 * that the browser opens in Razorpay Checkout; without keys it returns a "demo" payment instead.
 */
async function startOnlinePayment(order) {
  if (mode === 'demo') {
    return { mode: 'demo', amount: toPaise(order.total), currency: 'INR' };
  }

  // Reuse the Razorpay order on retries so the customer can't be charged twice for one order
  if (!order.payment.gatewayOrderId) {
    const rzpOrder = await razorpay.orders.create({
      amount: toPaise(order.total),
      currency: 'INR',
      receipt: order.code,
      notes: { orderCode: order.code },
    });
    order.payment.gatewayOrderId = rzpOrder.id;
    await order.save();
  }

  return {
    mode: 'razorpay',
    keyId: razorpayKeyId,
    gatewayOrderId: order.payment.gatewayOrderId,
    amount: toPaise(order.total),
    currency: 'INR',
  };
}

/** Checks the signature Razorpay Checkout returns after a successful payment. */
function verifyCheckoutSignature({ gatewayOrderId, paymentId, signature }) {
  if (mode !== 'razorpay') return false;
  const expected = crypto.createHmac('sha256', razorpayKeySecret).update(`${gatewayOrderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
}

function verifyWebhookSignature(rawBody, signature) {
  if (!webhookSecret || !signature) return false;
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

/** Returns { ok, refundId } - refunds the full amount of a paid online order. */
async function refund(order) {
  if (order.payment.provider === 'demo') return { ok: true, refundId: `demo_refund_${order.code}` };
  if (order.payment.provider !== 'razorpay' || !razorpay) return { ok: false };
  try {
    const result = await razorpay.payments.refund(order.payment.paymentId, {
      amount: toPaise(order.total),
      notes: { orderCode: order.code },
    });
    return { ok: true, refundId: result.id };
  } catch (err) {
    console.error('[payments] Refund failed for order', order.code, err?.error?.description || err.message);
    return { ok: false };
  }
}

module.exports = { mode, startOnlinePayment, verifyCheckoutSignature, verifyWebhookSignature, refund };
