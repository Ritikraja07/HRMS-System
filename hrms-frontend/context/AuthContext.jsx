'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { setAuthToken } from '../lib/axios';
import { normalizeRole, getDefaultDashboard } from '../utils/constants';

const SESSION_COOKIE = 'hrms_session';

const setSessionCookie = (session) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(JSON.stringify(session))}; expires=${expires}; path=/; SameSite=Lax`;
};

const clearSessionCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = `${SESSION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const getSessionFromCookie = () => {
  if (typeof document === 'undefined') return null;
  try {
    const row = document.cookie.split('; ').find(r => r.startsWith(`${SESSION_COOKIE}=`));
    if (!row) return null;
    return JSON.parse(decodeURIComponent(row.split('=').slice(1).join('=')));
  } catch {
    return null;
  }
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = getSessionFromCookie();
    if (saved?.user && saved?.access_token) {
      setUser(saved.user);
      setSession(saved);
      setAuthToken(saved.access_token);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
    let res;
    try {
      res = await fetch(`${backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      throw new Error('Cannot reach the server. Check your connection or try again.');
    }
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error(`Server error (${res.status}). The backend may not be running.`);
    }
    if (!data.success) throw new Error(data.message || 'Login failed');

    const { user: userData, session: sessionData } = data.data;
    const normalizedUser = { ...userData, role: normalizeRole(userData.role) };

    const sessionObj = {
      ...sessionData,
      user: normalizedUser,
      access_token: sessionData.access_token,
    };

    setUser(normalizedUser);
    setSession(sessionObj);
    setSessionCookie(sessionObj);
    setAuthToken(sessionData.access_token);

    return { user: normalizedUser, redirectTo: getDefaultDashboard(normalizedUser.role) };
  }, []);

  const logout = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch {}
    setUser(null);
    setSession(null);
    clearSessionCookie();
    setAuthToken(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      const saved = getSessionFromCookie();
      if (saved) setSessionCookie({ ...saved, user: updated });
      return updated;
    });
  }, []);

  const role = normalizeRole(user?.role);

  const value = {
    user,
    session,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isSuperAdmin: role === 'super_admin',
    isAdmin: ['admin', 'super_admin'].includes(role),
    isManager: role === 'manager',
    isEmployee: role === 'employee',
    isManagerOrAdmin: ['manager', 'admin', 'super_admin'].includes(role),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
