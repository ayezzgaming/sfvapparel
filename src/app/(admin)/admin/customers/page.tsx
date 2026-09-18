'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import {
  Search,
  Mail,
  Phone,
  MapPin,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-slate-800 tracking-tight">
            Pelanggan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Direktori profil pelanggan, pasukan sukan, dan sejarah pembelian
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-600 bg-white border border-slate-200 px-3.5 py-1.5 rounded-full font-medium shadow-xs">
            {customers.length} Pelanggan
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, emel, atau kelab..."
            className="w-full pl-9 pr-4 py-2 rounded-full bg-slate-50 hover:bg-slate-100/70 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20 focus:border-[#0B57D0] transition-all"
          />
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-full transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-[#0B57D0] shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Paparan Grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-full transition-all ${
              viewMode === 'list'
                ? 'bg-white text-[#0B57D0] shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Paparan Jadual"
          >
            <List className="w-4 h-4" />
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
                  {/* Top Info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#C2E7FF] text-[#001D35] flex items-center justify-center font-medium text-sm">
                        {cust.full_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-slate-800 leading-tight">
                          {cust.full_name}
                        </h3>
                        <span className="text-xs text-slate-500 block">
                          {cust.company_or_team || 'Pelanggan Individu'}
                        </span>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Aktif
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{cust.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono text-slate-700">{cust.phone}</span>
                    </div>
                    {cust.city && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{cust.city}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">
                      Pesanan
                    </span>
                    <span className="text-sm font-medium text-slate-800 font-mono">
                      {Math.max(cust.total_orders, customerOrders.length)} kali
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">
                      Nilai Tempahan
                    </span>
                    <span className="text-sm font-medium text-[#0B57D0] font-mono">
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
              <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-medium tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama & Organisasi</th>
                  <th className="py-3 px-4">Emel</th>
                  <th className="py-3 px-4">No. Telefon</th>
                  <th className="py-3 px-4">Lokasi</th>
                  <th className="py-3 px-4 text-center">Jumlah Pesanan</th>
                  <th className="py-3 px-4 text-right">Nilai Belanja</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((cust) => {
                    const customerOrders = orders.filter(
                      (o) => o.customer_email === cust.email || o.customer_name === cust.full_name
                    );
                    const computedSpent = customerOrders.reduce((sum, o) => sum + o.total_amount, cust.total_spent);

                    return (
                      <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#C2E7FF] text-[#001D35] flex items-center justify-center font-medium text-xs shrink-0">
                              {cust.full_name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium text-slate-800 block">{cust.full_name}</span>
                              <span className="text-[11px] text-slate-500 block">
                                {cust.company_or_team || 'Pelanggan Individu'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 font-mono">
                          {cust.email}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700 font-mono">
                          {cust.phone}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {cust.city || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-800">
                          {Math.max(cust.total_orders, customerOrders.length)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-medium text-[#0B57D0]">
                          {formatCurrency(computedSpent)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Aktif
                          </span>
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
  );
}
