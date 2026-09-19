import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('sv_token');
    if (!token) {
      setUser(null);
      setVendor(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res.success && res.data) {
        if (res.data.user?.role === 'VENDOR' && !res.data.vendor) {
          localStorage.removeItem('sv_token');
          setUser(null);
          setVendor(null);
          return;
        }
        setUser(res.data.user);
        setVendor(res.data.vendor || null);
      }
    } catch (err) {
      console.warn('Auth token expired or invalid:', err.message);
      localStorage.removeItem('sv_token');
      setUser(null);
      setVendor(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const loginWithToken = (token, userData, vendorData = null) => {
    localStorage.setItem('sv_token', token);
    setUser({ ...userData, _id: userData._id || userData.id });
    setVendor(vendorData);
  };

  const logout = () => {
    localStorage.removeItem('sv_token');
    setUser(null);
    setVendor(null);
  };

  return (
    <AuthContext.Provider value={{ user, vendor, loading, loginWithToken, logout, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
