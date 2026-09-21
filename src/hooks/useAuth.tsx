'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export interface AuthCustomer {
  id: string;
  full_name: string;
  whatsapp: string | null;
  email: string | null;
  phone_verified: boolean;
  total_orders?: number;
  total_spent?: number;
}

interface AuthState {
  customer: AuthCustomer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    customer: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refresh = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.customer) {
        setState({ customer: data.customer, isLoading: false, isAuthenticated: true });
      } else {
        setState({ customer: null, isLoading: false, isAuthenticated: false });
      }
    } catch {
      setState({ customer: null, isLoading: false, isAuthenticated: false });
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setState({ customer: null, isLoading: false, isAuthenticated: false });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ ...state, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
