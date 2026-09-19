import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, CheckCircle2, XCircle } from 'lucide-react';

export const VendorCard = ({ vendor }) => {
  return (
    <Link
      to={`/vendor/${vendor._id}`}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition duration-300 overflow-hidden flex flex-col group"
    >
      {/* Cover Image & Open Status Pill */}
      <div className="relative h-40 w-full overflow-hidden bg-slate-100">
        <img
          src={vendor.coverImage || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1000&auto=format&fit=crop&q=80'}
          alt={vendor.stallName}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />

        {/* Status Pill */}
        <div className="absolute top-3 left-3">
          {vendor.isOpen ? (
            <span className="bg-emerald-600/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> OPEN NOW
            </span>
          ) : (
            <span className="bg-slate-900/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm shadow-sm flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5 text-red-400" /> CLOSED
            </span>
          )}
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-white/95 text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          {vendor.rating || 4.5}
          <span className="text-[10px] text-slate-500 font-normal">({vendor.totalReviews || 0})</span>
        </div>

        {/* Stall Logo Avatar */}
        <div className="absolute -bottom-5 left-4 w-12 h-12 rounded-xl bg-white border-2 border-white shadow-md overflow-hidden">
          <img
            src={vendor.logo || 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&auto=format&fit=crop&q=80'}
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Details */}
      <div className="p-4 pt-7 space-y-2 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-orange-600 transition leading-snug">
            {vendor.stallName}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
            {vendor.cuisineType?.join(' • ') || 'Street Food, Fast Food'}
          </p>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 max-w-[180px] truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{vendor.address?.street || 'Local Food Plaza'}</span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {vendor.preparationTimeMin || 15} mins
          </div>
        </div>
      </div>
    </Link>
  );
};
