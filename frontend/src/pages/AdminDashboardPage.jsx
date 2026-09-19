import React, { useState, useEffect } from 'react';
import { Shield, Store, Users, ShoppingBag, DollarSign, CheckCircle2, XCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { adminService } from '../services/api';

export const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [activeTab, setActiveTab] = useState('VENDORS'); // VENDORS, TICKETS
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const statRes = await adminService.getAdminStats();
      const vendorRes = await adminService.getAllVendors();
      const ticketRes = await adminService.getSupportTickets();

      if (statRes.success) setStats(statRes.data?.overview);
      if (vendorRes.success) setVendors(vendorRes.data || []);
      if (ticketRes.success) setTickets(ticketRes.data || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleVendorStatusUpdate = async (vendorId, status) => {
    try {
      await adminService.updateVendorStatus(vendorId, status, 5.0);
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => <div key={n} className="h-28 bg-slate-200 rounded-3xl animate-pulse" />)}
        </div>
        <div className="h-72 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 max-w-6xl mx-auto">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-purple-600 text-white p-2 rounded-xl">
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Super Admin Portal</h1>
        </div>
        <p className="text-xs text-slate-500">Platform-wide statistics, vendor applications approval, customer control & support helpdesk</p>
      </div>

      {/* Overview Platform Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Revenue</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">₹{stats?.totalGrossRevenue || 0}</div>
          <p className="text-[11px] text-slate-500 font-medium">Platform Commission: ₹{stats?.totalPlatformCommission || 0}</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Food Stalls</span>
            <Store className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.totalVendors || 0}</div>
          <p className="text-[11px] text-amber-600 font-bold">Pending Approvals: {stats?.pendingVendorsCount || 0}</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <ShoppingBag className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.totalOrders || 0}</div>
          <p className="text-[11px] text-slate-500 font-medium">Completed: {stats?.completedOrders || 0}</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Customers</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats?.totalCustomers || 0}</div>
          <p className="text-[11px] text-slate-500 font-medium">Open Help Tickets: {stats?.openTickets || 0}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('VENDORS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'VENDORS' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Vendor Applications ({vendors.length})
          </button>
          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'TICKETS' ? 'bg-purple-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Support Tickets ({tickets.length})
          </button>
        </div>

        {/* Vendors Management Table */}
        {activeTab === 'VENDORS' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-6 border-b border-slate-100 font-extrabold text-slate-900 text-base">
              Vendor Applications & Status
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              {vendors.map((v) => (
                <div key={v._id} className="p-4 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                      {v.stallName?.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-sm">{v.stallName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          v.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          v.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {v.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Owner: {v.owner?.name} ({v.owner?.mobile})</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {v.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleVendorStatusUpdate(v._id, 'APPROVED')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow transition"
                      >
                        Approve
                      </button>
                    )}
                    {v.status !== 'SUSPENDED' && (
                      <button
                        onClick={() => handleVendorStatusUpdate(v._id, 'SUSPENDED')}
                        className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-xl transition"
                      >
                        Suspend
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
