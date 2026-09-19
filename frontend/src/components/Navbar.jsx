import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, Store, User, LogOut, Shield, QrCode, Menu as MenuIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export const Navbar = ({ onOpenLogin, onOpenCustomerLogin, onOpenCart }) => {
  const { user, vendor, logout } = useAuth();
  const { itemCount } = useCart();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const vendorRouteName = pathname.split('/')[2];
  const isVendorManagementRoute = ['dashboard', 'menu', 'qr', 'analytics', 'login', 'register'].includes(vendorRouteName);
  const isStorefront = /^\/vendor\/[^/]+(?:\/table\/[^/]+)?$/.test(pathname) && !isVendorManagementRoute;
  const isVendor = user?.role?.toUpperCase() === 'VENDOR';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-2 rounded-xl shadow-md">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                StreetVendor
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                Smart QR Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Actions */}
          <div className="hidden md:flex items-center gap-4">
            {!isStorefront && !isVendor && (
              <Link
                to="/"
                className="text-sm font-semibold text-slate-700 hover:text-orange-600 transition"
              >
                Discover Stalls
              </Link>
            )}

            {!isStorefront && user?.role === 'ADMIN' && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 text-sm font-semibold bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-100 transition"
              >
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </Link>
            )}

            {!isStorefront && isVendor && (
              <Link
                to="/vendor/dashboard"
                className="flex items-center gap-1.5 text-sm font-semibold bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-200 hover:bg-orange-100 transition"
              >
                <Store className="w-4 h-4" />
                Vendor Portal
              </Link>
            )}

            {!isVendor && (
              <button
                onClick={onOpenCart}
                className="relative p-2 text-slate-700 hover:text-orange-600 bg-slate-100 hover:bg-orange-50 rounded-xl transition flex items-center gap-2 border border-slate-200"
              >
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <span className="text-xs font-bold text-slate-800">Cart</span>
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {itemCount}
                  </span>
                )}
              </button>
            )}

            {/* User Account / Auth */}
            {!isStorefront && !user && (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-orange-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-orange-300 transition"
              >
                Vendor Login
              </button>
            )}
            {isStorefront && !user && (
              <button
                onClick={onOpenCustomerLogin}
                className="text-sm font-semibold text-slate-700 hover:text-orange-600 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-orange-300 transition"
              >
                Customer Login
              </button>
            )}
            {!isStorefront && user ? (
              <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold text-sm shadow">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <span className="max-w-[100px] truncate">{user.name}</span>
                </div>
                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-600 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : null}
          </div>

          {/* Mobile Cart & Hamburger Trigger */}
          <div className="flex md:hidden items-center gap-2">
            {!isVendor && (
              <button
                onClick={onOpenCart}
                className="relative p-2 bg-orange-50 text-orange-600 rounded-xl border border-orange-200"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-orange-600 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </button>
            )}
            {isStorefront && !user && (
              <button
                onClick={onOpenCustomerLogin}
                className="p-2 text-slate-700 bg-slate-100 rounded-xl text-[11px] font-bold"
                aria-label="Customer Login"
              >
                Login
              </button>
            )}
            {!isStorefront && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-700 bg-slate-100 rounded-xl"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && !isStorefront && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-3">
          {!isVendor && (
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-slate-800 py-2 border-b border-slate-100"
            >
              Discover Stalls
            </Link>
          )}
          {!user && (
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (isStorefront) {
                  onOpenCustomerLogin();
                } else {
                  onOpenLogin();
                }
              }}
              className="block w-full text-left text-sm font-semibold text-slate-800 py-2 border-b border-slate-100"
            >
              {isStorefront ? 'Customer Login' : 'Vendor Login'}
            </button>
          )}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-purple-600 py-2 border-b border-slate-100"
            >
              Super Admin Portal
            </Link>
          )}
          {isVendor && (
            <Link
              to="/vendor/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-semibold text-orange-600 py-2 border-b border-slate-100"
            >
              Vendor Portal
            </Link>
          )}
          {user ? (
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 text-sm font-semibold text-red-600"
            >
              Logout ({user.name})
            </button>
          ) : null}
        </div>
      )}
    </header>
  );
};
