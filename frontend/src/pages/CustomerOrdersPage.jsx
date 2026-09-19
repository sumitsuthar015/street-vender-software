import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, Clock, ArrowRight, RotateCcw } from 'lucide-react';
import { orderService } from '../services/api';
import { useSocket } from '../context/SocketContext';

export const CustomerOrdersPage = ({ onOpenCart }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getCustomerOrders();
      if (res.success) {
        setOrders(res.data || []);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleOrderUpdate = () => {
      fetchOrders();
    };

    socket.on('order:status_updated', handleOrderUpdate);
    socket.on('order:created', handleOrderUpdate);

    return () => {
      socket.off('order:status_updated', handleOrderUpdate);
      socket.off('order:created', handleOrderUpdate);
    };
  }, [socket]);

  const handleReorder = async (orderId) => {
    try {
      await orderService.reorderItems(orderId);
      onOpenCart();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Orders</h1>
        <p className="text-xs text-slate-500">Track current orders and view past food history</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => <div key={n} className="h-32 bg-slate-200 rounded-3xl animate-pulse" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-slate-700 text-lg">No orders placed yet</h3>
          <Link to="/" className="inline-block bg-orange-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow">
            Explore Nearby Stalls
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => (
            <div key={ord._id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-orange-600" />
                  <span className="font-bold text-sm text-slate-900">{ord.vendor?.stallName || 'Food Stall'}</span>
                </div>
                <span className="bg-slate-100 text-slate-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                  {ord.orderStatus}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-slate-700">{ord.orderNumber} • {ord.items?.length} Items</p>
                  <span className="text-[11px] text-slate-400">{new Date(ord.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-sm text-orange-600">₹{ord.finalAmount}</span>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase">{ord.paymentStatus}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleReorder(ord._id)}
                  className="flex items-center gap-1.5 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl border border-orange-200 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reorder Again
                </button>

                <Link
                  to={`/orders/${ord._id}`}
                  className="flex items-center gap-1 text-xs font-bold text-slate-800 hover:text-orange-600"
                >
                  <span>Track Status</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
