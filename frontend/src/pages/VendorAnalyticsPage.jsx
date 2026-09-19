import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, ShoppingBag, Users, TrendingUp, Award, Clock } from 'lucide-react';
import { analyticsService } from '../services/api';

export const VendorAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getVendorAnalytics();
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-16 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => <div key={n} className="h-28 bg-slate-200 rounded-3xl animate-pulse" />)}
        </div>
        <div className="h-72 bg-slate-200 rounded-3xl animate-pulse" />
      </div>
    );
  }

  const { financials, customerMetrics, popularItems, peakHours } = analytics || {};

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Business Analytics & Revenue</h1>
        <p className="text-xs text-slate-500">Track gross sales, platform commissions, peak ordering hours & top selling food items</p>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Sales</span>
            <DollarSign className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">₹{financials?.totalRevenue || 0}</div>
          <p className="text-[11px] text-slate-500 font-medium">Completed Orders: {financials?.completedOrdersCount || 0}</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Net Earnings</span>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <div className="text-2xl font-extrabold text-orange-600">₹{financials?.netEarnings || 0}</div>
          <p className="text-[11px] text-slate-500 font-medium">Commission Paid: ₹{financials?.totalCommissionPaid || 0}</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Repeat Customers</span>
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{customerMetrics?.repeatRatePercentage || '0%'}</div>
          <p className="text-[11px] text-slate-500 font-medium">Unique Buyers: {customerMetrics?.totalUniqueCustomers || 0}</p>
        </div>
      </div>

      {/* Peak Ordering Hours Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" /> Peak Ordering Hours
        </h3>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={peakHours}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={10} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', color: '#fff', border: 'none', fontSize: '12px' }}
              />
              <Bar dataKey="ordersCount" fill="#ea580c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Popular Items Leaderboard */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-4 shadow-xs">
        <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-500" /> Top Selling Menu Items
        </h3>

        <div className="divide-y divide-slate-100">
          {popularItems?.map((item, idx) => (
            <div key={item._id} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-slate-400 w-4">#{idx + 1}</span>
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=100'}
                  alt={item.name}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                />
                <div>
                  <span className="font-bold text-slate-900">{item.name}</span>
                  <p className="text-[10px] text-slate-400 font-medium">Price: ₹{item.price}</p>
                </div>
              </div>

              <span className="font-extrabold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                {item.totalOrdersCount} Sold
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
