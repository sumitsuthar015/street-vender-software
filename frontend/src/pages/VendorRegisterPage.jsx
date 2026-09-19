import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, User, Smartphone, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { authService } from '../services/api';

export const VendorRegisterPage = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    ownerName: '',
    mobile: '',
    email: '',
    stallName: '',
    description: '',
    street: '',
    city: 'Delhi',
    openTime: '09:00',
    closeTime: '22:00'
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setErrorMsg('');

      const payload = {
        ownerName: formData.ownerName,
        mobile: formData.mobile,
        email: formData.email,
        stallName: formData.stallName,
        description: formData.description,
        address: { street: formData.street, city: formData.city },
        openingHours: { openTime: formData.openTime, closeTime: formData.closeTime }
      };

      const res = await authService.registerVendor(payload);
      if (res.success && res.data) {
        setSuccessMsg('🎉 Registration submitted! Pending Super Admin approval.');
        setTimeout(() => navigate('/'), 1800);
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Store className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Partner Your Food Stall</h1>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Start accepting contactless QR code orders, digital payments, and real-time kitchen tracking!
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-50 text-red-700 text-xs font-semibold p-4 rounded-2xl border border-red-200">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-4 rounded-2xl border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Stall Details */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-slate-400">1. Stall / Food Cart Details</h3>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Stall / Cart Name *</label>
            <input
              type="text"
              name="stallName"
              required
              placeholder="e.g. Ramesh Mumbai Vada Pav Corner"
              value={formData.stallName}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Short Description</label>
            <input
              type="text"
              name="description"
              placeholder="Famous spicy Vada Pav, Crispy Samosas & Masala Chai"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Street Address / Food Hub Location</label>
              <input
                type="text"
                name="street"
                placeholder="Stall 14, Main CP Market"
                value={formData.street}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Owner Account Details */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider text-slate-400">2. Owner Login Credentials</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Owner Name *</label>
              <input
                type="text"
                name="ownerName"
                required
                placeholder="Ramesh Sharma"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mobile Number *</label>
              <input
                type="tel"
                name="mobile"
                required
                placeholder="9876543210"
                value={formData.mobile}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                placeholder="ramesh@foodcart.com"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div className="hidden" aria-hidden="true">
              <label className="text-xs font-bold text-slate-700 block mb-1">Account Password</label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-extrabold text-sm py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 transition"
        >
          {loading ? 'Submitting Application...' : 'Register Vendor Stall'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
