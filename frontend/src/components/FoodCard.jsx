import React from 'react';
import { Plus, Clock, Star, AlertCircle } from 'lucide-react';

export const FoodCard = ({ item, onSelectCustomization, onQuickAdd }) => {
  const hasCustomizations = item.customizations && item.customizations.length > 0;
  const isOutOfStock = !item.isAvailable || item.stockQuantity <= 0;
  const isLowStock = item.stockQuantity > 0 && item.stockQuantity <= (item.lowStockThreshold || 5);

  const displayPrice = item.discountPrice > 0 ? item.discountPrice : item.price;
  const originalPrice = item.discountPrice > 0 ? item.price : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition overflow-hidden flex flex-col justify-between group relative">
      <div>
        {/* Food Image & Badges */}
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          <img
            src={item.image || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=500&auto=format&fit=crop&q=80'}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />

          {/* Veg / Non-Veg Indicator */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg border border-slate-200 shadow-sm">
            <div className={`w-3 h-3 rounded-full ${item.isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
          </div>

          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center">
              <span className="bg-red-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-full uppercase tracking-wider shadow">
                Sold Out
              </span>
            </div>
          )}

          {/* Low Stock Warning Badge */}
          {isLowStock && !isOutOfStock && (
            <div className="absolute bottom-3 left-3 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow">
              <AlertCircle className="w-3 h-3" /> Only {item.stockQuantity} Left
            </div>
          )}

          {/* Preparation Time */}
          {item.preparationTime && (
            <div className="absolute top-3 right-3 bg-slate-900/80 text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg backdrop-blur-sm flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              {item.preparationTime} min
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-slate-800 text-base leading-snug group-hover:text-orange-600 transition">
              {item.name}
            </h3>
          </div>

          {item.description && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          )}

          {hasCustomizations && (
            <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Customizable Options
            </span>
          )}
        </div>
      </div>

      {/* Price & Action */}
      <div className="p-4 pt-0 flex items-center justify-between mt-2 border-t border-slate-100 pt-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-extrabold text-slate-900 text-lg">₹{displayPrice}</span>
            {originalPrice && (
              <span className="text-xs text-slate-400 line-through font-medium">
                ₹{originalPrice}
              </span>
            )}
          </div>
        </div>

        <button
          disabled={isOutOfStock}
          onClick={() => (hasCustomizations ? onSelectCustomization(item) : onQuickAdd(item))}
          className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border border-orange-200 hover:border-orange-600'
          }`}
        >
          <Plus className="w-4 h-4" />
          {hasCustomizations ? 'Customize' : 'Add'}
        </button>
      </div>
    </div>
  );
};
