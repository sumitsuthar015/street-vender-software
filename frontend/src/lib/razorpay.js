let scriptPromise = null;

function loadCheckoutScript() {
  if (window.Razorpay) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load the payment page. Check your internet and try again.'));
      };
      document.body.appendChild(script);
    });
  }
  return scriptPromise;
}

/**
 * Opens Razorpay Checkout (UPI / cards / wallets). Resolves with the payment response to verify on
 * the server, or rejects if the customer closes it or the payment fails.
 */
export async function openRazorpayCheckout({ payment, shopName, customerName, customerPhone }) {
  await loadCheckoutScript();
  return new Promise((resolve, reject) => {
    // After a failed attempt Razorpay keeps its window open so the customer can retry,
    // so only give up when they close it.
    let lastError = null;
    const checkout = new window.Razorpay({
      key: payment.keyId,
      order_id: payment.gatewayOrderId,
      amount: payment.amount,
      currency: payment.currency,
      name: shopName,
      description: 'Food order',
      prefill: { name: customerName, contact: customerPhone || undefined },
      theme: { color: '#ea580c' },
      handler: resolve,
      modal: { ondismiss: () => reject(new Error(lastError || 'Payment was cancelled')) },
    });
    checkout.on('payment.failed', (res) => {
      lastError = res?.error?.description || 'Payment failed. Please try again.';
    });
    checkout.open();
  });
}
