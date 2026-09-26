import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ClipboardList, Home, LogOut, MessageSquare, QrCode, Settings, UtensilsCrossed } from 'lucide-react';
import Logo from '../../components/Logo';
import { ShopLogo } from '../../components/shop';
import { useToast } from '../../components/Toast';
import { cx } from '../../components/ui';
import { api, getToken } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { rupees } from '../../lib/format';
import { useSocket } from '../../lib/socket';
import { playDing } from '../../lib/sound';

const NAV = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
  { to: '/dashboard/menu', label: 'Menu', icon: UtensilsCrossed },
  { to: '/dashboard/qr', label: 'QR codes', icon: QrCode },
  { to: '/dashboard/reviews', label: 'Reviews', icon: MessageSquare },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

const ACTIVE = ['placed', 'preparing', 'ready'];

const DashboardContext = createContext(null);
/** Live dashboard data shared by all dashboard pages. */
export const useDashboard = () => useContext(DashboardContext);

export function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function ShopStatusSwitch() {
  const { vendor, setVendor } = useAuth();
  const toast = useToast();
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    setSaving(true);
    try {
      const data = await api.patch('/vendor/profile', { isOpen: !vendor.isOpen });
      setVendor(data.vendor);
      toast.success(data.vendor.isOpen ? 'Shop is open. Customers can order now 🎉' : 'Shop closed. New orders are paused.');
    } catch (err) {
      toast.error(err.message);
    }
    setSaving(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={saving}
      className={cx(
        'inline-flex items-center gap-2 rounded-full py-1.5 pl-2.5 pr-3.5 text-sm font-bold ring-1 transition-all active:scale-95',
        vendor.isOpen ? 'bg-green-50 text-green-800 ring-green-200 hover:bg-green-100' : 'bg-gray-100 text-gray-700 ring-gray-300 hover:bg-gray-200'
      )}
      title="Tap to open or close your shop"
    >
      <span className={cx('relative h-2.5 w-2.5 rounded-full', vendor.isOpen ? 'bg-green-500' : 'bg-gray-400')}>
        {vendor.isOpen && <span className="absolute inset-0 animate-ping rounded-full bg-green-500 opacity-60" />}
      </span>
      {vendor.isOpen ? 'Open' : 'Closed'}
    </button>
  );
}

function CountBadge({ count, className }) {
  if (!count) return null;
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.4 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      className={cx('rounded-full bg-gradient-to-r from-brand-500 to-rose-500 text-center font-bold text-white', className)}
    >
      {count}
    </motion.span>
  );
}

export default function DashboardLayout() {
  const { vendor, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeOrders, setActiveOrders] = useState([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  // Bumped on every order change so pages like Home can refresh their numbers
  const [version, setVersion] = useState(0);

  const refreshActive = useCallback(async () => {
    try {
      const data = await api.get('/vendor/orders?scope=active');
      setActiveOrders(data.orders);
      setOrdersLoaded(true);
    } catch {
      /* shown on the orders page */
    }
  }, []);

  /** Put a changed order into the live list (or take it out when it's done). */
  const applyOrder = useCallback((order) => {
    setActiveOrders((list) => {
      const rest = list.filter((o) => o.id !== order.id);
      if (!ACTIVE.includes(order.status)) return rest;
      return [...rest, order].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });
    setVersion((v) => v + 1);
  }, []);

  useSocket({
    token: getToken(),
    onConnect: refreshActive, // also catches up on anything missed while offline
    handlers: {
      'order:new': (order) => {
        applyOrder(order);
        playDing();
        const where = order.table ? ` · ${order.table.name}` : '';
        toast.info(`🔔 New order #${order.token}${where} from ${order.customerName}: ${rupees(order.total)}`);
      },
      'order:updated': applyOrder,
    },
  });

  const newCount = activeOrders.filter((o) => o.status === 'placed').length;

  useEffect(() => {
    document.title = newCount ? `(${newCount}) New orders - ${vendor.shopName}` : `${vendor.shopName} - Dashboard`;
  }, [newCount, vendor.shopName]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const context = { activeOrders, ordersLoaded, applyOrder, refreshActive, version };

  return (
    <DashboardContext.Provider value={context}>
      <div className="min-h-screen lg:pl-72">
        {/* Sidebar (computer / tablet) */}
        <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col overflow-hidden bg-gray-950 px-4 py-6 text-gray-300 lg:flex">
          <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand-600/25 blur-3xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-rose-600/20 blur-3xl" aria-hidden />
          <div className="relative px-2">
            <Logo to="/dashboard" light />
          </div>

          <div className="relative mt-8 flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10">
            <ShopLogo src={vendor.logoUrl} name={vendor.shopName} className="h-11 w-11 border-2 text-base" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{vendor.shopName}</p>
              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className={cx('h-1.5 w-1.5 rounded-full', vendor.isOpen ? 'bg-green-400' : 'bg-gray-500')} />
                {vendor.isOpen ? 'Taking orders' : 'Closed'}
              </p>
            </div>
          </div>

          <nav className="relative mt-6 flex-1 space-y-1">
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className="relative block">
                {({ isActive }) => (
                  <span
                    className={cx(
                      'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                      isActive ? 'text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-600 to-rose-500 shadow-glow"
                        transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                      />
                    )}
                    <Icon className="relative h-5 w-5" />
                    <span className="relative">{label}</span>
                    {label === 'Orders' && <CountBadge count={newCount} className="relative ml-auto min-w-[22px] px-1.5 py-0.5 text-xs" />}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
          <button
            onClick={handleLogout}
            className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-400 transition hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            Log out
          </button>
        </aside>

        {/* Top bar */}
        <header className="glass sticky top-0 z-30 flex items-center justify-between gap-3 border-x-0 border-t-0 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <ShopLogo src={vendor.logoUrl} name={vendor.shopName} className="h-10 w-10 border-2 text-sm lg:hidden" />
            <div className="min-w-0">
              <p className="truncate font-bold text-gray-900">
                {greeting()}, {vendor.name.split(' ')[0]} 👋
              </p>
              <p className="truncate text-xs text-gray-500">{vendor.shopName}</p>
            </div>
          </div>
          <ShopStatusSwitch />
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <Outlet />
          </motion.div>
        </main>

        {/* Bottom tabs (phone) */}
        <nav className="glass fixed inset-x-2 bottom-2 z-30 grid grid-cols-6 rounded-2xl pb-[env(safe-area-inset-bottom)] shadow-lift lg:hidden">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx('relative flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold', isActive ? 'text-brand-700' : 'text-gray-500')
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="tab-active"
                      className="absolute inset-x-1.5 inset-y-1 rounded-xl bg-brand-50"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  )}
                  <Icon className="relative h-5 w-5" />
                  <span className="relative">{label === 'QR codes' ? 'QR' : label}</span>
                  {label === 'Orders' && (
                    <CountBadge count={newCount} className="absolute right-[14%] top-1 min-w-[18px] px-1 text-[10px] leading-[18px]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </DashboardContext.Provider>
  );
}
