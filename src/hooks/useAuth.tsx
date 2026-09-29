'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';

export interface AuthCustomer {
  id: string;
  full_name: string;
  whatsapp: string | null;
  phone?: string | null;
  email: string | null;
  company_or_team?: string | null;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone_verified: boolean;
  total_orders?: number;
  total_spent?: number;
}

interface AuthState {
  customer: AuthCustomer | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  networkError: string | null;
}

interface AuthContextValue extends AuthState {
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { full_name: string; email?: string; company_or_team?: string }) => Promise<{ success: boolean; message?: string }>;
  updateAddress: (data: { address: string; postal_code?: string; city?: string }) => Promise<{ success: boolean; message?: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    customer: null,
    isLoading: true,
    isAuthenticated: false,
    networkError: null,
  });

  const refresh = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true, networkError: null }));
      const res = await fetch('/api/auth/me', { credentials: 'include' });

      if (res.status === 401 || res.status === 403) {
        // Explicitly unauthorized / session expired
        setState({ customer: null, isLoading: false, isAuthenticated: false, networkError: null });
        return;
      }

      if (!res.ok) {
        // 5xx Server error / connection issue - do not force reset authentication
        setState((prev) => ({
          ...prev,
          isLoading: false,
          networkError: `Pelayan ralat (${res.status}). Sila cuba sebentar lagi.`,
        }));
        return;
      }

      const data = await res.json();
      if (data.success && data.customer) {
        setState({ customer: data.customer, isLoading: false, isAuthenticated: true, networkError: null });
      } else {
        setState({ customer: null, isLoading: false, isAuthenticated: false, networkError: null });
      }
    } catch (err) {
      console.error('Customer auth validation network error:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        networkError: 'Gagal menyambung ke pelayan. Sila semak sambungan internet anda.',
      }));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setState({ customer: null, isLoading: false, isAuthenticated: false, networkError: null });
  }, []);

  const updateProfile = useCallback(async (profileData: { full_name: string; email?: string; company_or_team?: string }) => {
    try {
      const res = await fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (data.success && data.customer) {
        setState((prev) => ({ ...prev, customer: data.customer }));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Gagal mengemaskini profil.' };
    } catch {
      return { success: false, message: 'Ralat sambungan pelayan.' };
    }
  }, []);

  const updateAddress = useCallback(async (addressData: { address: string; postal_code?: string; city?: string }) => {
    try {
      const res = await fetch('/api/auth/address/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(addressData),
      });
      const data = await res.json();
      if (data.success && data.customer) {
        setState((prev) => ({ ...prev, customer: data.customer }));
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || 'Gagal mengemaskini alamat.' };
    } catch {
      return { success: false, message: 'Ralat sambungan pelayan.' };
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ ...state, refresh, logout, updateProfile, updateAddress }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
