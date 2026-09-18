'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import { Customer } from '@/types/database';
import {
  Users,
  Search,
  Mail,
  Phone,
  MapPin,
  Award,
  Package,
  Plus,
  ExternalLink,
  LayoutGrid,
  List
} from 'lucide-react';

export default function AdminCustomersPage() {
  const { customers, orders } = useAppStore();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.full_name.toLowerCase().includes(q);
      const matchEmail = c.email.toLowerCase().includes(q);
      const matchTeam = (c.company_or_team || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchTeam) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Direktori & Akaun Pelanggan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Senarai pasukan sukan, kelab bola sepak, pelanggan korporat dan persatuan berdaftar.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            {customers.length} Akaun Berdaftar
          </span>
        </div>
      </div>

      {/* Toolbar & View Switcher */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pelanggan, emel, atau nama pasukan/kelab..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052FF]/30 focus:border-[#0052FF]"
          />
        </div>

        {/* List vs Grid Switcher */}
        <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-[#0052FF] shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Paparan Grid Kad"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'list'
                ? 'bg-white text-[#0052FF] shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Paparan Jadual / Senarai"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline text-[11px]">Jadual</span>
          </button>
        </div>
      </div>

      {/* Main Content Area: Grid Cards vs List Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const customerOrders = orders.filter(
              (o) => o.customer_email === cust.email || o.customer_name === cust.full_name
            );
            const computedSpent = customerOrders.reduce((sum, o) => sum + o.total_amount, cust.total_spent);

            return (
              <div
                key={cust.id}
                className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between hover:border-slate-300 transition-all"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0052FF] border border-blue-100 flex items-center justify-center font-bold text-base shadow-xs">
                        {cust.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {cust.full_name}
                        </h3>
                        <span className="text-xs text-[#0052FF] font-semibold block">
                          {cust.company_or_team || 'Pelanggan Bebas'}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      VIP Aktif
                    </span>
                  </div>

                  {/* Contact Meta */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-mono text-slate-700">{cust.phone}</span>
                    </div>
                    {cust.city && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{cust.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Financial Metrics Box */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Jumlah Pesanan
                    </span>
                    <span className="text-sm font-bold text-slate-900 font-mono">
                      {Math.max(cust.total_orders, customerOrders.length)} tempahan
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Nilai Tempahan
                    </span>
                    <span className="text-sm font-bold text-emerald-700 font-mono">
                      {formatCurrency(computedSpent)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Data Table View */
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Nama & Pasukan</th>
                  <th className="p-3.5">Emel & Hubungan</th>
                  <th className="p-3.5">No. Telefon</th>
                  <th className="p-3.5">Bandar / Lokasi</th>
                  <th className="p-3.5 text-center">Jumlah Tempahan</th>
                  <th className="p-3.5 text-right">Nilai Dibelanjakan</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((cust) => {
                    const customerOrders = orders.filter(
                      (o) => o.customer_email === cust.email || o.customer_name === cust.full_name
                    );
                    const computedSpent = customerOrders.reduce((sum, o) => sum + o.total_amount, cust.total_spent);

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052FF] border border-blue-100 flex items-center justify-center font-bold text-xs shrink-0">
                              {cust.full_name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{cust.full_name}</span>
                              <span className="text-[11px] text-[#0052FF] font-semibold block">
                                {cust.company_or_team || 'Pelanggan Bebas'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          <span className="font-mono">{cust.email}</span>
                        </td>
                        <td className="p-3.5 text-slate-700 font-mono">
                          {cust.phone}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {cust.city || '—'}
                        </td>
                        <td className="p-3.5 text-center font-mono font-bold text-slate-900">
                          {Math.max(cust.total_orders, customerOrders.length)}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                          {formatCurrency(computedSpent)}
                        </td>
                        <td className="p-3.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            VIP Aktif
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      Tiada akaun pelanggan sepadan dengan carian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

