import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  const logout = useCallback(() => {
    setToken(null);
    setVendor(null);
  }, []);

  const login = useCallback((token, vendorData) => {
    setToken(token);
    setVendor(vendorData);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    api
      .get('/auth/me')
      .then((data) => setVendor(data.vendor))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [logout]);

  const value = useMemo(
    () => ({ vendor, loading, login, logout, setVendor }),
    [vendor, loading, login, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
