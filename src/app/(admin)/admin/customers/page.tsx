'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import { Customer, Order } from '@/types/database';
import {
  Search,
  Mail,
  Phone,
  MapPin,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Users,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Building2,
  UserCheck,
  Award,
  Calendar,
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import Link from 'next/link';

export default function AdminCustomersPage() {
  const { customers, orders } = useAppStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'individual' | 'organization'>('all');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Compute metrics per customer
  const customerMetrics = useMemo(() => {
    return customers.map((cust) => {
      const custOrders = orders.filter(
        (o) =>
          (o.customer_email && cust.email && o.customer_email.toLowerCase() === cust.email.toLowerCase()) ||
          (o.customer_name && cust.full_name && o.customer_name.toLowerCase() === cust.full_name.toLowerCase()) ||
          (o.customer_phone && cust.phone && o.customer_phone.replace(/\D/g, '') === cust.phone.replace(/\D/g, ''))
      );
      const computedSpent = custOrders.reduce((sum, o) => sum + (o.total_amount || 0), cust.total_spent || 0);
      const computedOrdersCount = Math.max(cust.total_orders || 0, custOrders.length);
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

  // Overall summary statistics
  const stats = useMemo(() => {
    const totalCount = customerMetrics.length;
    const totalRevenue = customerMetrics.reduce((sum, c) => sum + c.computedSpent, 0);
    const totalOrderCount = customerMetrics.reduce((sum, c) => sum + c.computedOrdersCount, 0);
    const avgSpend = totalCount > 0 ? totalRevenue / totalCount : 0;
    const repeatCustomers = customerMetrics.filter((c) => c.computedOrdersCount > 1).length;
    const teamCount = customerMetrics.filter((c) => c.isTeam).length;

    return {
      totalCount,
      totalRevenue,
      totalOrderCount,
      avgSpend,
      repeatCustomers,
      teamCount,
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

  return (
    <div className="w-full h-full overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950 flex flex-col p-4 gap-3 text-slate-900 dark:text-zinc-100 font-sans select-none">
      
      {/* ----------------- TOP TOOLBAR BAR ----------------- */}
      <div className="shrink-0 flex items-center justify-between gap-3 min-h-[38px]">
        {/* Title & Filter Tabs */}
        <div className="flex items-center space-x-3">
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
              { id: 'all', label: `Semua (${customerMetrics.length})` },
              { id: 'organization', label: `Kelab & Pasukan (${stats.teamCount})` },
              { id: 'individual', label: `Individu (${customerMetrics.length - stats.teamCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#00BDFF] text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-[#00BDFF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search & View Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, emel, kelab..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/40 focus:border-[#00BDFF] transition-all shadow-2xs"
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
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-zinc-900 text-[#00BDFF] shadow-xs'
                  : 'text-slate-500 hover:text-[#00BDFF]'
              }`}
              title="Paparan Grid"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-zinc-900 text-[#00BDFF] shadow-xs'
                  : 'text-slate-500 hover:text-[#00BDFF]'
              }`}
              title="Paparan Jadual"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ----------------- 1 MAIN CARD (SPLIT LAYOUT) ----------------- */}
      <div className="flex-1 min-h-0 flex overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs relative">
        
        {/* LEFT PANEL: Statistics & Highlights (Collapsible) */}
        <div
          className={`shrink-0 transition-all duration-300 ease-in-out border-r border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full overflow-hidden ${
            isLeftPanelCollapsed ? 'w-0 border-r-0 overflow-hidden' : 'w-72 sm:w-80 md:w-88'
          }`}
        >
          {/* Header Panel Kiri */}
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-800/50">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-[#00BDFF]" />
              <h2 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
                Ringkasan Pelanggan
              </h2>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
              Keluaran Terkini
            </span>
          </div>

          {/* Body Panel Kiri */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Jumlah Pelanggan
                </span>
                <span className="text-lg font-extrabold text-slate-900 dark:text-zinc-100 mt-0.5 block">
                  {stats.totalCount}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5 mt-0.5">
                  <UserCheck className="w-3 h-3" /> 100% Aktif
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Kelab / Pasukan
                </span>
                <span className="text-lg font-extrabold text-[#00BDFF] mt-0.5 block">
                  {stats.teamCount}
                </span>
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5 mt-0.5">
                  <Building2 className="w-3 h-3" /> Tempahan Pukal
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Nilai Belanja (LTV)
                </span>
                <span className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 mt-0.5 block truncate">
                  {formatCurrency(stats.totalRevenue)}
                </span>
                <span className="text-[10px] text-sky-600 font-medium flex items-center gap-0.5 mt-0.5">
                  <DollarSign className="w-3 h-3" /> Terkumpul
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Pelanggan Berulang
                </span>
                <span className="text-lg font-extrabold text-emerald-600 mt-0.5 block">
                  {stats.repeatCustomers}
                </span>
                <span className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5 mt-0.5">
                  <Award className="w-3 h-3" /> Loyaliti
                </span>
              </div>
            </div>

            {/* Selected Customer Quick Card Detail if clicked */}
            {selectedCustomer ? (
              <div className="bg-sky-50/60 dark:bg-sky-950/40 p-4 rounded-2xl border border-sky-200/80 dark:border-sky-900 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#00BDFF]">
                    Profil Terpilih
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-[#00BDFF] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                    {selectedCustomer.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                      {selectedCustomer.full_name}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate">
                      {selectedCustomer.company_or_team || 'Pelanggan Individu'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-400 pt-1 border-t border-sky-200/60 dark:border-sky-900/60">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-700 dark:text-zinc-300">{selectedCustomer.phone}</span>
                  </div>
                  {selectedCustomer.city && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedCustomer.city}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <Link
                    href={`/admin/orders?search=${encodeURIComponent(selectedCustomer.full_name)}`}
                    className="w-full py-2 px-3 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Lihat Rekod Pesanan</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-center">
                <Users className="w-6 h-6 text-slate-300 dark:text-zinc-600 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">
                  Pilih Pelanggan
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik mana-mana kad atau baris untuk paparan ringkasan pantas.
                </p>
              </div>
            )}

            {/* Quick Segment Filter Pill Links */}
            <div className="pt-2 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                Kategori Pantas
              </span>
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>Semua Direktori</span>
                <span className="text-[10px]">{customerMetrics.length}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('organization')}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  filterType === 'organization'
                    ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>Kelab Sukan / Korporat</span>
                <span className="text-[10px]">{stats.teamCount}</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('individual')}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  filterType === 'individual'
                    ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span>Tempahan Individu</span>
                <span className="text-[10px]">{customerMetrics.length - stats.teamCount}</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Customer Grid or Data Table */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-slate-50/40 dark:bg-zinc-900/40 relative">
          
          {/* FLOATING CAPSULE TOGGLE HANDLE (LEFT EDGE OF RIGHT PANEL) */}
          <button
            type="button"
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 bg-white dark:bg-zinc-800 border-y border-r border-slate-200 dark:border-zinc-700 rounded-r-full shadow-md flex items-center justify-center text-slate-500 hover:text-[#00BDFF] dark:hover:text-[#00BDFF] transition-all cursor-pointer"
            title={isLeftPanelCollapsed ? 'Buka Panel Statistik' : 'Tutup Panel Statistik'}
            aria-label="Toggle Left Panel"
          >
            {isLeftPanelCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Content Area with Internal Scrolling */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredCustomers.map((cust) => {
                  const isSelected = selectedCustomer?.id === cust.id;

                  return (
                    <div
                      key={cust.id}
                      onClick={() => setSelectedCustomer(cust)}
                      className={`p-4 rounded-2xl bg-white dark:bg-zinc-900 border transition-all cursor-pointer flex flex-col justify-between space-y-3.5 hover:shadow-md ${
                        isSelected
                          ? 'border-[#00BDFF] ring-2 ring-[#00BDFF]/20 shadow-xs'
                          : 'border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Top Info */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-[#C2E7FF] dark:bg-sky-950 text-[#001D35] dark:text-[#00BDFF] flex items-center justify-center font-bold text-xs shrink-0">
                              {cust.full_name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">
                                {cust.full_name}
                              </h3>
                              <span className="text-[11px] text-slate-500 truncate block">
                                {cust.company_or_team || 'Pelanggan Individu'}
                              </span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 shrink-0">
                            Aktif
                          </span>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1 text-xs text-slate-600 dark:text-zinc-400 pt-0.5">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{cust.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-mono text-slate-700 dark:text-zinc-300">{cust.phone}</span>
                          </div>
                          {cust.city && (
                            <div className="flex items-center space-x-2">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{cust.city}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Metrics Footer */}
                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-2 gap-2 bg-slate-50/70 dark:bg-zinc-800/40 p-2.5 rounded-xl">
                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                            Pesanan
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 font-mono">
                            {cust.computedOrdersCount} kali
                          </span>
                        </div>

                        <div>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                            Nilai Tempahan
                          </span>
                          <span className="text-xs font-bold text-[#00BDFF] font-mono">
                            {formatCurrency(cust.computedSpent)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Data Table View */
              <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/80 dark:bg-zinc-800/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-zinc-700">
                      <tr>
                        <th className="py-3 px-4">Nama & Organisasi</th>
                        <th className="py-3 px-4">Emel</th>
                        <th className="py-3 px-4">No. Telefon</th>
                        <th className="py-3 px-4">Lokasi</th>
                        <th className="py-3 px-4 text-center">Pesanan</th>
                        <th className="py-3 px-4 text-right">Nilai Belanja</th>
                        <th className="py-3 px-4 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-normal">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((cust) => {
                          const isSelected = selectedCustomer?.id === cust.id;

                          return (
                            <tr
                              key={cust.id}
                              onClick={() => setSelectedCustomer(cust)}
                              className={`transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-sky-50/60 dark:bg-sky-950/30'
                                  : 'hover:bg-slate-50/60 dark:hover:bg-zinc-800/40'
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-7 h-7 rounded-full bg-[#C2E7FF] dark:bg-sky-950 text-[#001D35] dark:text-[#00BDFF] flex items-center justify-center font-bold text-xs shrink-0">
                                    {cust.full_name.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span className="font-bold text-slate-800 dark:text-zinc-100 block">
                                      {cust.full_name}
                                    </span>
                                    <span className="text-[11px] text-slate-500 block">
                                      {cust.company_or_team || 'Pelanggan Individu'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-zinc-400 font-mono">
                                {cust.email}
                              </td>
                              <td className="py-3 px-4 text-slate-700 dark:text-zinc-300 font-mono">
                                {cust.phone}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">
                                {cust.city || '—'}
                              </td>
                              <td className="py-3 px-4 text-center font-mono font-bold text-slate-800 dark:text-zinc-100">
                                {cust.computedOrdersCount}
                              </td>
                              <td className="py-3 px-4 text-right font-mono font-bold text-[#00BDFF]">
                                {formatCurrency(cust.computedSpent)}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <Link
                                  href={`/admin/orders?search=${encodeURIComponent(cust.full_name)}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00BDFF] hover:underline"
                                >
                                  <span>Pesanan</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            Tiada rekod pelanggan dijumpai.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
