'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import { Customer, Order } from '@/types/database';
import { saveCustomerDb, deleteCustomerDb, getCustomersDb } from '@/app/actions/customerActions';
import {
  Search,
  Mail,
  Phone,
  MapPin,
  LayoutGrid,
  List,
  Users,
  ShoppingBag,
  DollarSign,
  Building2,
  UserCheck,
  Award,
  Calendar,
  X,
  ExternalLink,
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Clock,
  ArrowUpRight,
  MessageSquare,
  AlertTriangle,
  FileText
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import Link from 'next/link';

export default function AdminCustomersPage() {
  const { customers, orders } = useAppStore();
  
  // View & Filter States (Default: List View)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'organization'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modal / Drawer States
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    id: '',
    full_name: '',
    phone: '',
    email: '',
    company_or_team: '',
    address: '',
    city: '',
    postal_code: '',
    notes: '',
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  // Refresh Customers from DB
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await getCustomersDb();
      window.location.reload();
    } catch {
      // no-op
    } finally {
      setRefreshing(false);
    }
  };

  // Compute metrics per customer (linking with active orders in real-time)
  const customerMetrics = useMemo(() => {
    return customers.map((cust) => {
      const custOrders = orders.filter((o) => {
        const phoneMatch = o.customer_phone && cust.phone && 
          o.customer_phone.replace(/\D/g, '') === cust.phone.replace(/\D/g, '');
        const emailMatch = o.customer_email && cust.email && 
          o.customer_email.toLowerCase() === cust.email.toLowerCase();
        const nameMatch = o.customer_name && cust.full_name && 
          o.customer_name.toLowerCase().trim() === cust.full_name.toLowerCase().trim();
        return phoneMatch || emailMatch || nameMatch;
      });

      const computedSpent = custOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), Number(cust.total_spent) || 0);
      const computedOrdersCount = Math.max(Number(cust.total_orders) || 0, custOrders.length);
      const isTeam = Boolean(cust.company_or_team && cust.company_or_team.trim().length > 0);

      return {
        ...cust,
        matchedOrders: custOrders,
        computedSpent,
        computedOrdersCount,
        isTeam,
      };
    });
  }, [customers, orders]);

  // Summary statistics
  const stats = useMemo(() => {
    const totalCount = customerMetrics.length;
    const totalRevenue = customerMetrics.reduce((sum, c) => sum + c.computedSpent, 0);
    const totalOrderCount = customerMetrics.reduce((sum, c) => sum + c.computedOrdersCount, 0);
    const repeatCustomers = customerMetrics.filter((c) => c.computedOrdersCount > 1).length;
    const teamCount = customerMetrics.filter((c) => c.isTeam).length;

    return {
      totalCount,
      totalRevenue,
      totalOrderCount,
      repeatCustomers,
      teamCount,
      individualCount: totalCount - teamCount,
    };
  }, [customerMetrics]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customerMetrics.filter((c) => {
      if (filterType === 'organization' && !c.isTeam) return false;
      if (filterType === 'individual' && c.isTeam) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.full_name.toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        const matchTeam = (c.company_or_team || '').toLowerCase().includes(q);
        const matchCity = (c.city || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchTeam && !matchCity) return false;
      }
      return true;
    });
  }, [customerMetrics, filterType, searchQuery]);

  // Open Details Drawer
  const handleOpenDetail = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsDetailDrawerOpen(true);
  };

  // Open Create Form
  const handleOpenCreate = () => {
    setCustomerToEdit(null);
    setFormData({
      id: '',
      full_name: '',
      phone: '',
      email: '',
      company_or_team: '',
      address: '',
      city: '',
      postal_code: '',
      notes: '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Form
  const handleOpenEdit = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCustomerToEdit(customer);
    setFormData({
      id: customer.id || '',
      full_name: customer.full_name || '',
      phone: customer.phone || '',
      email: customer.email && !customer.email.includes('@whatsapp.noreply') ? customer.email : '',
      company_or_team: customer.company_or_team || '',
      address: customer.address || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      notes: customer.notes || '',
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // Open Delete Confirmation
  const handleOpenDelete = (customer: Customer, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  // Save Customer (Create / Update)
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setFormError('Sila masukkan nama penuh pelanggan.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Sila masukkan nombor telefon / WhatsApp pelanggan.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      const res = await saveCustomerDb({
        id: formData.id || undefined,
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        company_or_team: formData.company_or_team.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        postal_code: formData.postal_code.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });

      if (res.success) {
        setIsFormModalOpen(false);
        if (selectedCustomer && selectedCustomer.id === formData.id && res.customer) {
          setSelectedCustomer(res.customer);
        }
        window.location.reload();
      } else {
        setFormError(res.message || 'Gagal menyimpan rekod pelanggan.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ralat semasa menyimpan.';
      setFormError(msg);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Confirm Delete Customer
  const handleConfirmDelete = async () => {
    if (!customerToDelete?.id) return;
    setDeleteSubmitting(true);
    try {
      const res = await deleteCustomerDb(customerToDelete.id);
      if (res.success) {
        setIsDeleteModalOpen(false);
        if (selectedCustomer?.id === customerToDelete.id) {
          setIsDetailDrawerOpen(false);
          setSelectedCustomer(null);
        }
        window.location.reload();
      } else {
        alert(res.message || 'Gagal memadam pelanggan.');
      }
    } catch {
      alert('Ralat sambungan semasa memadam pelanggan.');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Matched orders of currently selected customer
  const currentSelectedMetrics = useMemo(() => {
    if (!selectedCustomer) return null;
    const found = customerMetrics.find((c) => c.id === selectedCustomer.id);
    if (found) return found;
    return {
      ...selectedCustomer,
      matchedOrders: [] as Order[],
      computedSpent: Number(selectedCustomer.total_spent) || 0,
      computedOrdersCount: Number(selectedCustomer.total_orders) || 0,
      isTeam: Boolean(selectedCustomer.company_or_team && selectedCustomer.company_or_team.trim().length > 0),
    };
  }, [selectedCustomer, customerMetrics]);

  return (
    <div className="w-full h-full overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950 flex flex-col p-4 gap-3 text-slate-900 dark:text-zinc-100 font-sans select-none">
      
      {/* ----------------- TOP TOOLBAR ----------------- */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[38px]">
        {/* Left: Title & Filter Tabs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
              Direktori Pelanggan
            </span>
            <span className="text-[10px] font-semibold text-[#00BDFF] bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-900">
              {filteredCustomers.length} Pelanggan
            </span>
          </div>

          <div className="hidden sm:flex items-center space-x-1 bg-slate-100/90 dark:bg-zinc-800/90 backdrop-blur-md p-1 rounded-full border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
            {[
              { id: 'all', label: `Semua (${stats.totalCount})` },
              { id: 'individual', label: `Individu (${stats.individualCount})` },
              { id: 'organization', label: `Kelab & Pasukan (${stats.teamCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#00BDFF] text-white font-bold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-[#00BDFF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Search, View Mode Switcher, & Add Button */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, telefon, kelab..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30 focus:border-[#00BDFF] transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-full border border-slate-200 dark:border-zinc-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-900 text-[#00BDFF] shadow-xs'
                  : 'text-slate-500 hover:text-[#00BDFF]'
              }`}
              title="Paparan Senarai Jadual (Default)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-[#00BDFF] shadow-xs'
                  : 'text-slate-500 hover:text-[#00BDFF]'
              }`}
              title="Paparan Kad Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#00BDFF]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {/* ----------------- CLEAN METRICS SUMMARY STRIP ----------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Jumlah Pelanggan
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
              {stats.totalCount}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-[#00BDFF] flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Kelab & Pasukan
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
              {stats.teamCount}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Nilai Belanja (LTV)
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats.totalRevenue)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pelanggan Berulang
            </span>
            <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
              {stats.repeatCustomers}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
            <Award className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ----------------- MAIN CONTENT: LIST / GRID ----------------- */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-hidden flex flex-col">
        {filteredCustomers.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Tiada Rekod Pelanggan Ditemui
              </h3>
              <p className="text-xs text-slate-500">
                {searchQuery ? 'Tiada data sepadan dengan carian anda.' : 'Belum ada rekod pelanggan dalam pangkalan data.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-full bg-[#0052FF] text-white text-xs font-semibold hover:bg-blue-600 transition-colors shadow-2xs"
            >
              Daftar Pelanggan Pertama
            </button>
          </div>
        ) : viewMode === 'list' ? (
          /* ======================== CLEAN DATA TABLE (DEFAULT) ======================== */
          <div className="flex-1 overflow-auto sparkle-scroll">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50/80 dark:bg-zinc-800/80 sticky top-0 z-10 border-b border-slate-200/80 dark:border-zinc-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Jenis & Organisasi</th>
                  <th className="py-3 px-4 text-center">Pesanan</th>
                  <th className="py-3 px-4 text-right">Nilai Belanja (LTV)</th>
                  <th className="py-3 px-4">Lokasi</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {filteredCustomers.map((cust) => {
                  const initial = cust.full_name?.charAt(0)?.toUpperCase() || 'P';
                  const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');

                  return (
                    <tr
                      key={cust.id}
                      onClick={() => handleOpenDetail(cust)}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                    >
                      {/* Name & Contact */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-zinc-100 text-[13px] group-hover:text-[#00BDFF] transition-colors truncate">
                              {cust.full_name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                              {cleanPhone && (
                                <span className="font-mono">+{cleanPhone}</span>
                              )}
                              {cust.email && !cust.email.includes('@whatsapp.noreply') && (
                                <span className="truncate max-w-[150px]">• {cust.email}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type / Team */}
                      <td className="py-3 px-4">
                        {cust.isTeam ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900">
                              <Building2 className="w-2.5 h-2.5" />
                              Kelab / Pasukan
                            </span>
                            <p className="text-[11px] font-medium text-slate-800 dark:text-zinc-200 truncate">
                              {cust.company_or_team}
                            </p>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                            Individu
                          </span>
                        )}
                      </td>

                      {/* Total Orders */}
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                          {cust.computedOrdersCount} kali
                        </span>
                      </td>

                      {/* LTV */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-zinc-100 text-[13px]">
                        {formatCurrency(cust.computedSpent)}
                      </td>

                      {/* City */}
                      <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">
                        {cust.city || cust.address ? (
                          <span className="truncate max-w-[130px] block">
                            {cust.city || cust.address}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                              title="WhatsApp Pelanggan"
                            >
                              <FaWhatsapp className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={(e) => handleOpenEdit(cust, e)}
                            className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                            title="Kemaskini Pelanggan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={(e) => handleOpenDelete(cust, e)}
                            className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Padam Pelanggan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ======================== CLEAN GRID VIEW ======================== */
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 sparkle-scroll">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredCustomers.map((cust) => {
                const initial = cust.full_name?.charAt(0)?.toUpperCase() || 'P';
                const cleanPhone = (cust.phone || '').replace(/[^0-9]/g, '');

                return (
                  <div
                    key={cust.id}
                    onClick={() => handleOpenDetail(cust)}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-2xs hover:border-[#00BDFF]/50 transition-all cursor-pointer space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {initial}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                            {cust.full_name}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-mono">
                            {cleanPhone ? `+${cleanPhone}` : 'Tiada Telefon'}
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        Aktif
                      </span>
                    </div>

                    {cust.company_or_team && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-800 p-2 rounded-xl">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate font-medium">{cust.company_or_team}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800/80 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase">Pesanan</span>
                        <span className="font-bold text-slate-800 dark:text-zinc-200">{cust.computedOrdersCount} kali</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block uppercase">Nilai Belanja</span>
                        <span className="font-bold text-[#00BDFF]">{formatCurrency(cust.computedSpent)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* -------------------- CUSTOMER DETAIL DRAWER / MODAL --------------------- */}
      {/* ========================================================================= */}
      {isDetailDrawerOpen && currentSelectedMetrics && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 px-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#00BDFF]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Profil & Sejarah Pelanggan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailDrawerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 sparkle-scroll">
              {/* Profile Card Header */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/60 dark:border-zinc-700/60 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-sm">
                  {currentSelectedMetrics.full_name?.charAt(0)?.toUpperCase() || 'P'}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-slate-900 dark:text-zinc-100 truncate">
                    {currentSelectedMetrics.full_name}
                  </h4>
                  {currentSelectedMetrics.company_or_team && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">
                      {currentSelectedMetrics.company_or_team}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Pelanggan Aktif
                    </span>
                    {currentSelectedMetrics.company_or_team ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Kelab / Pasukan
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        Individu
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="grid grid-cols-3 gap-2">
                {currentSelectedMetrics.phone && (
                  <a
                    href={`https://wa.me/${currentSelectedMetrics.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                  >
                    <FaWhatsapp className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(currentSelectedMetrics)}
                  className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Kemaskini</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDelete(currentSelectedMetrics)}
                  className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Padam</span>
                </button>
              </div>

              {/* Contact Information Box */}
              <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 space-y-3">
                <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Maklumat Perhubungan & Alamat
                </h5>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-700 dark:text-zinc-300">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono">+{currentSelectedMetrics.phone}</span>
                  </div>
                  {currentSelectedMetrics.email && !currentSelectedMetrics.email.includes('@whatsapp.noreply') && (
                    <div className="flex items-center gap-2.5 text-slate-700 dark:text-zinc-300">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{currentSelectedMetrics.email}</span>
                    </div>
                  )}
                  {(currentSelectedMetrics.address || currentSelectedMetrics.city) && (
                    <div className="flex items-start gap-2.5 text-slate-700 dark:text-zinc-300">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        {[currentSelectedMetrics.address, currentSelectedMetrics.city, currentSelectedMetrics.postal_code].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {currentSelectedMetrics.notes && (
                    <div className="flex items-start gap-2.5 text-slate-600 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800">
                      <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="italic leading-relaxed">{currentSelectedMetrics.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Performance Stats Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Jumlah Pesanan
                  </span>
                  <span className="text-base font-extrabold text-slate-900 dark:text-zinc-100 mt-0.5 block">
                    {currentSelectedMetrics.computedOrdersCount} kali
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Jumlah Belanja (LTV)
                  </span>
                  <span className="text-base font-extrabold text-[#00BDFF] mt-0.5 block truncate">
                    {formatCurrency(currentSelectedMetrics.computedSpent)}
                  </span>
                </div>
              </div>

              {/* Matched Orders List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Rekod Pesanan ({currentSelectedMetrics.matchedOrders?.length || 0})
                  </h5>
                  <Link
                    href="/admin/orders"
                    className="text-[11px] font-semibold text-[#00BDFF] hover:underline"
                  >
                    Buka Saluran Pesanan →
                  </Link>
                </div>

                {!currentSelectedMetrics.matchedOrders || currentSelectedMetrics.matchedOrders.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 dark:bg-zinc-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                    Tiada rekod pesanan transaksi langsung untuk pelanggan ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {currentSelectedMetrics.matchedOrders.map((ord: Order) => (
                      <Link
                        key={ord.id}
                        href={`/admin/orders`}
                        className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 hover:border-[#00BDFF] transition-all flex items-center justify-between group shadow-2xs"
                      >
                        <div className="space-y-0.5 min-w-0 flex-1 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-zinc-100 group-hover:text-[#00BDFF]">
                              {ord.order_number}
                            </span>
                            <span className="text-[10px] px-2 py-0.2 rounded-full uppercase font-bold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300">
                              {ord.print_type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {ord.design_title || 'Tempahan Jersi'} • {ord.total_quantity} helai
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 block">
                            {formatCurrency(ord.total_amount)}
                          </span>
                          <span className={`text-[10px] font-semibold ${
                            ord.payment_status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                          }`}>
                            {ord.payment_status === 'paid' ? 'Lunas' : 'Deposit / Belum Lunas'}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- CREATE / EDIT CUSTOMER MODAL ----------------------- */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-[#00BDFF]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {formData.id ? 'Kemaskini Maklumat Pelanggan' : 'Daftar Pelanggan Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCustomer} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Nama Penuh Pelanggan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Contoh: Muhammad Shah"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    No. WhatsApp / Telefon <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 0123456789"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Alamat Emel
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Nama Kelab / Pasukan / Syarikat
                </label>
                <input
                  type="text"
                  value={formData.company_or_team}
                  onChange={(e) => setFormData({ ...formData, company_or_team: e.target.value })}
                  placeholder="Contoh: FC Harimau Shah Alam"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Bandar / Negeri
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Shah Alam, Selangor"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Poskod
                  </label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    placeholder="40000"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Catatan / Nota Khas
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Nota saiz khas, corak kegemaran, dsb..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30 resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {formSubmitting ? 'Menyimpan...' : formData.id ? 'Simpan Perubahan' : 'Daftar Pelanggan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- DELETE CONFIRMATION MODAL -------------------------- */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && customerToDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-sm overflow-hidden p-5 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                Padam Rekod Pelanggan?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Adakah anda pasti mahu memadam rekod <strong>{customerToDelete.full_name}</strong> dari pangkalan data? Tindakan ini tidak boleh diundur.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deleteSubmitting}
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteSubmitting}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                {deleteSubmitting ? 'Memadam...' : 'Ya, Padam Pelanggan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
