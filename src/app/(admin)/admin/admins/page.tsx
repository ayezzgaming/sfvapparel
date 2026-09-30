'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminUser, AdminRole } from '@/types/database';
import {
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  Users,
  KeyRound,
  Lock,
  Mail,
  Phone,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit2,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  X
} from 'lucide-react';

function AdminManagementContent() {
  const searchParams = useSearchParams();
  const { admin: currentAdmin, updateProfile, role: currentRole } = useAdminAuth();

  const initialTab = searchParams.get('tab') === 'password'
    ? 'password'
    : searchParams.get('tab') === 'profile'
    ? 'profile'
    : 'team';

  const [activeTab, setActiveTab] = useState<'team' | 'password' | 'profile'>(initialTab);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [resetPasswordAdmin, setResetPasswordAdmin] = useState<AdminUser | null>(null);
  const [deleteAdmin, setDeleteAdmin] = useState<AdminUser | null>(null);

  // Form states for Add Admin
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<AdminRole>('admin');
  const [newPhone, setNewPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Reset Password Modal (when Super Admin resets other admins)
  const [targetNewPassword, setTargetNewPassword] = useState('');
  const [showTargetPassword, setShowTargetPassword] = useState(false);

  // Form states for Change Password Tab (Personal password change)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPersonalPassword, setNewPersonalPassword] = useState('');
  const [confirmPersonalPassword, setConfirmPersonalPassword] = useState('');
  const [showPersonalPassword, setShowPersonalPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form states for My Profile Tab
  const [profileEmail, setProfileEmail] = useState(currentAdmin?.email || '');
  const [profileName, setProfileName] = useState(currentAdmin?.full_name || '');
  const [profilePhone, setProfilePhone] = useState(currentAdmin?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  useEffect(() => {
    if (currentAdmin) {
      setProfileEmail(currentAdmin.email || '');
      setProfileName(currentAdmin.full_name || '');
      setProfilePhone(currentAdmin.phone || '');
    }
  }, [currentAdmin]);

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/admins', { credentials: 'include' });
      const data = await res.json();
      if (data.success && Array.isArray(data.admins)) {
        setAdmins(data.admins);
      } else {
        setFeedback({ type: 'error', message: data.message || 'Gagal memuat senarai pentadbir.' });
      }
    } catch {
      setFeedback({ type: 'error', message: 'Ralat sambungan pangkalan data.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4500);
  };

  // Handle Create Admin
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!newEmail.trim() || !newPassword || !newFullName.trim()) {
      showToast('error', 'Sila lengkapkan semua ruangan yang bertanda wajib.');
      return;
    }

    if (newPassword.length < 6) {
      showToast('error', 'Kata laluan mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: newEmail.trim(),
          password: newPassword,
          full_name: newFullName.trim(),
          role: newRole,
          phone: newPhone.trim() || null,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', data.message || 'Pentadbir berjaya ditambah!');
        setIsAddModalOpen(false);
        setNewEmail('');
        setNewPassword('');
        setNewFullName('');
        setNewRole('admin');
        setNewPhone('');
        fetchAdmins();
      } else {
        showToast('error', data.message || 'Gagal menambah pentadbir.');
      }
    } catch {
      showToast('error', 'Ralat sambungan pelayan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Admin (Role/Status/Phone/Name/Email)
  const handleUpdateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAdmin || isSubmitting) return;

    if (!editAdmin.email?.trim() || !editAdmin.full_name?.trim()) {
      showToast('error', 'Sila lengkapkan nama dan emel pentadbir.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/admins/${editAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: editAdmin.email.trim(),
          full_name: editAdmin.full_name.trim(),
          role: editAdmin.role,
          phone: editAdmin.phone,
          is_active: editAdmin.is_active,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', data.message || 'Maklumat pentadbir berjaya dikemaskini.');
        setEditAdmin(null);
        fetchAdmins();
      } else {
        showToast('error', data.message || 'Gagal mengemaskini maklumat.');
      }
    } catch {
      showToast('error', 'Ralat sambungan pelayan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Reset Password of Another Admin
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordAdmin || isSubmitting) return;

    if (!targetNewPassword || targetNewPassword.length < 6) {
      showToast('error', 'Kata laluan baru mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/admins/${resetPasswordAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          new_password: targetNewPassword,
        }),
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', `Kata laluan untuk ${resetPasswordAdmin.full_name} berjaya ditukar!`);
        setResetPasswordAdmin(null);
        setTargetNewPassword('');
      } else {
        showToast('error', data.message || 'Gagal menukar kata laluan.');
      }
    } catch {
      showToast('error', 'Ralat sambungan pelayan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Admin
  const handleDeleteAdmin = async () => {
    if (!deleteAdmin || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/admins/${deleteAdmin.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await res.json();

      if (data.success) {
        showToast('success', data.message || 'Pentadbir berjaya dipadam.');
        setDeleteAdmin(null);
        fetchAdmins();
      } else {
        showToast('error', data.message || 'Gagal memadam pentadbir.');
      }
    } catch {
      showToast('error', 'Ralat sambungan pelayan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Personal Password Change (Tab 2)
  const handleChangeMyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isChangingPassword) return;

    if (!currentPassword) {
      showToast('error', 'Sila masukkan kata laluan semasa anda.');
      return;
    }

    if (!newPersonalPassword || newPersonalPassword.length < 6) {
      showToast('error', 'Kata laluan baru mestilah sekurang-kurangnya 6 aksara.');
      return;
    }

    if (newPersonalPassword !== confirmPersonalPassword) {
      showToast('error', 'Pengesahan kata laluan baru tidak sepadan.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await updateProfile({
        current_password: currentPassword,
        new_password: newPersonalPassword,
      });

      if (res.success) {
        showToast('success', 'Kata laluan pentadbir berjaya ditukar!');
        setCurrentPassword('');
        setNewPersonalPassword('');
        setConfirmPersonalPassword('');
      } else {
        showToast('error', res.message || 'Gagal menukar kata laluan.');
      }
    } catch {
      showToast('error', 'Ralat sambungan pelayan.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle My Profile Info & Email Update (Tab 3)
  const handleSaveMyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUpdatingProfile) return;

    if (!profileEmail.trim()) {
      showToast('error', 'Sila masukkan emel pentadbir.');
      return;
    }

    if (!profileName.trim()) {
      showToast('error', 'Sila masukkan nama penuh pentadbir.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await updateProfile({
        email: profileEmail.trim(),
        full_name: profileName.trim(),
        phone: profilePhone.trim() || undefined,
      });

      if (res.success) {
        showToast('success', 'Maklumat profil dan emel berjaya disimpan.');
      } else {
        showToast('error', res.message || 'Gagal mengemaskini profil.');
      }
    } catch {
      showToast('error', 'Ralat sambungan pelayan.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Filtered Admins
  const filteredAdmins = admins.filter((adm) => {
    const matchSearch =
      adm.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      adm.phone?.includes(searchQuery);
    const matchRole = roleFilter === 'all' || adm.role === roleFilter;
    return matchSearch && matchRole;
  });

  const superAdminCount = admins.filter((a) => a.role === 'super_admin').length;
  const standardAdminCount = admins.filter((a) => a.role === 'admin').length;
  const operatorCount = admins.filter((a) => a.role === 'operator').length;

  return (
    <div className="space-y-6 pb-12 select-none font-sans">
      {/* Toast Notification Banner */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-2xl border shadow-xl flex items-center gap-3 max-w-md animate-slide-in backdrop-blur-md ${
            feedback.type === 'success'
              ? 'bg-emerald-500/90 text-white border-emerald-400'
              : 'bg-rose-500/90 text-white border-rose-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-xs font-semibold leading-tight">{feedback.message}</span>
        </div>
      )}

      {/* Top Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Pengurusan & Tetapan Pentadbir
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052FF] text-[11px] font-bold border border-blue-100">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0052FF]" />
              <span>Kawalan Keselamatan</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Urus akaun pentadbir kilang, tukar kata laluan, dan kemaskini emel log masuk anda.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAdmins}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
            title="Muat Semula Senarai"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0052FF]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-[#0052FF]" />
            <span>Tukar Kata Laluan</span>
          </button>

          {(currentRole === 'super_admin' || currentRole === 'admin') && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Tambah Pentadbir</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Jumlah Pentadbir</p>
            <p className="text-lg font-bold text-slate-900">{admins.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Super Admin</p>
            <p className="text-lg font-bold text-slate-900">{superAdminCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Admin Pengurusan</p>
            <p className="text-lg font-bold text-slate-900">{standardAdminCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Pegawai Operasi</p>
            <p className="text-lg font-bold text-slate-900">{operatorCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('team')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'team'
              ? 'text-[#0052FF] border-b-2 border-[#0052FF]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pasukan Pentadbir ({admins.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('password')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'password'
              ? 'text-[#0052FF] border-b-2 border-[#0052FF]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Tukar Kata Laluan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'profile'
              ? 'text-[#0052FF] border-b-2 border-[#0052FF]'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Maklumat Emel & Profil</span>
        </button>
      </div>

      {/* TAB 1: TEAM LIST */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="w-full sm:w-80">
              <input
                type="text"
                placeholder="Cari mengikut nama, emel, atau telefon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#00BDFF] transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0">Peranan:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700 focus:outline-none focus:bg-white focus:border-[#00BDFF] cursor-pointer"
              >
                <option value="all">Semua Peranan</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="operator">Operator</option>
              </select>
            </div>
          </div>

          {/* Admins Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            {isLoading ? (
              <div className="py-16 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#00BDFF] mx-auto mb-2" />
                <p className="text-xs text-slate-500">Memuat senarai pentadbir...</p>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Tiada pentadbir ditemui</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Tiada rekod pentadbir yang sepadan dengan carian anda.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                      <th className="py-3 px-4">Pentadbir</th>
                      <th className="py-3 px-4">Peranan</th>
                      <th className="py-3 px-4">Telefon</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Log Masuk Terakhir</th>
                      <th className="py-3 px-4 text-right">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdmins.map((adm) => {
                      const isCurrent = adm.id === currentAdmin?.id;
                      return (
                        <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* Admin Details */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0052FF] to-[#00BDFF] text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                                {adm.full_name?.charAt(0)?.toUpperCase() || 'A'}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-900 truncate">{adm.full_name}</p>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 rounded bg-blue-100 text-[#0052FF] text-[9.5px] font-bold">
                                      Anda
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">{adm.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            {adm.role === 'super_admin' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10.5px] font-bold border border-amber-200">
                                <ShieldAlert className="w-3 h-3 text-amber-600" />
                                <span>Super Admin</span>
                              </span>
                            ) : adm.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10.5px] font-bold border border-sky-200">
                                <ShieldCheck className="w-3 h-3 text-[#00BDFF]" />
                                <span>Admin</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10.5px] font-medium border border-slate-200">
                                <span>Operator</span>
                              </span>
                            )}
                          </td>

                          {/* Phone */}
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                            {adm.phone || '-'}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4">
                            {adm.is_active ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>Aktif</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                                <span className="w-2 h-2 rounded-full bg-rose-400" />
                                <span>Nyahaktif</span>
                              </span>
                            )}
                          </td>

                          {/* Last Login */}
                          <td className="py-3.5 px-4 text-[11px] text-slate-500">
                            {adm.last_login_at
                              ? new Date(adm.last_login_at).toLocaleString('ms-MY', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Belum pernah log masuk'}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Button */}
                              {(currentRole === 'super_admin' || currentRole === 'admin') && (
                                <button
                                  type="button"
                                  onClick={() => setEditAdmin(adm)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                                  title="Kemaskini Maklumat"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Reset Password Button */}
                              {(currentRole === 'super_admin' || currentRole === 'admin') && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setResetPasswordAdmin(adm);
                                    setTargetNewPassword('');
                                  }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                                  title="Reset Kata Laluan"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Button */}
                              {currentRole === 'super_admin' && !isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => setDeleteAdmin(adm)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Padam Akaun"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CHANGE PASSWORD (FOCUSED DEDICATED TAB) */}
      {activeTab === 'password' && (
        <div className="max-w-xl space-y-6">
          <form onSubmit={handleChangeMyPassword} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center font-bold">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Tukar Kata Laluan Pentadbir</h2>
                  <p className="text-xs text-slate-400">Akaun: {currentAdmin?.email}</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kata Laluan Semasa <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] transition-all">
                    <Lock className="w-4 h-4 text-slate-400 mr-2.5" />
                    <input
                      type={showPersonalPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata laluan semasa anda"
                      required
                      className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPersonalPassword(!showPersonalPassword)}
                      className="text-slate-400 hover:text-slate-700 ml-2 focus:outline-none cursor-pointer"
                    >
                      {showPersonalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kata Laluan Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] transition-all">
                    <KeyRound className="w-4 h-4 text-slate-400 mr-2.5" />
                    <input
                      type={showPersonalPassword ? 'text' : 'password'}
                      value={newPersonalPassword}
                      onChange={(e) => setNewPersonalPassword(e.target.value)}
                      placeholder="Min 6 aksara"
                      required
                      className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Sahkan Kata Laluan Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] transition-all">
                    <KeyRound className="w-4 h-4 text-slate-400 mr-2.5" />
                    <input
                      type={showPersonalPassword ? 'text' : 'password'}
                      value={confirmPersonalPassword}
                      onChange={(e) => setConfirmPersonalPassword(e.target.value)}
                      placeholder="Ulang kata laluan baru anda"
                      required
                      className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword || !currentPassword || !newPersonalPassword || !confirmPersonalPassword}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan Kata Laluan...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Kata Laluan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: MY PROFILE & EMAIL SETTINGS */}
      {activeTab === 'profile' && (
        <div className="max-w-xl space-y-6">
          <form onSubmit={handleSaveMyProfile} className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0052FF] to-[#00BDFF] text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {currentAdmin?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{currentAdmin?.full_name}</h2>
                  <p className="text-xs text-slate-400">{currentAdmin?.email}</p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Emel Pentadbir
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] transition-all">
                    <Mail className="w-4 h-4 text-slate-400 mr-2.5" />
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      required
                      placeholder="admin@sfvapparel.com"
                      className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Emel ini digunakan sebagai ID utama untuk log masuk ke portal pentadbir.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Penuh
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] transition-all">
                    <User className="w-4 h-4 text-slate-400 mr-2.5" />
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nombor Telefon
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-50 border border-slate-200 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] transition-all">
                    <Phone className="w-4 h-4 text-slate-400 mr-2.5" />
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+60 12 345 6789"
                      className="w-full text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isUpdatingProfile || !profileEmail.trim() || !profileName.trim()}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Menyimpan Maklumat...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Simpan Profil</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW ADMIN
         ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tambah Pentadbir Baru</h3>
                  <p className="text-[11px] text-slate-400">Daftarkan akaun staf pentadbiran kilang</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Penuh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Cth: Muhammad Hazim"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#00BDFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Emel Pentadbir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="hazim@sfvapparel.com"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#00BDFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kata Laluan Masuk <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 aksara"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#00BDFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Peranan Akses
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as AdminRole)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#00BDFF] cursor-pointer"
                  >
                    <option value="admin">Admin</option>
                    <option value="operator">Operator Kilang</option>
                    {currentRole === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    No. Telefon (Pilihan)
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="60123456789"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#00BDFF]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newEmail.trim() || !newPassword || !newFullName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Daftar Pentadbir</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT ADMIN DETAILS & ROLE
         ========================================================================= */}
      {editAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kemaskini Pentadbir</h3>
                  <p className="text-[11px] text-slate-400">{editAdmin.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditAdmin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nama Penuh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editAdmin.full_name}
                  onChange={(e) => setEditAdmin({ ...editAdmin, full_name: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#00BDFF]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Emel Pentadbir <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={editAdmin.email}
                  onChange={(e) => setEditAdmin({ ...editAdmin, email: e.target.value })}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#00BDFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Peranan Akses
                  </label>
                  <select
                    value={editAdmin.role}
                    onChange={(e) => setEditAdmin({ ...editAdmin, role: e.target.value as AdminRole })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#00BDFF] cursor-pointer"
                  >
                    <option value="admin">Admin</option>
                    <option value="operator">Operator Kilang</option>
                    {currentRole === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    No. Telefon
                  </label>
                  <input
                    type="text"
                    value={editAdmin.phone || ''}
                    onChange={(e) => setEditAdmin({ ...editAdmin, phone: e.target.value })}
                    placeholder="60123456789"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:bg-white focus:border-[#00BDFF]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Status Akaun
                </label>
                <div className="flex items-center gap-4 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={editAdmin.is_active}
                      onChange={() => setEditAdmin({ ...editAdmin, is_active: true })}
                      className="text-[#0052FF]"
                    />
                    <span className="text-xs font-medium text-emerald-700">Aktif</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={!editAdmin.is_active}
                      onChange={() => setEditAdmin({ ...editAdmin, is_active: false })}
                      className="text-rose-500"
                    />
                    <span className="text-xs font-medium text-rose-600">Nyahaktifkan</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditAdmin(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !editAdmin.full_name.trim() || !editAdmin.email.trim()}
                  className="px-5 py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: RESET PASSWORD (SUPER ADMIN RESETS ANOTHER USER)
         ========================================================================= */}
      {resetPasswordAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Reset Kata Laluan</h3>
                  <p className="text-[11px] text-slate-400">{resetPasswordAdmin.full_name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetPasswordAdmin(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Sesi sedia ada bagi pengguna ini akan dipadam secara automatik dan mereka perlu log masuk menggunakan kata laluan baru.
            </p>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Kata Laluan Baru
                </label>
                <div className="relative">
                  <input
                    type={showTargetPassword ? 'text' : 'password'}
                    value={targetNewPassword}
                    onChange={(e) => setTargetNewPassword(e.target.value)}
                    placeholder="Masukkan kata laluan baru (min 6 aksara)"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:bg-white focus:border-[#00BDFF]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTargetPassword(!showTargetPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showTargetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setResetPasswordAdmin(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !targetNewPassword || targetNewPassword.length < 6}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <KeyRound className="w-4 h-4" />
                  )}
                  <span>Tetapkan Kata Laluan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DELETE ADMIN CONFIRMATION
         ========================================================================= */}
      {deleteAdmin && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-sm w-full p-6 shadow-2xl space-y-4 animate-scale-in text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold mx-auto ring-4 ring-rose-100/50">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">Padam Akaun Pentadbir?</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Adakah anda pasti mahu memadam akaun <strong>{deleteAdmin.full_name}</strong> ({deleteAdmin.email})? Tindakan ini tidak boleh diundur.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteAdmin(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors w-1/2 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteAdmin}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-500/20 active:scale-95 disabled:opacity-40 transition-all w-1/2 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Ya, Padam</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#00BDFF] mx-auto mb-2" />
          <p className="text-xs text-slate-500">Memuatkan halaman pentadbir...</p>
        </div>
      }
    >
      <AdminManagementContent />
    </Suspense>
  );
}
