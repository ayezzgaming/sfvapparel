'use client';

import React from 'react';
import { AdminAuthProvider } from '@/hooks/useAdminAuth';
import AdminLayoutShell from '@/components/admin/AdminLayoutShell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthProvider>
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </AdminAuthProvider>
  );
}
