import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, loadCsrf } from '../services/api';
import { confirmAction } from '../services/modal';

const AuthContext = createContext({
  user: null,
  config: null,
  loading: true,
  isAdmin: false,
  refreshUser: async () => {},
  refreshConfig: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api('/api/auth/me');
      setUser(data.user || null);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  const refreshConfig = useCallback(async () => {
    try {
      const data = await api('/api/config');
      setConfig(data);
      return data;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    loadCsrf();
    Promise.all([refreshUser(), refreshConfig()]).finally(() => {
      setLoading(false);
    });
  }, [refreshUser, refreshConfig]);

  const logout = useCallback(async (options = false) => {
    const skipConfirm = typeof options === 'boolean' ? options : Boolean(options && typeof options === 'object' && options.skipConfirm);
    if (!skipConfirm) {
      const confirmed = await confirmAction({
        title: 'Sign Out',
        message: 'Are you sure you want to sign out of your account?',
        confirmText: 'Yes, Sign Out',
        cancelText: 'No, Stay Signed In',
        isDanger: false,
      });
      if (!confirmed) return false;
    }
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout error:', e);
    }
    setUser(null);
    window.location.href = '/login';
    return true;
  }, []);

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        config,
        loading,
        isAdmin,
        refreshUser,
        refreshConfig,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
