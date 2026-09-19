import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { SocketProvider } from './context/SocketContext';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LoginModal } from './components/LoginModal';
import { CartDrawer } from './components/CartDrawer';
import { CustomerLoginModal } from './components/CustomerLoginModal';

import { HomePage } from './pages/HomePage';

import { VendorRegisterPage } from './pages/VendorRegisterPage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';
import { VendorMenuPage } from './pages/VendorMenuPage';
import { VendorQRPage } from './pages/VendorQRPage';
import { VendorAnalyticsPage } from './pages/VendorAnalyticsPage';
import { VendorStorePage } from './pages/VendorStorePage';
import { VendorLoginPage } from './pages/VendorLoginPage';
import { useAuth } from './context/AuthContext';
import { CheckoutPage } from './pages/CheckoutPage';
import { CustomerOrdersPage } from './pages/CustomerOrdersPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';

import { AdminDashboardPage } from './pages/AdminDashboardPage';

const VendorProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user?.role !== 'VENDOR') return <Navigate to="/vendor/login" replace />;
  return children;
};

export default function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCustomerLoginOpen, setIsCustomerLoginOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <AuthProvider>
      <CartProvider>
        <SocketProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
              <Navbar
                onOpenLogin={() => setIsLoginModalOpen(true)}
                onOpenCustomerLogin={() => setIsCustomerLoginOpen(true)}
                onOpenCart={() => setIsCartOpen(true)}
              />

              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Routes>
                  {/* Public Route */}
                  <Route path="/" element={<HomePage onOpenCart={() => setIsCartOpen(true)} />} />

                  {/* Vendor Routes */}
                  <Route path="/vendor/register" element={<VendorRegisterPage />} />
                  <Route path="/vendor/login" element={<VendorLoginPage />} />
                  <Route
                    path="/vendor/dashboard"
                    element={
                      <VendorProtectedRoute>
                        <VendorDashboardPage />
                      </VendorProtectedRoute>
                    }
                  />
                  <Route
                    path="/vendor/menu"
                    element={
                      <VendorProtectedRoute>
                        <VendorMenuPage />
                      </VendorProtectedRoute>
                    }
                  />
                  <Route path="/vendor/qr" element={<VendorProtectedRoute><VendorQRPage /></VendorProtectedRoute>} />
                  <Route path="/vendor/analytics" element={<VendorProtectedRoute><VendorAnalyticsPage /></VendorProtectedRoute>} />

                  {/* Public Storefront Routes (used by stall and table QR codes) */}
                  <Route
                    path="/vendor/:vendorId/table/:tableId"
                    element={
                      <VendorStorePage
                        onOpenCart={() => setIsCartOpen(true)}
                        onOpenLogin={() => setIsCustomerLoginOpen(true)}
                      />
                    }
                  />
                  <Route
                    path="/vendor/:vendorId"
                    element={
                      <VendorStorePage
                        onOpenCart={() => setIsCartOpen(true)}
                        onOpenLogin={() => setIsCustomerLoginOpen(true)}
                      />
                    }
                  />

                  {/* Customer ordering and order tracking */}
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route
                    path="/orders"
                    element={<CustomerOrdersPage onOpenCart={() => setIsCartOpen(true)} />}
                  />
                  <Route path="/orders/:orderId" element={<OrderTrackingPage />} />

                  {/* Admin Routes */}
                  <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                  <Route path="/admin/login" element={<AdminDashboardPage />} />
                </Routes>
              </main>

              <Footer />

              {/* Vendor Login Modal */}
              <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
              <CustomerLoginModal isOpen={isCustomerLoginOpen} onClose={() => setIsCustomerLoginOpen(false)} />
              <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
            </div>
          </Router>
        </SocketProvider>
      </CartProvider>
    </AuthProvider>
  );
}
