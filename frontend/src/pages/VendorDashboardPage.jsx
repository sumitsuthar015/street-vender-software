import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Utensils, QrCode, BarChart3, Clock, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { orderService, vendorService } from '../services/api';
import { useSocket } from '../context/SocketContext';

export const VendorDashboardPage = () => {
  const { vendor, fetchCurrentUser } = useAuth();
  const { socket } = useSocket();

  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, PENDING, PREPARING, READY, COMPLETED
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(vendor?.isOpen ?? true);

  const fetchVendorOrders = async () => {
    try {
      setLoading(true);
      const res = await orderService.getVendorOrders();
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
    fetchVendorOrders();
  }, []);

  // Listen for real-time incoming orders via Socket.IO
  useEffect(() => {
    if (!socket || !vendor?._id) return;

    socket.emit('join_vendor_room', vendor._id);

    const handleNewOrder = () => {
      fetchVendorOrders();
    };

    socket.on('order:created', handleNewOrder);
    socket.on('order:status_updated', handleNewOrder);

    return () => {
      socket.off('order:created', handleNewOrder);
      socket.off('order:status_updated', handleNewOrder);
    };
  }, [socket, vendor?._id]);

  const handleToggleStoreStatus = async () => {
    try {
      const nextStatus = !isOpen;
      setIsOpen(nextStatus);
      await vendorService.updateVendorProfile({ isOpen: nextStatus });
      fetchCurrentUser();
    } catch (err) {
      setIsOpen(!isOpen);
      alert(err.message);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      fetchVendorOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'ALL') return true;
    return o.orderStatus === activeTab;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Quick Operations Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{vendor?.stallName || 'Vendor Dashboard'}</h1>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                  vendor?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {vendor?.status || 'PENDING'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Live Kitchen Order Management & Stall Control</p>
            </div>
          </div>

          {/* Store Open/Closed Toggle */}
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 pl-2">Store Status:</span>
            <button
              onClick={handleToggleStoreStatus}
              className={`px-4 py-1.5 rounded-xl text-xs font-extrabold transition shadow-xs ${
                isOpen ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {isOpen ? '● OPEN FOR ORDERS' : '○ CLOSED'}
            </button>
          </div>
        </div>

        {/* Shortcut Navigation Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <Link
            to="/vendor/menu"
            className="p-3.5 bg-orange-50 hover:bg-orange-100/80 text-orange-900 border border-orange-200 rounded-2xl transition flex items-center gap-2.5 font-bold text-xs"
          >
            <Utensils className="w-4 h-4 text-orange-600" /> Manage Menu & Items
          </Link>
          <Link
            to="/vendor/qr"
            className="p-3.5 bg-amber-50 hover:bg-amber-100/80 text-amber-900 border border-amber-200 rounded-2xl transition flex items-center gap-2.5 font-bold text-xs"
          >
            <QrCode className="w-4 h-4 text-amber-600" /> Generate Stall & Table QRs
          </Link>
          <Link
            to="/vendor/analytics"
            className="p-3.5 bg-purple-50 hover:bg-purple-100/80 text-purple-900 border border-purple-200 rounded-2xl transition flex items-center gap-2.5 font-bold text-xs"
          >
            <BarChart3 className="w-4 h-4 text-purple-600" /> Sales Analytics & Earnings
          </Link>
          <button
            onClick={fetchVendorOrders}
            className="p-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl transition flex items-center gap-2.5 font-bold text-xs justify-center"
          >
            <RefreshCw className="w-4 h-4 text-slate-600" /> Refresh Queue
          </button>
        </div>
      </div>

      {/* Orders Filter Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['ALL', 'PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'COMPLETED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab} ({orders.filter((o) => tab === 'ALL' || o.orderStatus === tab).length})
            </button>
          ))}
        </div>

        {/* Kitchen Kanban Order Cards */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((n) => <div key={n} className="h-44 bg-slate-200 rounded-3xl animate-pulse" />)}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-2">
            <Layers className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">No orders in this queue</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOrders.map((ord) => (
              <div
                key={ord._id}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-orange-600 text-base">{ord.orderNumber}</span>
                      {ord.tableNo && (
                        <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          Table #{ord.tableNo}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium">Customer: {ord.customer?.name || 'Walk-in'}</p>
                  </div>

                  <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase ${
                    ord.orderStatus === 'PENDING' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                    ord.orderStatus === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                    ord.orderStatus === 'READY' ? 'bg-purple-100 text-purple-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {ord.orderStatus}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-2 text-xs">
                  {ord.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl">
                      <div>
                        <span className="font-bold text-slate-900">{item.name} × {item.quantity}</span>
                        {item.selectedCustomizations?.length > 0 && (
                          <p className="text-[10px] text-slate-500">{item.selectedCustomizations.map((c) => c.choiceLabel).join(', ')}</p>
                        )}
                        {item.specialInstruction && (
                          <p className="text-[10px] text-amber-700 font-bold">Note: "{item.specialInstruction}"</p>
                        )}
                      </div>
                      <span className="font-extrabold text-slate-800">₹{item.totalPrice}</span>
                    </div>
                  ))}
                </div>

                {/* Action Controls */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="font-extrabold text-slate-900 text-sm">
                    Total: ₹{ord.finalAmount}
                  </div>

                  <div className="flex gap-2">
                    {ord.orderStatus === 'PENDING' && (
                      <button
                        onClick={() => handleStatusChange(ord._id, 'ACCEPTED')}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition"
                      >
                        Accept Order
                      </button>
                    )}
                    {ord.orderStatus === 'ACCEPTED' && (
                      <button
                        onClick={() => handleStatusChange(ord._id, 'PREPARING')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition"
                      >
                        Start Preparing
                      </button>
                    )}
                    {ord.orderStatus === 'PREPARING' && (
                      <button
                        onClick={() => handleStatusChange(ord._id, 'READY')}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition"
                      >
                        Mark Ready
                      </button>
                    )}
                    {ord.orderStatus === 'READY' && (
                      <button
                        onClick={() => handleStatusChange(ord._id, 'COMPLETED')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow transition"
                      >
                        Complete Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
