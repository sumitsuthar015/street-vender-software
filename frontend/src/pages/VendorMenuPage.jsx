import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Utensils, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { menuService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const VendorMenuPage = ({ onOpenLogin }) => {
  const { user, vendor } = useAuth();
  const { socket } = useSocket();

  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category Modal State
  const [categoryName, setCategoryName] = useState('');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryMsg, setCategoryMsg] = useState('');
  const [categoryMsgType, setCategoryMsgType] = useState('error'); // 'error' | 'success'
  const [savingCategory, setSavingCategory] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Item Form Modal State
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [savingItem, setSavingItem] = useState(false);
  const [itemError, setItemError] = useState('');
  const [itemForm, setItemForm] = useState({
    name: '',
    category: '',
    price: '',
    discountPrice: '',
    description: '',
    image: '',
    stockQuantity: 50,
    preparationTime: 10,
    isVeg: true
  });

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const catRes = await menuService.getCategories();
      const itemRes = await menuService.getMenuItems();

      if (catRes.success) setCategories(catRes.data || []);
      if (itemRes.success) setMenuItems(itemRes.data || []);
    } catch (err) {
      console.error('Fetch Menu Error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Listen for real-time menu updates via Socket.IO
  useEffect(() => {
    if (!socket || !vendor?._id) return;

    socket.emit('join_vendor_room', vendor._id);

    const handleLiveMenuUpdate = () => {
      fetchData();
    };

    socket.on('menu:updated', handleLiveMenuUpdate);

    return () => {
      socket.off('menu:updated', handleLiveMenuUpdate);
    };
  }, [socket, vendor?._id]);

  if (!user || user.role !== 'VENDOR' || !vendor) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-extrabold text-slate-800 text-xl">Vendor Login Required</h2>
        <p className="text-xs text-slate-500">Please sign in with your vendor account to manage categories, menu dishes, and inventory stock.</p>
        <button
          onClick={onOpenLogin}
          className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl shadow-lg transition"
        >
          Sign In to Your Account
        </button>
      </div>
    );
  }

  const handleAddCategory = async (e) => {
    e.preventDefault();
    // Client-side validation first
    if (!categoryName.trim()) {
      setCategoryMsg('⚠️ Please enter a category name.');
      setCategoryMsgType('error');
      return;
    }
    try {
      setSavingCategory(true);
      setCategoryMsg(''); // clear previous error only on new attempt
      const res = await menuService.createCategory({ name: categoryName.trim() });
      if (res.success) {
        const savedName = res.data?.name || categoryName.trim();
        setCategoryName('');
        setShowCategoryModal(false);
        await fetchData();
        setSuccessToast(`✅ Category "${savedName}" added successfully!`);
        setTimeout(() => setSuccessToast(''), 3500);
      } else {
        // Handle non-throwing API failure (success:false with 200)
        setCategoryMsg(res.message || 'Failed to save category. Please try again.');
        setCategoryMsgType('error');
      }
    } catch (err) {
      // HTTP 4xx/5xx errors land here — show the server's error message inline
      setCategoryMsg(err.message || 'Failed to add category. Please try again.');
      setCategoryMsgType('error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    if (!itemForm.name.trim()) {
      setItemError('⚠️ Item name is required.');
      return;
    }
    if (!itemForm.price || Number(itemForm.price) <= 0) {
      setItemError('⚠️ Please enter a valid price.');
      return;
    }
    try {
      setSavingItem(true);
      setItemError('');
      if (editingItem) {
        await menuService.updateMenuItem(editingItem._id, itemForm);
      } else {
        await menuService.createMenuItem(itemForm);
      }
      setShowItemModal(false);
      setEditingItem(null);
      await fetchData();
      setSuccessToast(`✅ Food item "${itemForm.name.trim()}" ${editingItem ? 'updated' : 'added'} successfully!`);
      setTimeout(() => setSuccessToast(''), 3500);
    } catch (err) {
      setItemError(err.message || 'Failed to save item. Please try again.');
    } finally {
      setSavingItem(false);
    }
  };

  const handleStockUpdate = async (itemId, currentStock) => {
    const nextStock = prompt('Enter new available stock quantity:', currentStock);
    if (nextStock === null) return;
    try {
      await menuService.updateStock(itemId, { stockQuantity: parseInt(nextStock, 10) });
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await menuService.deleteMenuItem(itemId);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCategory = async (catId) => {
    if (!window.confirm('Delete this category and its associated menu items?')) return;
    try {
      await menuService.deleteCategory(catId);
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          {successToast}
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Menu & Inventory Manager</h1>
          <p className="text-xs text-slate-500">Configure your menu categories, dishes, prices & available stock with live updates</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setCategoryMsg('');
              setCategoryName('');
              setShowCategoryModal(true);
            }}
            className="bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-orange-600" /> Add Category
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setItemError('');
              setItemForm({
                name: '',
                category: categories[0]?._id || '',
                price: '',
                discountPrice: '',
                description: '',
                image: '',
                stockQuantity: 50,
                preparationTime: 10,
                isVeg: true
              });
              setShowItemModal(true);
            }}
            className="bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" /> Add Food Item
          </button>
        </div>
      </div>

      {/* Active Categories List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 space-y-3 shadow-xs">
        <h3 className="font-extrabold text-slate-900 text-base">Menu Categories ({categories.length})</h3>
        {categories.length === 0 ? (
          <div className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
            <p>No custom categories created yet.</p>
            <button
              onClick={() => {
                setCategoryMsg('');
                setCategoryName('');
                setShowCategoryModal(true);
              }}
              className="inline-block bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm"
            >
              + Create Your First Category
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <div
                key={c._id}
                className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-800 flex items-center gap-2 shadow-2xs"
              >
                <span>{c.name}</span>
                <button
                  onClick={() => handleDeleteCategory(c._id)}
                  className="text-slate-400 hover:text-red-600 transition"
                  title="Delete Category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Menu Items Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-base">Active Food Items ({menuItems.length})</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading menu database...</div>
        ) : menuItems.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <Utensils className="w-10 h-10 mx-auto text-slate-300" />
            <p>No food items added yet. Click "Add Food Item" to build your menu!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            {menuItems.map((item) => (
              <div key={item._id} className="p-4 flex items-center justify-between gap-4 text-xs hover:bg-slate-50/80 transition">
                <div className="flex items-center gap-3">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=100'}
                    alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-sm">{item.name}</span>
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">
                        {item.category?.name || 'General'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{item.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <span className="font-extrabold text-sm text-slate-900">₹{item.price}</span>
                    {item.discountPrice > 0 && <span className="text-[10px] text-emerald-600 font-bold block">Offer: ₹{item.discountPrice}</span>}
                  </div>

                  <button
                    onClick={() => handleStockUpdate(item._id, item.stockQuantity)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                      item.stockQuantity <= 5
                        ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    Stock: {item.stockQuantity} Pcs
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setItemForm({
                          name: item.name,
                          category: item.category?._id || '',
                          price: item.price,
                          discountPrice: item.discountPrice || '',
                          description: item.description || '',
                          image: item.image || '',
                          stockQuantity: item.stockQuantity,
                          preparationTime: item.preparationTime || 10,
                          isVeg: item.isVeg
                        });
                        setShowItemModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item._id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowCategoryModal(false)}
          />
          {/* Modal content — stopPropagation prevents backdrop click from firing when clicking inside */}
          <div
            className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl z-10 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-extrabold text-slate-900 text-lg">Add Menu Category</h3>

            {/* Error / info message — always visible when set */}
            {categoryMsg && (
              <div className={`rounded-xl p-3 text-xs font-semibold border ${
                categoryMsgType === 'error'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {categoryMsg}
              </div>
            )}

            <form onSubmit={handleAddCategory} className="space-y-4">
              <input
                type="text"
                placeholder="e.g. Special Chaat, Drinks, Snacks"
                value={categoryName}
                onChange={(e) => { setCategoryName(e.target.value); setCategoryMsg(''); }}
                className={`w-full px-3.5 py-2.5 bg-slate-50 border rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 ${
                  categoryMsg ? 'border-red-400' : 'border-slate-200'
                }`}
                autoFocus
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl shadow transition disabled:opacity-60"
                >
                  {savingCategory ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowItemModal(false)} />
          <div
            className="relative bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-extrabold text-slate-900 text-lg">
              {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
            </h3>

            {/* Inline error for item modal */}
            {itemError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3 rounded-xl">
                {itemError}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Special Samosa (2 Pcs)"
                  value={itemForm.name}
                  onChange={(e) => { setItemForm({ ...itemForm, name: e.target.value }); setItemError(''); }}
                  className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold focus:outline-none focus:border-orange-500 ${
                    itemError && !itemForm.name.trim() ? 'border-red-400' : 'border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Category (Optional)</label>
                <select
                  value={itemForm.category}
                  onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="">Select Category (or Auto-create General)</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="50"
                    value={itemForm.price}
                    onChange={(e) => { setItemForm({ ...itemForm, price: e.target.value }); setItemError(''); }}
                    className={`w-full px-3 py-2 bg-slate-50 border rounded-xl font-semibold focus:outline-none focus:border-orange-500 ${
                      itemError && (!itemForm.price || Number(itemForm.price) <= 0) ? 'border-red-400' : 'border-slate-200'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Discount Price (₹)</label>
                  <input
                    type="number"
                    placeholder="45"
                    value={itemForm.discountPrice}
                    onChange={(e) => setItemForm({ ...itemForm, discountPrice: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={itemForm.stockQuantity}
                    onChange={(e) => setItemForm({ ...itemForm, stockQuantity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prep Time (mins)</label>
                  <input
                    type="number"
                    min="1"
                    value={itemForm.preparationTime}
                    onChange={(e) => setItemForm({ ...itemForm, preparationTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Crispy hot samosa served with tamarind chutney"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={itemForm.image}
                  onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingItem}
                  className="flex-1 py-2.5 bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow disabled:opacity-60 transition"
                >
                  {savingItem ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
