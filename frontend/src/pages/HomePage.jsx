import React, { useState, useEffect } from 'react';
import { Search, QrCode, Store, Utensils, Sparkles, MapPin, ChevronRight } from 'lucide-react';
import { vendorService } from '../services/api';
import { VendorCard } from '../components/VendorCard';
import { Link } from 'react-router-dom';

export const HomePage = ({ onOpenCart }) => {
  const [vendors, setVendors] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [loading, setLoading] = useState(true);

  const cuisines = ['All', 'North Indian', 'Chaat', 'Street Food', 'Snacks', 'Tibetan', 'Chinese', 'South Indian'];

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCuisine && selectedCuisine !== 'All') params.cuisine = selectedCuisine;

      const res = await vendorService.getPublicVendors(params);
      if (res.success) {
        setVendors(res.data || []);
      }
    } catch (err) {
      console.error('Error loading vendors:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, [search, selectedCuisine]);

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-orange-950 text-white rounded-3xl overflow-hidden p-6 sm:p-12 shadow-2xl border border-slate-800">
        <div className="max-w-3xl space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Sparkles className="w-4 h-4" /> Smart QR Street Food Ordering
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Scan. Customize. <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Order Local.</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
            Order fresh food directly from local street vendors, food carts, and stalls using table QR codes. Enjoy real-time kitchen tracking & contactless digital payments!
          </p>

          {/* Search Bar */}
          <div className="relative max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by stall name or dish (e.g. Vada Pav, Samosa, Momos)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-sm font-semibold text-white placeholder-slate-400 focus:outline-none focus:bg-white/20 focus:border-orange-400 transition"
            />
          </div>
        </div>

        {/* Decorative Background Artwork */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Cuisine Filter Pills */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-slate-900 text-xl tracking-tight flex items-center gap-2">
            <Utensils className="w-5 h-5 text-orange-600" /> Explore Popular Cuisines
          </h2>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {cuisines.map((cuisine) => {
            const isSelected = (selectedCuisine === cuisine) || (cuisine === 'All' && !selectedCuisine);
            return (
              <button
                key={cuisine}
                onClick={() => setSelectedCuisine(cuisine === 'All' ? '' : cuisine)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cuisine}
              </button>
            );
          })}
        </div>
      </section>

      {/* Featured Vendors Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-extrabold text-slate-900 text-2xl tracking-tight">Active Street Food Stalls</h2>
            <p className="text-xs text-slate-500">Verified local food carts offering fresh ordering</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-3">
            <Store className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-lg">No Food Stalls Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Try resetting your search query or cuisine filter to view available street vendors.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vendors.map((vendor) => (
              <VendorCard key={vendor._id} vendor={vendor} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
