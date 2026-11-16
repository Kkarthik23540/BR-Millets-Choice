import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setCsrf } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await api('/api/auth/me');
      setUser(data.user);
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
    Promise.all([refreshUser(), refreshConfig()]).finally(() => {
      setLoading(false);
    });
  }, [refreshUser, refreshConfig]);

  const login = async (email, password) => {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.csrfToken) setCsrf(data.csrfToken);
    await refreshUser();
    return data;
  };

  const logout = async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue cleanup even if server session is already expired
    }
    setCsrf('');
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        config,
        loading,
        refreshUser,
        refreshConfig,
        login,
        logout,
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
