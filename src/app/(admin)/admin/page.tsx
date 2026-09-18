'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import {
  Plus,
  ClipboardList,
  Shirt,
  Globe,
  Users,
  ChevronRight,
  TrendingUp,
  Package,
  Layers,
  CheckCircle2
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { orders, designs, customers, fabrics } = useAppStore();

  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, ord) => sum + (ord.total_amount || 0), 0);
  }, [orders]);

  const totalApparelPieces = useMemo(() => {
    return orders.reduce((sum, ord) => sum + (ord.total_quantity || 0), 0);
  }, [orders]);

  const inProductionCount = useMemo(() => {
    return orders.filter((o) =>
      ['proof_approved', 'in_printing', 'heat_press', 'sewing', 'qc_check'].includes(o.status)
    ).length;
  }, [orders]);

  return (
    <div className="space-y-8 select-none">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-slate-800 tracking-normal">
            Beranda Pentadbir
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ringkasan status pengeluaran dan aktiviti kilang terkini.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/catalog"
            className="px-4 py-2 rounded-full bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rekaan</span>
          </Link>
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 flex items-center gap-1.5 transition-all shadow-xs"
          >
            <ClipboardList className="w-4 h-4 text-[#0052FF]" />
            <span>Semak Pesanan</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Nilai Pesanan */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-medium text-slate-500 block">Jumlah Nilai Pesanan</span>
          <span className="text-2xl font-bold text-slate-900 font-mono block">
            {formatCurrency(totalRevenue)}
          </span>
          <span className="text-xs text-slate-500 block">{orders.length} tempahan direkodkan</span>
        </div>

        {/* Helai Baju */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-medium text-slate-500 block">Jumlah Kuantiti Pakaian</span>
          <span className="text-2xl font-bold text-slate-900 font-mono block">
            {totalApparelPieces} <span className="text-sm font-normal text-slate-500">helai</span>
          </span>
          <span className="text-xs text-slate-500 block">Sublimasi penuh & DTF</span>
        </div>

        {/* Dalam Produksi */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-medium text-slate-500 block">Dalam Barisan Produksi</span>
          <span className="text-2xl font-bold text-[#0052FF] font-mono block">
            {inProductionCount} <span className="text-sm font-normal text-slate-500">pesanan</span>
          </span>
          <span className="text-xs text-slate-500 block">Sedang dicetak, ditekan & dijahit</span>
        </div>

        {/* Katalog Rekaan */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-medium text-slate-500 block">Templat Katalog Aktif</span>
          <span className="text-2xl font-bold text-slate-900 font-mono block">
            {designs.length} <span className="text-sm font-normal text-slate-500">mockup</span>
          </span>
          <span className="text-xs text-slate-500 block">{customers.length} akaun pelanggan berdaftar</span>
        </div>
      </div>

      {/* Main Sections: Recent Orders & Quick Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-medium text-slate-800">
              Pesanan Terkini
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-[#0052FF] hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 text-[11px] font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">No. Pesanan</th>
                  <th className="py-3 px-4">Pelanggan & Rekaan</th>
                  <th className="py-3 px-4">Teknik</th>
                  <th className="py-3 px-4">Kuantiti</th>
                  <th className="py-3 px-4 text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 5).map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-[#0052FF]">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{ord.customer_name}</span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-xs">{ord.design_title}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="uppercase text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                        {ord.print_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      {ord.total_quantity} helai
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900">
                      {formatCurrency(ord.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Module Links (1 Col) */}
        <div className="rounded-2xl bg-white border border-slate-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h2 className="text-base font-medium text-slate-800">
              Pintasan Modul
            </h2>

            <div className="space-y-1.5">
              <Link
                href="/admin/cms"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0052FF] flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Pengurusan Web CMS</span>
                    <span className="text-[11px] text-slate-400 block">Banner, servis, video, testimoni</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/admin/catalog"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Shirt className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Katalog & Mockup</span>
                    <span className="text-[11px] text-slate-400 block">Muat naik fail gambar rekaan</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/admin/customers"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">Direktori Pelanggan</span>
                    <span className="text-[11px] text-slate-400 block">Maklumat pasukan & kelab</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-600">Pangkalan Data</span>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Diselaraskan
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

