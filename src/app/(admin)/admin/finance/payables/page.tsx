'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  CreditCard,
  FileSpreadsheet
} from 'lucide-react';
import { getFactoryPayables, markFactoryJobPaid } from '@/app/actions/financeActions';
import { FactoryJob, PartnerFactory } from '@/types/database';
import { toast } from '@/components/ui/Toast';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export default function AdminFinancePayablesPage() {
  const [payables, setPayables] = useState<
    Array<{
      job: FactoryJob;
      totalCost: number;
      paymentStatus: string;
    }>
  >([]);
  const [totalPayable, setTotalPayable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getFactoryPayables();
      if (res.success) {
        setPayables(res.data || []);
        setTotalPayable(res.totalPayable || 0);
      }
    } catch (err) {
      console.error('Error fetching factory payables:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPayables = useMemo(() => {
    if (!searchQuery.trim()) return payables;
    const q = searchQuery.toLowerCase();
    return payables.filter(
      (p) =>
        p.job.job_number?.toLowerCase().includes(q) ||
        p.job.factory?.factory_name?.toLowerCase().includes(q) ||
        p.job.fabric_spec?.toLowerCase().includes(q)
    );
  }, [payables, searchQuery]);

  const uniqueFactoriesCount = useMemo(() => {
    const factoryIds = new Set(payables.map((p) => p.job.factory_id).filter(Boolean));
    return factoryIds.size;
  }, [payables]);

  const handleMarkPaid = async (jobId: string, cost: number, factoryName: string) => {
    if (
      !confirm(
        `Sahkan pembayaran kos ${formatCurrency(cost)} kepada ${factoryName || 'Kilang'}? Rekod outflow akan dimasukkan ke dalam lejar transaksi secara automatik.`
      )
    ) {
      return;
    }

    setActionLoadingId(jobId);
    try {
      const res = await markFactoryJobPaid(jobId, cost);
      if (res.success) {
        loadData(true);
        toast.success('Bayaran Direkod', 'Pembayaran kilang berjaya direkod.');
      } else {
        toast.error('Gagal Merekod', res.message || 'Gagal merekod pembayaran.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Ralat Sistem', 'Ralat semasa merekod pembayaran kilang.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Bayaran Kilang Sublimasi (A/P)</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
              Accounts Payable (COGS)
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Pantau invois kos pengeluaran cetak & jahit yang belum diselesaikan kepada kilang rakan kongsi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/factory-jobs"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 hover:border-[#00BDFF] text-xs font-semibold text-gray-700 rounded-xl shadow-sm transition-all"
          >
            <Building2 className="w-4 h-4 text-[#00BDFF]" />
            <span>Urus Job Sheet Kilang</span>
          </Link>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            title="Muat semula data"
            className="p-2 text-gray-500 hover:text-[#00BDFF] hover:bg-sky-50 rounded-xl border border-gray-200 transition-colors bg-white shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00BDFF]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Payables */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Jumlah Hutang Kilang (A/P)</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-amber-600">
              {loading ? '...' : formatCurrency(totalPayable)}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Jumlah kos pengeluaran belum dibayar kepada kilang</p>
          </div>
        </div>

        {/* Pending Jobs Count */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Job Sheet Belum Selesai</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#00BDFF] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : payables.length} <span className="text-sm font-normal text-gray-500">Job Sheet</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">Tugasan produksi dalam proses atau siap cetak</p>
          </div>
        </div>

        {/* Unique Factories */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Kilang Terlibat</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-2xl font-bold text-gray-900">
              {loading ? '...' : uniqueFactoriesCount} <span className="text-sm font-normal text-gray-500">Rakan Kilang</span>
            </h3>
            <p className="text-xs text-gray-500 mt-1">Kilang yang mempunyai baki bayaran aktif</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs font-semibold text-gray-700">
          Senarai Invois Kilang Menunggu Pembayaran ({filteredPayables.length})
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari no. job sheet, kilang, spesifikasi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00BDFF] focus:border-transparent transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Payables Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-gray-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00BDFF] mx-auto mb-2" />
            <p className="text-xs">Memuatkan senarai hutang kilang...</p>
          </div>
        ) : filteredPayables.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700">Semua bayaran kilang telah selesai!</p>
            <p className="text-xs text-gray-400 mt-1">Tiada tunggakan kos pengeluaran semasa.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">No. Job Sheet</th>
                  <th className="py-3 px-4">Kilang Rakan Kongsi</th>
                  <th className="py-3 px-4">Kuantiti & Kain</th>
                  <th className="py-3 px-4 text-right">Kadar Kos Seunit</th>
                  <th className="py-3 px-4 text-right font-bold text-gray-900">Jumlah Kos Kilang</th>
                  <th className="py-3 px-4">Status Bayaran</th>
                  <th className="py-3 px-4 text-center">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredPayables.map(({ job, totalCost, paymentStatus }) => {
                  const factoryName = job.factory?.factory_name || 'Kilang Rakan Kongsi';

                  return (
                    <tr key={job.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* Job Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        <Link
                          href={`/admin/factory-jobs`}
                          className="hover:text-[#00BDFF] transition-colors"
                        >
                          {job.job_number}
                        </Link>
                        <div className="text-[10px] text-gray-400 font-normal">
                          {job.created_at ? new Date(job.created_at).toLocaleDateString('ms-MY') : '-'}
                        </div>
                      </td>

                      {/* Factory Name & PIC */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{factoryName}</div>
                        {job.factory?.pic_name && (
                          <div className="text-[10px] text-gray-500">PIC: {job.factory.pic_name} ({job.factory.phone || '-'})</div>
                        )}
                      </td>

                      {/* Specs */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-900">{job.total_quantity} Helai</div>
                        <div className="text-[10px] text-gray-500">{job.fabric_spec || 'Microfiber'}</div>
                      </td>

                      {/* Unit Cost */}
                      <td className="py-3.5 px-4 text-right font-mono text-gray-700">
                        {formatCurrency(Number(job.cost_per_unit) || 0)} / helai
                      </td>

                      {/* Total Factory Cost */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {formatCurrency(totalCost)}
                        </span>
                      </td>

                      {/* Payment Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Belum Bayar
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleMarkPaid(job.id, totalCost, factoryName)}
                          disabled={actionLoadingId === job.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-[11px] font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50"
                          title="Tandakan Kos Telah Dibayar"
                        >
                          {actionLoadingId === job.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <CreditCard className="w-3 h-3" />
                          )}
                          <span>Bayar Sekarang</span>
                        </button>
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
  );
}
