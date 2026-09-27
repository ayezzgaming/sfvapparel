'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AdminUser, AdminRole } from '@/types/database';

interface AdminAuthState {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: AdminRole | null;
}

interface AdminAuthContextValue extends AdminAuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (data: { full_name?: string; phone?: string; current_password?: string; new_password?: string }) => Promise<{ success: boolean; message?: string }>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [state, setState] = useState<AdminAuthState>({
    admin: null,
    isLoading: true,
    isAuthenticated: false,
    role: null,
  });

  const refresh = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const res = await fetch('/api/admin/auth/me', { credentials: 'include' });
      const data = await res.json();

      if (data.success && data.admin) {
        setState({
          admin: data.admin,
          isLoading: false,
          isAuthenticated: true,
          role: data.admin.role,
        });
      } else {
        setState({
          admin: null,
          isLoading: false,
          isAuthenticated: false,
          role: null,
        });
      }
    } catch {
      setState({
        admin: null,
        isLoading: false,
        isAuthenticated: false,
        role: null,
      });
    }
  }, []);

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = true) => {
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe }),
      });
      const data = await res.json();

      if (data.success && data.admin) {
        setState({
          admin: data.admin,
          isLoading: false,
          isAuthenticated: true,
          role: data.admin.role,
        });
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message || 'Log masuk gagal.' };
    } catch {
      return { success: false, message: 'Ralat sambungan pelayan.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setState({
      admin: null,
      isLoading: false,
      isAuthenticated: false,
      role: null,
    });
    router.push('/admin/login');
  }, [router]);

  const updateProfile = useCallback(async (profileData: {
    full_name?: string;
    phone?: string;
    current_password?: string;
    new_password?: string;
  }) => {
    try {
      const res = await fetch('/api/admin/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });
      const data = await res.json();

      if (data.success && data.admin) {
        setState((prev) => ({ ...prev, admin: { ...prev.admin, ...data.admin } }));
        return { success: true, message: data.message };
      }

      return { success: false, message: data.message || 'Gagal mengemaskini profil.' };
    } catch {
      return { success: false, message: 'Ralat sambungan pelayan.' };
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AdminAuthContext.Provider value={{ ...state, login, logout, refresh, updateProfile }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>');
  return ctx;
}
