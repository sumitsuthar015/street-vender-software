import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { Clock, CheckCircle2, Store, FileText, Star, AlertCircle, RefreshCw } from 'lucide-react';
import { orderService, reviewService } from '../services/api';
import { DigitalInvoiceModal } from '../components/DigitalInvoiceModal';
import { useSocket } from '../context/SocketContext';

export const OrderTrackingPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();

  const [order, setOrder] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const fetchOrderDetails = async () => {
    try {
      const res = await orderService.getOrderDetails(orderId);
      if (res.success && res.data) {
        setOrder(res.data.order);
        setInvoice(res.data.invoice);

        if (res.data.order.orderStatus === 'READY' || res.data.order.orderStatus === 'COMPLETED') {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error('Order tracking fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  // Socket listener for real-time state changes
  useEffect(() => {
    if (!socket || !orderId) return;

    socket.emit('join_order_room', orderId);

    const handleStatusUpdate = (data) => {
      // Socket payload IDs can arrive as strings or MongoDB ObjectIds.
      if (String(data.orderId) === String(orderId)) {
        fetchOrderDetails();
      }
    };

    socket.on('order:status_updated', handleStatusUpdate);

    return () => {
      socket.off('order:status_updated', handleStatusUpdate);
    };
  }, [socket, orderId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      const res = await reviewService.createReview({
        orderId,
        rating,
        comment
      });
      if (res.success) {
        setReviewSubmitted(true);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto py-20 space-y-6">
        <div className="h-48 bg-slate-200 rounded-3xl animate-pulse" />
        <div className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-3">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="font-extrabold text-slate-800 text-xl">Order Not Found</h2>
        <button onClick={() => navigate('/orders')} className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl">
          View My Orders
        </button>
      </div>
    );
  }

  // Define status steps
  const steps = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'];
  const currentStepIdx = steps.indexOf(order.orderStatus);

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-orange-400" />
            <span className="font-bold text-sm text-slate-200">{order.vendor?.stallName}</span>
          </div>
          <span className="bg-orange-500/20 text-orange-400 font-extrabold text-xs px-3 py-1 rounded-full border border-orange-500/30">
            {order.orderNumber}
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Status: <span className="text-orange-400 uppercase">{order.orderStatus}</span>
          </h1>
          <p className="text-xs text-slate-300">
            {order.orderType === 'DINE_IN' ? `Dine-In Table #${order.tableNo || 'N/A'}` : 'Self Pickup at Vendor Counter'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700/60 text-xs">
          <button
            onClick={() => setShowInvoiceModal(true)}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold px-3.5 py-2 rounded-xl transition backdrop-blur-sm"
          >
            <FileText className="w-4 h-4 text-amber-400" /> View Digital Invoice
          </button>
          <button
            onClick={fetchOrderDetails}
            className="flex items-center gap-1 text-slate-400 hover:text-white"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Status
          </button>
        </div>
      </div>

      {/* Real-time Order Progress Steps Tracker */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <h3 className="font-extrabold text-slate-900 text-base uppercase tracking-wider text-slate-400">Live Kitchen Tracking</h3>

        <div className="relative flex justify-between items-center">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0" />
          <div
            className="absolute top-1/2 left-0 h-1 bg-orange-500 -translate-y-1/2 z-0 transition-all duration-500"
            style={{ width: `${(Math.max(0, currentStepIdx) / (steps.length - 1)) * 100}%` }}
          />

          {steps.map((step, idx) => {
            const isDone = idx <= currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs transition duration-300 ${
                    isCurrent
                      ? 'bg-orange-600 text-white ring-4 ring-orange-100 animate-bounce'
                      : isDone
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-orange-600' : 'text-slate-400'}`}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Review Section (Triggered upon COMPLETED status) */}
      {order.orderStatus === 'COMPLETED' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
          <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Rate Your Experience
          </h3>

          {reviewSubmitted ? (
            <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-4 rounded-2xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              Thank you! Your verified purchase review has been published.
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Star Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Comment (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="How was the taste, hygiene, and preparation speed?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow"
              >
                {submittingReview ? 'Submitting...' : 'Submit Verified Review'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Digital Invoice Modal */}
      {invoice && (
        <DigitalInvoiceModal
          invoice={invoice}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
};
