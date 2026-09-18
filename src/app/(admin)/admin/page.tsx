'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';
import { formatCurrency } from '@/lib/pricing-calculator';
import {
  TrendingUp,
  DollarSign,
  Layers,
  Package,
  Users,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Globe,
  Shirt
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { orders, designs, customers, fabrics } = useAppStore();

  // Metrics computation
  const totalRevenue = useMemo(() => {
    return orders.reduce((sum, ord) => sum + (ord.total_amount || 0), 0);
  }, [orders]);

  const sublimationOrders = useMemo(() => {
    return orders.filter((o) => o.print_type === 'sublimation');
  }, [orders]);

  const dtfOrders = useMemo(() => {
    return orders.filter((o) => o.print_type === 'dtf');
  }, [orders]);

  const totalApparelPieces = useMemo(() => {
    return orders.reduce((sum, ord) => sum + (ord.total_quantity || 0), 0);
  }, [orders]);

  const pendingProofCount = useMemo(() => {
    return orders.filter((o) => o.status === 'pending_proof').length;
  }, [orders]);

  const inProductionCount = useMemo(() => {
    return orders.filter((o) => ['proof_approved', 'in_printing', 'heat_press', 'sewing', 'qc_check'].includes(o.status)).length;
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Top Welcome & KPI Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Papan Pemuka Produksi
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052FF] border border-blue-200 text-xs font-semibold">
              Metrik Kilang Langsung
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Pemantauan masa nyata untuk pesanan Sublimasi Penuh dan Cetakan DTF.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/orders"
            className="px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs flex items-center space-x-1.5"
          >
            <span>Urus Pesanan</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/cms"
            className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all border border-slate-200 shadow-xs flex items-center space-x-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-[#0052FF]" />
            <span>Pengurus Web & Tema</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Jumlah Nilai Pesanan</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 font-mono block">
              {formatCurrency(totalRevenue)}
            </span>
            <div className="flex items-center space-x-1 text-emerald-600 text-xs mt-1 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Prestasi jualan aktif</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Apparel Output */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Helai Baju Ditempah</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0052FF] border border-blue-100 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 font-mono block">
              {totalApparelPieces} <span className="text-sm font-normal text-slate-500">helai</span>
            </span>
            <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
              <span>{sublimationOrders.length} Sublimasi</span>
              <span>•</span>
              <span>{dtfOrders.length} DTF</span>
            </div>
          </div>
        </div>

        {/* Card 3: Active Production Pipeline */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Dalam Proses Kilang</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 font-mono block">
              {inProductionCount} <span className="text-sm font-normal text-slate-500">kelompok</span>
            </span>
            <div className="flex items-center space-x-1 text-amber-600 text-xs mt-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Cetakan & jahitan sedang berjalan</span>
            </div>
          </div>
        </div>

        {/* Card 4: Proof Verification Queue */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Menunggu Kelulusan Proof</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900 font-mono block">
              {pendingProofCount} <span className="text-sm font-normal text-slate-500">pesanan</span>
            </span>
            <div className="text-xs text-slate-500 mt-1">
              Perlu semakan artwork & mockup
            </div>
          </div>
        </div>
      </div>

      {/* Production Technique Breakdown + Hardware Monitors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Production Workload & Recent Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workload Bars */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Nisbah Kaedah Cetakan</h3>
                <p className="text-xs text-slate-500">Perincian mengikut teknik cetakan pakaian</p>
              </div>
              <span className="text-xs font-mono text-slate-500 font-semibold">
                {orders.length} jumlah pesanan
              </span>
            </div>

            <div className="space-y-3">
              {/* Sublimation bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-[#0052FF] flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0052FF]" />
                    <span>Cetakan Sublimasi Penuh (Jersi & Kit Sukan)</span>
                  </span>
                  <span className="font-mono text-slate-700 font-bold">
                    {sublimationOrders.length} pesanan ({Math.round((sublimationOrders.length / (orders.length || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-[#0052FF] h-full rounded-full"
                    style={{
                      width: `${(sublimationOrders.length / (orders.length || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* DTF bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-semibold text-amber-600 flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Cetakan DTF Direct Transfer (Baju Kapas & Gang Sheets)</span>
                  </span>
                  <span className="font-mono text-slate-700 font-bold">
                    {dtfOrders.length} pesanan ({Math.round((dtfOrders.length / (orders.length || 1)) * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-amber-500 h-full rounded-full"
                    style={{
                      width: `${(dtfOrders.length / (orders.length || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Pesanan Terkini Masuk</h3>
                <p className="text-xs text-slate-500">Tiket tempahan dari Laman Awam Mobile</p>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-[#0052FF] hover:text-blue-700 flex items-center space-x-1"
              >
                <span>Lihat Semua Pesanan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="p-3 rounded-l-xl">No Pesanan</th>
                    <th className="p-3">Pelanggan / Pasukan</th>
                    <th className="p-3">Kaedah</th>
                    <th className="p-3">Kuantiti</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 rounded-r-xl text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {orders.slice(0, 5).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#0052FF]">
                        {ord.order_number}
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{ord.customer_name}</span>
                        <span className="text-[10px] text-slate-500 line-clamp-1">{ord.design_title}</span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            ord.print_type === 'sublimation'
                              ? 'bg-blue-50 text-[#0052FF] border border-blue-100'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {ord.print_type}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-slate-700">{ord.total_quantity} helai</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 capitalize">
                          {ord.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(ord.total_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Operational Status & Quick Actions */}
        <div className="space-y-6">
          {/* System & Catalog Health */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Status Operasi Sistem</span>
            </h3>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Katalog Mockup & Reka Bentuk
                  </span>
                  <span className="text-[10px] text-slate-500">{designs.length} rekaan aktif bersedia</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Aktif
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Pangkalan Data Pelanggan
                  </span>
                  <span className="text-[10px] text-slate-500">{customers.length} profil pelanggan berdaftar</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Diselaraskan
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Matriks Fabrik & Formula Harga
                  </span>
                  <span className="text-[10px] text-slate-500">{fabrics.length} jenis fabrik dikonfigurasi</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#0052FF] border border-blue-200">
                  Terkini
                </span>
              </div>
            </div>
          </div>

          {/* Quick System Shortlinks */}
          <div className="p-6 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0052FF] block">
              Pintasan Pengurusan Pantas
            </span>

            <div className="space-y-2">
              <Link
                href="/admin/cms"
                className="w-full p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors shadow-xs"
              >
                <span>Ubah Tema Warna & Banner</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/admin/catalog"
                className="w-full p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors shadow-xs"
              >
                <span>Muat Naik Mockup Katalog Baru</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/admin/pricing-rules"
                className="w-full p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors shadow-xs"
              >
                <span>Kemas Kini Kadar Fabrik & Diskaun</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                href="/admin/customers"
                className="w-full p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors shadow-xs"
              >
                <span>Lihat Senarai Pelanggan</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
