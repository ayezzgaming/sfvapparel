'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  Layers,
  Sparkles,
  RefreshCw,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  CreditCard,
  Building2,
  Users,
  AlertCircle,
  FileSpreadsheet,
  PieChart,
  Megaphone,
  Briefcase
} from 'lucide-react';
import { getFinancialSummary } from '@/app/actions/financeActions';
import { PnlSummary } from '@/types/database';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export default function AdminFinanceOverviewPage() {
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'this_year' | 'all'>('this_month');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pnl, setPnl] = useState<PnlSummary>({
    gross_revenue: 0,
    total_cogs: 0,
    gross_profit: 0,
    gross_margin_percent: 0,
    total_ads_spend: 0,
    total_opex: 0,
    net_profit: 0,
    net_margin_percent: 0,
    total_orders_count: 0,
    total_units_sold: 0,
    avg_profit_per_unit: 0,
  });

  // Calculate start & end date based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    if (period === 'this_month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
      return { start, end, label: `Bulan Ini (${now.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })})` };
    }
    if (period === 'last_month') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { start, end, label: `Bulan Lepas (${lastMonthDate.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })})` };
    }
    if (period === 'this_year') {
      const start = new Date(now.getFullYear(), 0, 1).toISOString();
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59).toISOString();
      return { start, end, label: `Tahun ${now.getFullYear()}` };
    }
    return { start: undefined, end: undefined, label: 'Semua Rekod' };
  }, [period]);

  const loadPnl = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getFinancialSummary(dateRange.start, dateRange.end);
      if (res.success && res.data) {
        setPnl(res.data);
      }
    } catch (err) {
      console.error('Error fetching P&L summary:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPnl();
  }, [dateRange.start, dateRange.end]);

  // Derived calculations
  const adsSpendRatio = pnl.gross_revenue > 0 ? (pnl.total_ads_spend / pnl.gross_revenue) * 100 : 0;
  const opexRatio = pnl.gross_revenue > 0 ? (pnl.total_opex / pnl.gross_revenue) * 100 : 0;
  const cogsRatio = pnl.gross_revenue > 0 ? (pnl.total_cogs / pnl.gross_revenue) * 100 : 0;

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Penyata Pendapatan & Untung Rugi (P&L)</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
              Model Agensi Sublimasi
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Analisis kewangan masa-nyata: Pengasingan kos kilang pukal (COGS), kos iklan berkala, dan keuntungan bersih.
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-2">
          <div className="bg-white border border-gray-200 rounded-xl p-1 flex items-center shadow-sm text-xs font-medium">
            <button
              onClick={() => setPeriod('this_month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'this_month' ? 'bg-[#00BDFF] text-white font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              onClick={() => setPeriod('last_month')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'last_month' ? 'bg-[#00BDFF] text-white font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Bulan Lepas
            </button>
            <button
              onClick={() => setPeriod('this_year')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'this_year' ? 'bg-[#00BDFF] text-white font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tahun {new Date().getFullYear()}
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === 'all' ? 'bg-[#00BDFF] text-white font-semibold shadow-sm' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Semua
            </button>
          </div>

          <button
            onClick={() => loadPnl(true)}
            disabled={refreshing || loading}
            title="Muat semula data"
            className="p-2 text-gray-500 hover:text-[#00BDFF] hover:bg-sky-50 rounded-xl border border-gray-200 transition-colors bg-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00BDFF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Top Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Revenue */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm relative overflow-hidden group hover:border-[#00BDFF]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Hasil Jualan Kasar</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#00BDFF] flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              {loading ? '...' : formatCurrency(pnl.gross_revenue)}
            </h3>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span>{pnl.total_orders_count} pesanan disahkan</span>
              <span>•</span>
              <span>{pnl.total_units_sold} helai jersi</span>
            </p>
          </div>
        </div>

        {/* COGS (Factory Cost) */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm relative overflow-hidden group hover:border-amber-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Kos Kilang Sublimasi (COGS)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
              {loading ? '...' : formatCurrency(pnl.total_cogs)}
            </h3>
            <p className="text-xs text-amber-700 font-medium mt-1">
              {pnl.gross_revenue > 0 ? `${cogsRatio.toFixed(1)}% daripada jualan kasar` : '0%'}
            </p>
          </div>
        </div>

        {/* Gross Profit & Margin */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-400/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Untung Kasar (Gross Profit)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-emerald-600 tracking-tight">
              {loading ? '...' : formatCurrency(pnl.gross_profit)}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="inline-flex items-center text-xs font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {pnl.gross_margin_percent}% Margin
              </span>
              <span className="text-[11px] text-gray-400">(Sebelum Iklan & OPEX)</span>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-gradient-to-br from-gray-900 to-slate-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-3 -translate-y-3 opacity-10">
            <TrendingUp className="w-32 h-32 text-white" />
          </div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Untung Bersih Sebenar</span>
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 relative z-10">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {loading ? '...' : formatCurrency(pnl.net_profit)}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {pnl.net_margin_percent}% Net Margin
              </span>
              <span className="text-xs text-slate-300">
                {formatCurrency(pnl.avg_profit_per_unit)} / helai
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Breakdown Waterfall Section */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-gray-900">Pecahan Aliran & Kos Kewangan ({dateRange.label})</h2>
            <p className="text-xs text-gray-500 mt-0.5">Struktur pecahan pendapatan dari pesanan pelanggan hingga keuntungan bersih agensi.</p>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Untung Kasar</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500"></span> Kos Kilang (COGS)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> Kos Iklan (Ads)</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-purple-500"></span> OPEX Umum</span>
          </div>
        </div>

        {/* Visual Progress Bar Ratio */}
        <div className="w-full bg-gray-100 h-4 rounded-full overflow-hidden flex mb-6 shadow-inner">
          <div
            style={{ width: `${Math.min(100, Math.max(0, cogsRatio))}%` }}
            className="bg-amber-500 h-full transition-all"
            title={`Kos Kilang: ${cogsRatio.toFixed(1)}%`}
          />
          <div
            style={{ width: `${Math.min(100, Math.max(0, adsSpendRatio))}%` }}
            className="bg-rose-500 h-full transition-all"
            title={`Iklan: ${adsSpendRatio.toFixed(1)}%`}
          />
          <div
            style={{ width: `${Math.min(100, Math.max(0, opexRatio))}%` }}
            className="bg-purple-500 h-full transition-all"
            title={`OPEX: ${opexRatio.toFixed(1)}%`}
          />
          <div
            style={{ width: `${Math.min(100, Math.max(0, pnl.net_margin_percent))}%` }}
            className="bg-emerald-500 h-full transition-all"
            title={`Untung Bersih: ${pnl.net_margin_percent.toFixed(1)}%`}
          />
        </div>

        {/* Detailed Waterfall Rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {/* Revenue Line */}
            <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#00BDFF] flex items-center justify-center font-bold text-xs">
                  1
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Jumlah Hasil Jualan Kasar</h4>
                  <p className="text-xs text-gray-500">Inflow daripada deposit & baki pesanan pelanggan</p>
                </div>
              </div>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(pnl.gross_revenue)}</span>
            </div>

            {/* Sublimation COGS Line */}
            <div className="flex items-center justify-between p-3.5 bg-amber-50/50 rounded-xl border border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xs">
                  -
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Tolak: Kos Kilang Sublimasi (COGS)</h4>
                  <p className="text-xs text-amber-700">Kuantiti × Kadar Cetak + Jahit All-in-one</p>
                </div>
              </div>
              <span className="text-sm font-bold text-amber-700">- {formatCurrency(pnl.total_cogs)}</span>
            </div>

            {/* Gross Profit Line */}
            <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                  =
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-900">Untung Kasar Agensi (Gross Profit)</h4>
                  <p className="text-xs text-emerald-700">Margin Kasar: {pnl.gross_margin_percent}%</p>
                </div>
              </div>
              <span className="text-sm font-bold text-emerald-700">{formatCurrency(pnl.gross_profit)}</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Ads Spend Line */}
            <div className="flex items-center justify-between p-3.5 bg-rose-50/50 rounded-xl border border-rose-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                  -
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold text-rose-900">Tolak: Kos Iklan Berkala (Ads Spend)</h4>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-semibold">
                      Meta • Google • TikTok
                    </span>
                  </div>
                  <p className="text-xs text-rose-700">Perbelanjaan pemasaran global (bukan per pesanan tunggal)</p>
                </div>
              </div>
              <span className="text-sm font-bold text-rose-700">- {formatCurrency(pnl.total_ads_spend)}</span>
            </div>

            {/* General OPEX Line */}
            <div className="flex items-center justify-between p-3.5 bg-purple-50/50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                  -
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-purple-900">Tolak: Overhed Operasi (General OPEX)</h4>
                  <p className="text-xs text-purple-700">Gaji, utiliti, sewa, langganan perisian dll.</p>
                </div>
              </div>
              <span className="text-sm font-bold text-purple-700">- {formatCurrency(pnl.total_opex)}</span>
            </div>

            {/* Final Net Profit Line */}
            <div className="flex items-center justify-between p-3.5 bg-slate-900 text-white rounded-xl border border-slate-800 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                  =
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Untung Bersih Sebenar (Net Profit)</h4>
                  <p className="text-xs text-slate-300">Untung bersih agensi selepas semua kos & overhed</p>
                </div>
              </div>
              <span className="text-base font-extrabold text-emerald-400">{formatCurrency(pnl.net_profit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards to Submodules */}
      <div>
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Modul Pengurusan Kewangan SVF</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Lejar Transaksi */}
          <Link
            href="/admin/finance/transactions"
            className="group p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-[#00BDFF] hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CreditCard className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-[#00BDFF] transition-colors">Lejar Transaksi</h3>
              <p className="text-xs text-gray-500 mt-1">
                Rekod semua aliran wang masuk (inflows) dan aliran keluar kos operasi/iklan (outflows).
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-[#00BDFF] mt-4 pt-3 border-t border-gray-100">
              <span>Buka Lejar</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 2. Kutipan Baki (A/R) */}
          <Link
            href="/admin/finance/receivables"
            className="group p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">Kutipan Baki Pelanggan (A/R)</h3>
              <p className="text-xs text-gray-500 mt-1">
                Pantau pesanan belum selesai bayaran penuh dengan 1-klik peringatan WhatsApp.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-4 pt-3 border-t border-gray-100">
              <span>Pantau Kutipan Baki</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 3. Bayaran Kilang (A/P) */}
          <Link
            href="/admin/finance/payables"
            className="group p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-amber-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-amber-600 transition-colors">Bayaran Kilang (A/P)</h3>
              <p className="text-xs text-gray-500 mt-1">
                Invois kos sublimasi kilang yang belum diselesaikan dan tandakan pembayaran.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 mt-4 pt-3 border-t border-gray-100">
              <span>Lihat Invois Kilang</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* 4. Laporan & Eksport */}
          <Link
            href="/admin/finance/reports"
            className="group p-5 bg-white rounded-2xl border border-gray-200 shadow-sm hover:border-purple-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">Laporan & Eksport</h3>
              <p className="text-xs text-gray-500 mt-1">
                Eksport penyata bulanan P&L format Excel/CSV untuk audit dan percetakan rasmi.
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-purple-600 mt-4 pt-3 border-t border-gray-100">
              <span>Jana Laporan CSV</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
