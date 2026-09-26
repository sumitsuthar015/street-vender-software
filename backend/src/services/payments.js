const crypto = require('crypto');
const Razorpay = require('razorpay');
const Vendor = require('../models/Vendor');
const { HttpError, decryptSecret } = require('../utils');

const toPaise = (rupees) => Math.round(rupees * 100);

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * The vendor's own Razorpay account (every shop gets paid into its own account).
 * Returns null if they haven't connected Razorpay, or their saved keys can't be read.
 */
async function vendorRazorpay(vendorId) {
  const vendor = await Vendor.findById(vendorId).select('razorpayKeyId +razorpayKeySecret razorpayWebhookSecret');
  if (!vendor?.razorpayKeyId) return null;

  const keySecret = decryptSecret(vendor.razorpayKeySecret);
  if (!keySecret) {
    console.error(`[payments] Can't read the Razorpay secret of vendor ${vendorId} (was JWT_SECRET changed?). They must re-enter it in Settings.`);
    return null;
  }
  return {
    keyId: vendor.razorpayKeyId,
    keySecret,
    webhookSecret: vendor.razorpayWebhookSecret ? decryptSecret(vendor.razorpayWebhookSecret) : null,
    client: new Razorpay({ key_id: vendor.razorpayKeyId, key_secret: keySecret }),
  };
}

/** Checks keys with Razorpay before a vendor saves them, so typos show up right away. */
async function checkKeys(keyId, keySecret) {
  try {
    await new Razorpay({ key_id: keyId, key_secret: keySecret }).orders.all({ count: 1 });
  } catch (err) {
    if (err.statusCode === 401) {
      throw new HttpError(400, 'Razorpay did not accept these keys. Copy the Key ID and Key Secret again from your Razorpay dashboard.');
    }
    console.error('[payments] Razorpay key check failed:', err?.error?.description || err.message);
    throw new HttpError(502, 'Could not reach Razorpay to check your keys. Please try again.');
  }
}

/**
 * Prepares an online payment for an order. With the shop's Razorpay keys this creates a Razorpay
 * order that the browser opens in Razorpay Checkout; in demo mode it returns a "demo" payment instead.
 */
async function startOnlinePayment(order, vendor) {
  if (vendor.onlinePaymentMode === 'demo') {
    return { mode: 'demo', amount: toPaise(order.total), currency: 'INR' };
  }

  const rzp = vendor.onlinePaymentMode === 'razorpay' ? await vendorRazorpay(vendor._id) : null;
  if (!rzp) throw new HttpError(400, 'This shop cannot take online payments right now. Please pay at the counter.');

  // Reuse the Razorpay order on retries so the customer can't be charged twice for one order
  // (unless the shop switched to other Razorpay keys since, e.g. from test to live)
  if (!order.payment.gatewayOrderId || order.payment.gatewayKeyId !== rzp.keyId) {
    const rzpOrder = await rzp.client.orders.create({
      amount: toPaise(order.total),
      currency: 'INR',
      receipt: order.code,
      notes: { orderCode: order.code },
    });
    order.payment.gatewayOrderId = rzpOrder.id;
    order.payment.gatewayKeyId = rzp.keyId;
    await order.save();
  }

  return {
    mode: 'razorpay',
    keyId: rzp.keyId,
    gatewayOrderId: order.payment.gatewayOrderId,
    amount: toPaise(order.total),
    currency: 'INR',
  };
}

/** Checks the signature Razorpay Checkout returns after a successful payment. */
async function verifyCheckoutSignature(order, { gatewayOrderId, paymentId, signature }) {
  const rzp = await vendorRazorpay(order.vendor);
  if (!rzp) return false;
  const expected = crypto.createHmac('sha256', rzp.keySecret).update(`${gatewayOrderId}|${paymentId}`).digest('hex');
  return safeEqual(expected, signature);
}

async function verifyWebhookSignature(vendorId, rawBody, signature) {
  const rzp = await vendorRazorpay(vendorId);
  if (!rzp?.webhookSecret || !signature) return false;
  const expected = crypto.createHmac('sha256', rzp.webhookSecret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

/** Returns { ok, refundId } - refunds the full amount of a paid online order. */
async function refund(order) {
  if (order.payment.provider === 'demo') return { ok: true, refundId: `demo_refund_${order.code}` };
  if (order.payment.provider !== 'razorpay') return { ok: false };
  try {
    const rzp = await vendorRazorpay(order.vendor);
    if (!rzp) return { ok: false };
    const result = await rzp.client.payments.refund(order.payment.paymentId, {
      amount: toPaise(order.total),
      notes: { orderCode: order.code },
    });
    return { ok: true, refundId: result.id };
  } catch (err) {
    console.error('[payments] Refund failed for order', order.code, err?.error?.description || err.message);
    return { ok: false };
  }
}

module.exports = { checkKeys, startOnlinePayment, verifyCheckoutSignature, verifyWebhookSignature, refund };
