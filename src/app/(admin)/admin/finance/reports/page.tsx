'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  Printer,
  RefreshCw,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  Percent,
  DollarSign,
  Building2,
  Megaphone,
  Briefcase,
  ChevronRight
} from 'lucide-react';
import { getFinancialSummary, getOperatingExpenses, getFinancialTransactions } from '@/app/actions/financeActions';
import { PnlSummary, OperatingExpense, FinancialTransaction } from '@/types/database';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export default function AdminFinanceReportsPage() {
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
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
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);

  // Compute date filter
  const dateRange = useMemo(() => {
    if (selectedMonth === 'all') {
      const start = new Date(selectedYear, 0, 1).toISOString();
      const end = new Date(selectedYear, 11, 31, 23, 59, 59).toISOString();
      return { start, end, label: `Sepanjang Tahun ${selectedYear}` };
    }
    const monthNum = parseInt(selectedMonth, 10);
    const start = new Date(selectedYear, monthNum, 1).toISOString();
    const end = new Date(selectedYear, monthNum + 1, 0, 23, 59, 59).toISOString();
    const dateObj = new Date(selectedYear, monthNum, 1);
    return {
      start,
      end,
      label: `${dateObj.toLocaleString('ms-MY', { month: 'long' })} ${selectedYear}`,
    };
  }, [selectedYear, selectedMonth]);

  const loadReportData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [pnlRes, expRes] = await Promise.all([
        getFinancialSummary(dateRange.start, dateRange.end),
        getOperatingExpenses(),
      ]);

      if (pnlRes.success && pnlRes.data) setPnl(pnlRes.data);
      if (expRes.success) setExpenses(expRes.data || []);
    } catch (err) {
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [dateRange.start, dateRange.end]);

  // Export to CSV
  const handleExportCsv = () => {
    const rows = [
      ['PENYATA PENDAPATAN & UNTUNG RUGI (P&L) - SVF APPAREL'],
      [`Tempoh: ${dateRange.label}`],
      [`Tarikh Dijana: ${new Date().toLocaleString('ms-MY')}`],
      [''],
      ['KATEGORI', 'PENERANGAN', 'JUMLAH (MYR)'],
      ['Hasil Jualan Kasar', 'Inflow Jualan Pesanan Pelanggan', pnl.gross_revenue.toFixed(2)],
      ['Kos Kilang Sublimasi (COGS)', 'Kos Cetak + Jahit All-in-one Kilang', (-pnl.total_cogs).toFixed(2)],
      ['UNTUNG KASAR (GROSS PROFIT)', `Margin Kasar: ${pnl.gross_margin_percent}%`, pnl.gross_profit.toFixed(2)],
      [''],
      ['Perbelanjaan Pemasaran (Ads)', 'Meta, Google & TikTok Ads Spend', (-pnl.total_ads_spend).toFixed(2)],
      ['Overhed Operasi Agensi (OPEX)', 'Gaji, Sewa, Utiliti, Software', (-pnl.total_opex).toFixed(2)],
      ['UNTUNG BERSIH SEBENAR (NET PROFIT)', `Margin Bersih: ${pnl.net_margin_percent}%`, pnl.net_profit.toFixed(2)],
      [''],
      ['METRIK TAMBAHAN', 'NILAI'],
      ['Jumlah Pesanan Selesai', `${pnl.total_orders_count} Pesanan`],
      ['Jumlah Helai Jersi Dikeluarkan', `${pnl.total_units_sold} Helai`],
      ['Purata Untung Bersih Sehelai', `MYR ${pnl.avg_profit_per_unit.toFixed(2)} / helai`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.map((val) => `"${val}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Penyata_Kewangan_SVF_${selectedYear}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Laporan & Penyata Kewangan Agensi</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
              Audit & P&L Export
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Jana dan cetak penyata untung rugi rasmi mengikut bulan atau tahunan, serta eksport dalam format Excel/CSV.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Eksport CSV / Excel</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:border-[#00BDFF] text-xs font-semibold text-gray-700 rounded-xl shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-[#00BDFF]" />
            <span>Cetak Penyata</span>
          </button>

          <button
            onClick={() => loadReportData(true)}
            disabled={refreshing || loading}
            title="Muat semula data"
            className="p-2 text-gray-500 hover:text-[#00BDFF] hover:bg-sky-50 rounded-xl border border-gray-200 transition-colors bg-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00BDFF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar (Hidden in Print) */}
      <div className="print:hidden bg-white rounded-2xl border border-gray-200/80 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>

          {/* Month selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-gray-700">Bulan:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]"
            >
              <option value="all">Sepanjang Tahun</option>
              <option value="0">Januari</option>
              <option value="1">Februari</option>
              <option value="2">Mac</option>
              <option value="3">April</option>
              <option value="4">Mei</option>
              <option value="5">Jun</option>
              <option value="6">Julai</option>
              <option value="7">Ogos</option>
              <option value="8">September</option>
              <option value="9">Oktober</option>
              <option value="10">November</option>
              <option value="11">Disember</option>
            </select>
          </div>
        </div>

        <div className="text-xs text-gray-500 font-medium">
          Laporan Aktif: <span className="font-bold text-gray-900">{dateRange.label}</span>
        </div>
      </div>

      {/* Official Printable Statement Sheet */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-8 shadow-sm space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Printable Header */}
        <div className="border-b-2 border-gray-900 pb-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">SVF APPAREL</h2>
            <p className="text-xs text-gray-600 font-medium">Sistem Pengurusan Pengeluaran Agensi & Penyata Kewangan</p>
            <p className="text-xs text-gray-500 mt-1">Penyata Rasmi Untung & Rugi (Income Statement)</p>
          </div>
          <div className="text-right text-xs">
            <div className="font-bold text-gray-900">TEMPOH PENYATA:</div>
            <div className="text-[#00BDFF] font-extrabold uppercase text-sm mt-0.5">{dateRange.label}</div>
            <div className="text-[10px] text-gray-400 mt-1">
              Dijana: {new Date().toLocaleDateString('ms-MY')}
            </div>
          </div>
        </div>

        {/* Itemized P&L Table */}
        <div className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-300 text-gray-600 font-bold uppercase text-[11px] pb-2">
                  <th className="py-2.5 px-3">Perkara / Butiran Akaun</th>
                  <th className="py-2.5 px-3">Rujukan & Nota</th>
                  <th className="py-2.5 px-3 text-right">Debit / Kos (MYR)</th>
                  <th className="py-2.5 px-3 text-right">Kredit / Hasil (MYR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* 1. Pendapatan Kasar */}
                <tr className="font-bold bg-blue-50/50">
                  <td className="py-3 px-3 text-gray-900">1. JUMLAH HASIL JUALAN KASAR (REVENUE)</td>
                  <td className="py-3 px-3 text-gray-600 font-normal">Kutipan jualan dari pesanan tempahan</td>
                  <td className="py-3 px-3 text-right text-gray-400">-</td>
                  <td className="py-3 px-3 text-right font-extrabold text-gray-900">{formatCurrency(pnl.gross_revenue)}</td>
                </tr>

                {/* 2. Kos Kilang COGS */}
                <tr className="text-gray-700">
                  <td className="py-2.5 px-3 pl-6">
                    <span className="font-medium text-amber-900">Tolak: Kos Pengeluaran Kilang Sublimasi (COGS)</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-500">Kuantiti × Kadar Kos All-in-one Kilang Rakan</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-amber-700">{formatCurrency(pnl.total_cogs)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                </tr>

                {/* 3. Untung Kasar Subtotal */}
                <tr className="font-bold bg-emerald-50/80 border-t-2 border-b-2 border-emerald-200">
                  <td className="py-3 px-3 text-emerald-900">UNTUNG KASAR AGENSI (GROSS PROFIT)</td>
                  <td className="py-3 px-3 text-emerald-700 font-normal">Margin Kasar: {pnl.gross_margin_percent}%</td>
                  <td className="py-3 px-3 text-right text-gray-400">-</td>
                  <td className="py-3 px-3 text-right text-emerald-700 text-sm font-extrabold">{formatCurrency(pnl.gross_profit)}</td>
                </tr>

                {/* 4. Perbelanjaan Pemasaran (Ads) */}
                <tr className="text-gray-700">
                  <td className="py-2.5 px-3 pl-6 font-medium text-rose-900">
                    Tolak: Kos Pemasaran & Iklan Berbayar
                  </td>
                  <td className="py-2.5 px-3 text-gray-500">Meta Ads, Google Search & TikTok Ads</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-rose-700">{formatCurrency(pnl.total_ads_spend)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                </tr>

                {/* 5. Overhed Operasi (OPEX) */}
                <tr className="text-gray-700">
                  <td className="py-2.5 px-3 pl-6 font-medium text-purple-900">
                    Tolak: Overhed Operasi Agensi (General OPEX)
                  </td>
                  <td className="py-2.5 px-3 text-gray-500">Sewa, utiliti pejabat, gaji pereka, langganan software</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-purple-700">{formatCurrency(pnl.total_opex)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-400">-</td>
                </tr>

                {/* 6. Untung Bersih Final Total */}
                <tr className="font-black bg-slate-900 text-white text-sm border-t-2 border-slate-900">
                  <td className="py-4 px-3 uppercase tracking-wide text-white">UNTUNG BERSIH SEBENAR (NET PROFIT)</td>
                  <td className="py-4 px-3 text-slate-300 font-normal text-xs">Margin Bersih Sebenar: {pnl.net_margin_percent}%</td>
                  <td className="py-4 px-3 text-right text-slate-400">-</td>
                  <td className="py-4 px-3 text-right text-emerald-400 font-black text-base">{formatCurrency(pnl.net_profit)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Volume & KPI Footnote */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 text-xs">
          <div className="bg-gray-50 p-3.5 rounded-xl">
            <span className="text-gray-500 text-[11px] block">Jumlah Pesanan Diproses</span>
            <span className="text-base font-bold text-gray-900 mt-0.5 block">{pnl.total_orders_count} Pesanan</span>
          </div>
          <div className="bg-gray-50 p-3.5 rounded-xl">
            <span className="text-gray-500 text-[11px] block">Jumlah Kuantiti Jersi Dikeluarkan</span>
            <span className="text-base font-bold text-gray-900 mt-0.5 block">{pnl.total_units_sold} Helai</span>
          </div>
          <div className="bg-gray-50 p-3.5 rounded-xl">
            <span className="text-gray-500 text-[11px] block">Purata Keuntungan Bersih / Helai</span>
            <span className="text-base font-bold text-emerald-600 mt-0.5 block">{formatCurrency(pnl.avg_profit_per_unit)} / helai</span>
          </div>
        </div>

        {/* Signature & Verification (Print view) */}
        <div className="hidden print:grid grid-cols-2 gap-12 pt-12 text-xs">
          <div>
            <p className="font-bold text-gray-900">Disediakan Oleh:</p>
            <div className="h-16 border-b border-gray-400 mt-2"></div>
            <p className="mt-1 text-gray-600">Pengurusan Akaun SVF APPAREL</p>
          </div>
          <div>
            <p className="font-bold text-gray-900">Disahkan & Diluluskan Oleh:</p>
            <div className="h-16 border-b border-gray-400 mt-2"></div>
            <p className="mt-1 text-gray-600">Pengarah Urusan SVF APPAREL</p>
          </div>
        </div>
      </div>
    </div>
  );
}
