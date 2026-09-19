import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight, Tag, Utensils } from 'lucide-react';
import { useCart } from '../context/CartContext';

export const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, cartTotal, discountAmount, updateQuantity, applyCoupon, clearCart } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [couponMsg, setCouponMsg] = useState('');
  const [loadingCoupon, setLoadingCoupon] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    try {
      setLoadingCoupon(true);
      setCouponMsg('');
      const res = await applyCoupon(couponCode.trim());
      setCouponMsg(`✅ Coupon applied! Saved ₹${res.data?.discountAmount || discountAmount}`);
      setCouponCode('');
    } catch (err) {
      setCouponMsg(`❌ ${err.message}`);
    } finally {
      setLoadingCoupon(false);
    }
  };

  const handleProceedCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <div className="bg-orange-500 text-white p-2 rounded-xl">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-800 text-lg">Your Cart</h2>
                {cart?.vendor?.stallName && (
                  <p className="text-xs text-orange-600 font-semibold flex items-center gap-1">
                    <Utensils className="w-3 h-3" /> {cart.vendor.stallName}
                    {cart.tableNo && <span className="bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded text-[10px]">Table {cart.tableNo}</span>}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {!cart || !cart.items || cart.items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-700 text-base">Your cart is empty</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Scan a vendor QR code or explore available stalls to add delicious street food items!
                </p>
              </div>
            ) : (
              cart.items.map((item) => (
                <div
                  key={item._id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex gap-3 items-center justify-between"
                >
                  <img
                    src={item.menuItem?.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=100'}
                    alt={item.menuItem?.name || 'Item'}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200"
                  />

                  <div className="flex-1 space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm leading-snug">
                      {item.menuItem?.name}
                    </h4>

                    {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {item.selectedCustomizations.map((c) => c.choiceLabel).join(', ')}
                      </p>
                    )}

                    <div className="font-extrabold text-slate-900 text-sm">
                      ₹{item.itemUnitPrice * item.quantity}
                    </div>
                  </div>

                  {/* Quantity Controller */}
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-xs">
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity - 1)}
                      className="text-slate-500 hover:text-orange-600 font-bold px-1 text-sm"
                    >
                      -
                    </button>
                    <span className="font-bold text-slate-800 text-xs w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item._id, item.quantity + 1)}
                      className="text-slate-500 hover:text-orange-600 font-bold px-1 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Coupon Code Entry */}
            {cart && cart.items?.length > 0 && (
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Coupon Code (e.g. STREET20)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 uppercase"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loadingCoupon}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
                  >
                    Apply
                  </button>
                </form>

                {couponMsg && (
                  <p className="text-xs font-semibold text-slate-700">{couponMsg}</p>
                )}
              </div>
            )}
          </div>

          {/* Footer Checkout Button */}
          {cart && cart.items?.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Coupon Discount</span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
                  <span>Grand Total</span>
                  <span className="text-orange-600">₹{cartTotal}</span>
                </div>
              </div>

              <button
                onClick={handleProceedCheckout}
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
