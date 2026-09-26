import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import { PageLoader } from './components/ui';

// Each page is downloaded only when it's opened, so customers scanning a QR code
// don't download the vendor dashboard.
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Register })));
const NotFound = lazy(() => import('./pages/NotFound'));
const DashboardLayout = lazy(() => import('./pages/dashboard/DashboardLayout'));
const Overview = lazy(() => import('./pages/dashboard/Overview'));
const Orders = lazy(() => import('./pages/dashboard/Orders'));
const Menu = lazy(() => import('./pages/dashboard/Menu'));
const Reviews = lazy(() => import('./pages/dashboard/Reviews'));
const QrCodePage = lazy(() => import('./pages/dashboard/QrCode'));
const Settings = lazy(() => import('./pages/dashboard/Settings'));
const ShopPage = lazy(() => import('./pages/shop/ShopPage'));
const OrderPage = lazy(() => import('./pages/shop/OrderPage'));

function RequireVendor({ children }) {
  const { vendor, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!vendor) return <Navigate to="/login" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { vendor, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (vendor) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

        {/* Vendor dashboard */}
        <Route path="/dashboard" element={<RequireVendor><DashboardLayout /></RequireVendor>}>
          <Route index element={<Overview />} />
          <Route path="orders" element={<Orders />} />
          <Route path="menu" element={<Menu />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="qr" element={<QrCodePage />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Customer pages (opened by scanning the shop's or a table's QR code) */}
        <Route path="/s/:slug" element={<ShopPage />} />
        <Route path="/order/:code" element={<OrderPage />} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
