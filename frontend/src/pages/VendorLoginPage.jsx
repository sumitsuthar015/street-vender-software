import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LoginModal } from '../components/LoginModal';
import { useAuth } from '../context/AuthContext';

export const VendorLoginPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user?.role === 'VENDOR') {
    return <Navigate to="/vendor/dashboard" replace />;
  }

  return (
    <LoginModal
      isOpen
      standalone
      onClose={() => navigate('/')}
      onLoginSuccess={() => navigate('/vendor/dashboard', { replace: true })}
    />
  );
};
