import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Banknote, ShieldCheck, ArrowRight, Store, Utensils, CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { orderService, paymentService } from '../services/api';

export const CheckoutPage = () => {
  const { cart, cartTotal, discountAmount, clearCart } = useCart();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState(cart?.tableNo ? 'DINE_IN' : 'PICKUP');
  const [paymentMethod, setPaymentMethod] = useState('ONLINE_RAZORPAY');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const verifyPaymentAndOpenOrder = async (paymentData) => {
    const verifyRes = await paymentService.verifyPaymentSignature(paymentData);
    if (!verifyRes.success || verifyRes.data?.paymentStatus !== 'PAID') {
      throw new Error(verifyRes.message || 'Payment could not be verified.');
    }
    navigate(`/orders/${paymentData.orderId}`);
  };

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <Store className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="font-extrabold text-slate-800 text-xl">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">Please add menu items from a street food stall before checking out.</p>
        <button onClick={() => navigate('/')} className="bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow">
          Explore Vendors
        </button>
      </div>
    );
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');

      // 1. Create Order in Backend
      const orderRes = await orderService.createOrder({
        orderType,
        paymentMethod,
        specialInstructions,
        tableNo: cart.tableNo || ''
      });

      if (!orderRes.success || !orderRes.data) {
        throw new Error(orderRes.message || 'Order creation failed');
      }

      const createdOrder = orderRes.data;

      // 2. If Online Razorpay Payment Selected -> Initialize Razorpay SDK or Mock Sandbox
      if (paymentMethod === 'ONLINE_RAZORPAY') {
        const razorRes = await paymentService.createRazorpayOrder(createdOrder._id);

        if (razorRes.success && razorRes.data) {
          const { razorpayOrderId, amount, isMock } = razorRes.data;

          // If Mock Mode enabled for quick local testing without live Razorpay SDK keys
          if (isMock || !window.Razorpay) {
            console.log('[Razorpay Sandbox Mock Payment Triggered]');
            // Auto verify mock signature for instant test execution
            await verifyPaymentAndOpenOrder({
              orderId: createdOrder._id,
              razorpayOrderId,
              razorpayPaymentId: `pay_mock_${Date.now()}`,
              razorpaySignature: 'mock_signature_valid'
            });
            return;
          }

          // Real Razorpay Checkout Options if SDK loaded
          const options = {
            key: razorRes.data.keyId,
            amount: amount,
            currency: 'INR',
            name: 'Smart Street Vendor Platform',
            description: `Payment for Order ${createdOrder.orderNumber}`,
            order_id: razorpayOrderId,
            handler: async function (response) {
              await verifyPaymentAndOpenOrder({
                orderId: createdOrder._id,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              });
            },
            prefill: {
              name: 'Valued Customer'
            },
            theme: {
              color: '#ea580c'
            }
          };

          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', (response) => {
            setErrorMsg(response.error?.description || 'Payment failed. Your order was not confirmed.');
            setLoading(false);
          });
          rzp.open();
        }
      } else {
        // Cash on Pickup
        navigate(`/orders/${createdOrder._id}`);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Checkout Order</h1>
        <p className="text-xs text-slate-500">Review your food items and choose payment option</p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-2xl border border-red-200">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="space-y-6">
        {/* Order Type Selector */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-slate-400">Order Fulfilment</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOrderType('PICKUP')}
              className={`p-4 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-2 ${
                orderType === 'PICKUP' ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <Store className="w-5 h-5 text-orange-600" />
              <span>Self Pickup at Cart</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderType('DINE_IN')}
              className={`p-4 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-2 ${
                orderType === 'DINE_IN' ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <Utensils className="w-5 h-5 text-orange-600" />
              <span>Dine-In {cart.tableNo ? `(Table ${cart.tableNo})` : ''}</span>
            </button>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-3 shadow-xs">
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-slate-400">Payment Option</h3>
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setPaymentMethod('ONLINE_RAZORPAY')}
              className={`w-full p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
                paymentMethod === 'ONLINE_RAZORPAY' ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <div className="text-left">
                  <div className="font-bold text-slate-900">UPI / Cards / NetBanking (Razorpay)</div>
                  <span className="text-[10px] text-slate-500 font-normal">Instant digital payment confirmation</span>
                </div>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod('CASH')}
              className={`w-full p-4 rounded-2xl border text-xs font-bold transition flex items-center justify-between ${
                paymentMethod === 'CASH' ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-sm' : 'border-slate-200 bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <div className="text-left">
                  <div className="font-bold text-slate-900">Pay Cash at Counter</div>
                  <span className="text-[10px] text-slate-500 font-normal">Pay directly to vendor upon food collection</span>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Items Summary Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-slate-400">Order Items Summary</h3>
          <div className="divide-y divide-slate-100">
            {cart.items.map((item) => (
              <div key={item._id} className="py-3 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800">{item.menuItem?.name} × {item.quantity}</span>
                  {item.selectedCustomizations?.length > 0 && (
                    <p className="text-[10px] text-slate-500">{item.selectedCustomizations.map((c) => c.choiceLabel).join(', ')}</p>
                  )}
                </div>
                <span className="font-extrabold text-slate-900">₹{item.itemUnitPrice * item.quantity}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
            {discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Applied Coupon Discount</span>
                <span>-₹{discountAmount}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
              <span>Final Total Amount</span>
              <span className="text-orange-600">₹{cartTotal}</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
        >
          {loading ? 'Processing Order...' : `Confirm & Pay ₹${cartTotal}`}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
