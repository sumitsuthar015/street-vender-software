import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, CheckCircle2, XCircle, Search, QrCode, Sparkles, Utensils } from 'lucide-react';
import { vendorService, reviewService } from '../services/api';
import { FoodCard } from '../components/FoodCard';
import { FoodCustomizationModal } from '../components/FoodCustomizationModal';
import { CustomerLoginModal } from '../components/CustomerLoginModal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const VendorStorePage = ({ onOpenCart }) => {
  const { vendorId, tableId } = useParams();
  const navigate = useNavigate();
  const { cart, addToCart, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();

  const [vendor, setVendor] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Customization Modal State
  const [customizingItem, setCustomizingItem] = useState(null);
  const [showCustomerLogin, setShowCustomerLogin] = useState(false);
  const clearedCartForVendor = useRef('');

  const isCustomer = user?.role === 'CUSTOMER';

  useEffect(() => {
    if (!authLoading && !isCustomer) {
      setShowCustomerLogin(true);
    }
  }, [authLoading, isCustomer]);

  useEffect(() => {
    const cartVendorId = cart?.vendor?._id || cart?.vendor;
    if (isCustomer && cartVendorId && cartVendorId !== vendorId && clearedCartForVendor.current !== vendorId) {
      clearedCartForVendor.current = vendorId;
      clearCart();
    }
  }, [cart?.vendor, clearCart, isCustomer, vendorId]);

  const fetchStorefrontData = async () => {
    try {
      setLoading(true);
      const res = await vendorService.getVendorDetails(vendorId);
      if (res.success && res.data) {
        setVendor(res.data.vendor);
        setCategories(res.data.categories || []);
        setMenuItems(res.data.menuItems || []);
      }

      // Fetch Reviews
      const revRes = await reviewService.getVendorReviews(vendorId);
      if (revRes.success) {
        setReviews(revRes.data || []);
      }
    } catch (err) {
      console.error('Storefront error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStorefrontData();
  }, [vendorId]);

  // Real-time live menu update listener via Socket.IO
  useEffect(() => {
    if (!socket || !vendorId) return;

    socket.emit('join_store_room', vendorId);

    const handleLiveStorefrontUpdate = () => {
      fetchStorefrontData();
    };

    socket.on('menu:updated', handleLiveStorefrontUpdate);

    return () => {
      socket.off('menu:updated', handleLiveStorefrontUpdate);
    };
  }, [socket, vendorId]);

  const handleQuickAdd = async (item) => {
    if (!isCustomer) {
      setShowCustomerLogin(true);
      return;
    }
    try {
      await addToCart(vendor._id, item._id, 1, [], '', tableId || '');
      onOpenCart();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCustomizationConfirm = async ({ item, quantity, selectedCustomizations, specialInstruction }) => {
    if (!isCustomer) {
      setShowCustomerLogin(true);
      return;
    }
    try {
      await addToCart(vendor._id, item._id, quantity, selectedCustomizations, specialInstruction, tableId || '');
      onOpenCart();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'ALL' || item.category?._id === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 px-4 space-y-6">
        <div className="h-64 bg-slate-200 rounded-3xl animate-pulse" />
        <div className="h-12 bg-slate-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => <div key={n} className="h-56 bg-slate-200 rounded-2xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-3">
        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
        <h2 className="font-extrabold text-slate-800 text-xl">Vendor Store Not Found</h2>
        <p className="text-xs text-slate-500">The QR code scanned or link accessed does not match an active vendor.</p>
        <button onClick={() => navigate('/')} className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl">
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Table Binding Notice Banner (If scanned via Table QR) */}
      {tableId && (
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white p-3.5 rounded-2xl shadow-lg flex items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 shrink-0" />
            <span>Table Ordering Active: You are ordering from <strong>Table #{tableId}</strong></span>
          </div>
          <span className="bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg uppercase tracking-wider text-[10px]">
            Dine-In Mode
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Cover Photo */}
        <div className="h-48 sm:h-64 w-full overflow-hidden bg-slate-900 relative">
          <img
            src={vendor.coverImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000'}
            alt={vendor.stallName}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>

        {/* Vendor Profile Info */}
        <div className="p-6 sm:p-8 relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-1 shadow-2xl border-2 border-white overflow-hidden shrink-0">
              <img
                src={vendor.logo || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300'}
                alt="Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>

            <div className="space-y-1 text-slate-800">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  {vendor.stallName}
                </h1>
                {vendor.isOpen ? (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                    OPEN NOW
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-red-200">
                    CLOSED
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 font-medium">
                {vendor.description || 'Authentic fresh local food.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-1">
                <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{vendor.rating || 4.5}</span>
                  <span className="text-slate-400 font-normal">({vendor.totalReviews || 0} reviews)</span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Prep: ~{vendor.preparationTimeMin || 15} mins</span>
                </div>

                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{vendor.address?.street || 'Local Market'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Categories Bar & Search Filter */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search items in menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Categories Horizontal Selector */}
          <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedCategory === 'ALL'
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              All Items ({menuItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id}
                onClick={() => setSelectedCategory(cat._id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  selectedCategory === cat._id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredMenuItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 space-y-2">
            <Utensils className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="font-bold text-slate-700 text-base">No items available in this category</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMenuItems.map((item) => (
              <FoodCard
                key={item._id}
                item={item}
                onSelectCustomization={(selected) => setCustomizingItem(selected)}
                onQuickAdd={handleQuickAdd}
              />
            ))}
          </div>
        )}
      </div>

      {/* Customer Verified Reviews Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
        <h3 className="font-extrabold text-slate-900 text-xl tracking-tight flex items-center gap-2">
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Customer Ratings & Verified Reviews
        </h3>

        {reviews.length === 0 ? (
          <p className="text-xs text-slate-400 italic">No customer reviews published yet. Be the first to leave a review!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {reviews.map((rev) => (
              <div key={rev._id} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
                      {rev.customer?.name?.charAt(0) || 'C'}
                    </div>
                    <span className="font-bold text-xs text-slate-800">{rev.customer?.name}</span>
                  </div>
                  <div className="flex text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>

                {rev.comment && <p className="text-xs text-slate-600">{rev.comment}</p>}
                <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  ✓ Verified Purchase
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Food Customization Modal */}
      {customizingItem && (
        <FoodCustomizationModal
          item={customizingItem}
          isOpen={Boolean(customizingItem)}
          onClose={() => setCustomizingItem(null)}
          onConfirm={handleCustomizationConfirm}
        />
      )}

      <CustomerLoginModal
        isOpen={showCustomerLogin}
        onClose={() => setShowCustomerLogin(false)}
      />
    </div>
  );
};
