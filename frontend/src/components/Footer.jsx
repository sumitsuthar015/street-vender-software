import React from 'react';
import { Store, ShieldCheck, QrCode, Smartphone, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Footer = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const isStorefront = /^\/vendor\/[^/]+(?:\/table\/[^/]+)?$/.test(pathname);

  if (isStorefront) return null;

  return (
    <footer className="bg-slate-900 text-slate-400 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2 text-white">
              <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-2 rounded-xl">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">StreetVendor</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering local street food vendors, food carts, and food stalls with instant QR ordering, real-time kitchen tracking, and contactless payments.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm text-slate-200 uppercase tracking-wider mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              {user?.role?.toUpperCase() !== 'VENDOR' && (
                <li><Link to="/" className="hover:text-orange-400 transition">Discover Stalls</Link></li>
              )}
              <li><Link to="/orders" className="hover:text-orange-400 transition">Customer Orders</Link></li>
            </ul>
          </div>

          {/* Key Features */}
          <div>
            <h4 className="font-semibold text-sm text-slate-200 uppercase tracking-wider mb-4">Platform Features</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2"><QrCode className="w-4 h-4 text-orange-500" /> QR-Code Table Ordering</li>
              <li className="flex items-center gap-2"><Smartphone className="w-4 h-4 text-amber-500" /> Mobile OTP Login</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Razorpay Verified Payments</li>
              <li className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-purple-500" /> Real-time Kitchen Tracking</li>
            </ul>
          </div>

          {/* Admin & Security */}
          <div>
            <h4 className="font-semibold text-sm text-slate-200 uppercase tracking-wider mb-4">System</h4>
            <p className="text-xs text-slate-400 mb-3">
              Production-grade architecture with Node.js, Express, MongoDB Atlas, Socket.IO & Razorpay integration.
            </p>
            <Link
              to="/admin/login"
              className="inline-block text-xs font-semibold text-purple-400 bg-purple-950/60 border border-purple-800/60 px-3 py-1.5 rounded-lg hover:bg-purple-900 transition"
            >
              Super Admin Portal
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Smart Street Vendor Platform. All rights reserved.</p>
          <p className="text-slate-400 font-medium">Designed for Street Food Business Scalability</p>
        </div>
      </div>
    </footer>
  );
};
