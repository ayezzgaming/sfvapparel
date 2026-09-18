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
  ExternalLink
} from 'lucide-react';

export default function AdminCustomersPage() {
  const { customers, orders } = useAppStore();
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

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
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
      </div>

      {/* Customer Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => {
          // Calculate active orders for this customer if any
          const customerOrders = orders.filter(
            (o) => o.customer_email === cust.email || o.customer_name === cust.full_name
          );
          const computedSpent = customerOrders.reduce((sum, o) => sum + o.total_amount, cust.total_spent);

          return (
            <div
              key={cust.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between"
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
    </div>
  );
}
