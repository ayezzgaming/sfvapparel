'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Factory,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Edit2,
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Printer,
  ChevronRight,
  Sparkles,
  Building2,
  Phone,
  Calendar,
  Layers,
  Shirt,
  DollarSign,
  TrendingUp,
  Percent
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import {
  PartnerFactory,
  FactoryJob,
  FactoryJobStatus,
  Order
} from '@/types/database';
import {
  getPartnerFactories,
  savePartnerFactory,
  deletePartnerFactory,
  getFactoryJobs,
  createOrUpdateFactoryJob,
  updateFactoryJobStatus,
} from '@/app/actions/factoryActions';
import { useAppStore } from '@/lib/store/app-store';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

export default function AdminFactoryJobsPage() {
  const { orders } = useAppStore();

  // Navigation sub-tab: 'jobs' vs 'factories'
  const [activeTab, setActiveTab] = useState<'jobs' | 'factories'>('jobs');
  const [statusFilter, setStatusFilter] = useState<'all' | FactoryJobStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [jobs, setJobs] = useState<FactoryJob[]>([]);
  const [factories, setFactories] = useState<PartnerFactory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modals & Drawers
  const [selectedJob, setSelectedJob] = useState<FactoryJob | null>(null);
  const [isTechPackOpen, setIsTechPackOpen] = useState(false);
  
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [jobFormData, setJobFormData] = useState({
    id: '',
    order_id: '',
    factory_id: '',
    status: 'sent_to_factory' as FactoryJobStatus,
    target_ready_date: '',
    total_quantity: 0,
    cost_per_unit: 22.0,
    customer_price_total: 0,
    fabric_spec: 'Microfiber Interlock 160gsm',
    collar_spec: 'V-Neck Rib Hitam',
    cutting_spec: 'Regular Fit',
    factory_notes: '',
    artwork_hd_url: '',
  });
  const [jobSubmitting, setJobSubmitting] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);

  // Factory Directory Modal
  const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);
  const [factoryFormData, setFactoryFormData] = useState({
    id: '',
    factory_name: '',
    pic_name: '',
    phone: '',
    email: '',
    address: '',
    specialty: 'Full Sublimation All-in-One',
    default_unit_cost: 22.0,
    lead_time_days: 7,
    notes: '',
  });
  const [factorySubmitting, setFactorySubmitting] = useState(false);
  const [factoryError, setFactoryError] = useState<string | null>(null);

  // Initial Load
  const loadData = async () => {
    try {
      const [jobsRes, factRes] = await Promise.all([
        getFactoryJobs(),
        getPartnerFactories(),
      ]);

      if (jobsRes.success) setJobs(jobsRes.data);
      if (factRes.success) setFactories(factRes.data);
    } catch {
      // no-op
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const searchParams = useSearchParams();

  useEffect(() => {
    loadData();
  }, []);

  // Handle URL param ?order_id=...
  useEffect(() => {
    const orderIdParam = searchParams.get('order_id');
    if (orderIdParam && orders.length > 0) {
      const targetOrder = orders.find((o) => o.id === orderIdParam);
      if (targetOrder) {
        handleOpenCreateJob(targetOrder);
      }
    }
  }, [searchParams, orders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.status !== 'received_at_svf' && j.status !== 'closed');
    const totalUnitsInProd = activeJobs.reduce((sum, j) => sum + (Number(j.total_quantity) || 0), 0);
    const totalProductionCost = jobs.reduce((sum, j) => sum + (Number(j.total_factory_cost) || 0), 0);
    const totalGrossProfit = jobs.reduce((sum, j) => sum + (Number(j.gross_profit) || 0), 0);
    const totalCustomerRevenue = jobs.reduce((sum, j) => sum + (Number(j.customer_price_total) || 0), 0);
    const overallGrossMargin = totalCustomerRevenue > 0 ? (totalGrossProfit / totalCustomerRevenue) * 100 : 0;

    return {
      totalJobs,
      activeJobsCount: activeJobs.length,
      totalUnitsInProd,
      totalProductionCost,
      totalGrossProfit,
      overallGrossMargin: Math.round(overallGrossMargin * 10) / 10,
    };
  }, [jobs]);

  // Filtered jobs list
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      if (statusFilter !== 'all' && job.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchJobNo = job.job_number.toLowerCase().includes(q);
        const matchOrderNo = (job.order?.order_number || '').toLowerCase().includes(q);
        const matchCustName = (job.order?.customer_name || '').toLowerCase().includes(q);
        const matchFactory = (job.factory?.factory_name || '').toLowerCase().includes(q);
        if (!matchJobNo && !matchOrderNo && !matchCustName && !matchFactory) return false;
      }
      return true;
    });
  }, [jobs, statusFilter, searchQuery]);

  // Handle open create Job Sheet
  const handleOpenCreateJob = (preselectedOrder?: Order) => {
    const defaultFactory = factories[0];
    const unitCost = defaultFactory?.default_unit_cost || 22.0;

    const ord = preselectedOrder || (orders.length > 0 ? orders[0] : null);
    const qty = ord ? (Number(ord.total_quantity) || 0) : 10;
    const custPrice = ord ? (Number(ord.total_amount) || 0) : 0;

    // Sizing breakdown from order or defaults
    const sizingObj = ord?.sizing_breakdown || { S: 2, M: 4, L: 4 };

    setJobFormData({
      id: '',
      order_id: ord?.id || '',
      factory_id: defaultFactory?.id || '',
      status: 'sent_to_factory',
      target_ready_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total_quantity: qty,
      cost_per_unit: unitCost,
      customer_price_total: custPrice,
      fabric_spec: ord?.fabric_name || 'Microfiber Interlock 160gsm',
      collar_spec: 'V-Neck Rib Hitam',
      cutting_spec: ord?.cut_name || 'Regular Fit',
      factory_notes: '',
      artwork_hd_url: ord?.custom_artwork_url || '',
    });
    setJobError(null);
    setIsJobModalOpen(true);
  };

  // On Order selected in Create Job Sheet Form
  const handleOrderChange = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      setJobFormData((prev) => ({
        ...prev,
        order_id: orderId,
        total_quantity: Number(ord.total_quantity) || 0,
        customer_price_total: Number(ord.total_amount) || 0,
        fabric_spec: ord.fabric_name || prev.fabric_spec,
        cutting_spec: ord.cut_name || prev.cutting_spec,
        artwork_hd_url: ord.custom_artwork_url || prev.artwork_hd_url,
      }));
    }
  };

  // Submit Job Sheet Form
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobFormData.order_id) {
      setJobError('Sila pilih pesanan pelanggan.');
      return;
    }
    if (!jobFormData.factory_id) {
      setJobError('Sila pilih kilang sublimasi rakan kongsi.');
      return;
    }

    setJobSubmitting(true);
    setJobError(null);
    try {
      const res = await createOrUpdateFactoryJob({
        ...jobFormData,
        sizing_breakdown: { S: 5, M: 10, L: 10, XL: 5 }, // Default or linked
      });

      if (res.success) {
        setIsJobModalOpen(false);
        await loadData();
      } else {
        setJobError(res.message || 'Gagal menyimpan Job Sheet.');
      }
    } catch {
      setJobError('Ralat sambungan pelayan.');
    } finally {
      setJobSubmitting(false);
    }
  };

  // Submit Partner Factory Form
  const handleSaveFactory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryFormData.factory_name.trim()) {
      setFactoryError('Sila masukkan nama kilang.');
      return;
    }
    if (!factoryFormData.phone.trim()) {
      setFactoryError('Sila masukkan nombor telefon / WhatsApp kilang.');
      return;
    }

    setFactorySubmitting(true);
    setFactoryError(null);
    try {
      const res = await savePartnerFactory(factoryFormData);
      if (res.success) {
        setIsFactoryModalOpen(false);
        await loadData();
      } else {
        setFactoryError(res.message || 'Gagal menyimpan maklumat kilang.');
      }
    } catch {
      setFactoryError('Ralat sambungan pelayan.');
    } finally {
      setFactorySubmitting(false);
    }
  };

  const handleDeleteFactory = async (id: string, name: string) => {
    if (!confirm(`Padam rekod kilang ${name}?`)) return;
    const res = await deletePartnerFactory(id);
    if (res.success) {
      await loadData();
    } else {
      alert(res.message || 'Gagal memadam kilang.');
    }
  };

  // Change job status
  const handleStatusChange = async (jobId: string, newStatus: FactoryJobStatus) => {
    const res = await updateFactoryJobStatus(jobId, newStatus);
    if (res.success) {
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
      );
      if (selectedJob?.id === jobId) {
        setSelectedJob((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } else {
      alert('Gagal mengemaskini status kerja kilang.');
    }
  };

  return (
    <div className="w-full h-full overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950 flex flex-col p-4 gap-3 text-slate-900 dark:text-zinc-100 font-sans select-none">
      
      {/* ----------------- TOP TOOLBAR ----------------- */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-h-[38px]">
        {/* Left: Title, Badges & Sub-tabs */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
              Job Sheet Pengeluaran Kilang
            </span>
            <span className="text-[10px] font-bold text-[#00BDFF] bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-900">
              {metrics.totalJobs} Job Sheets
            </span>
          </div>

          {/* Sub-tab Switcher: Job Sheets vs Direktori Kilang */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-full border border-slate-200 dark:border-zinc-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'jobs'
                  ? 'bg-[#00BDFF] text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-[#00BDFF]'
              }`}
            >
              Senarai Job Sheet ({jobs.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('factories')}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'factories'
                  ? 'bg-[#00BDFF] text-white shadow-xs'
                  : 'text-slate-600 dark:text-zinc-400 hover:text-[#00BDFF]'
              }`}
            >
              Direktori Kilang ({factories.length})
            </button>
          </div>
        </div>

        {/* Right: Search, Refresh & Action Button */}
        <div className="flex items-center gap-2">
          {activeTab === 'jobs' && (
            <div className="relative w-48 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari PO, pesanan, kilang..."
                className="w-full pl-8 pr-3 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30 focus:border-[#00BDFF] transition-all shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200/80 dark:border-zinc-700 shadow-2xs transition-colors cursor-pointer"
            title="Segarkan Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#00BDFF]' : ''}`} />
          </button>

          {activeTab === 'jobs' ? (
            <button
              type="button"
              onClick={() => handleOpenCreateJob()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Jana Job Sheet Baru</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setFactoryFormData({
                  id: '',
                  factory_name: '',
                  pic_name: '',
                  phone: '',
                  email: '',
                  address: '',
                  specialty: 'Full Sublimation All-in-One',
                  default_unit_cost: 22.0,
                  lead_time_days: 7,
                  notes: '',
                });
                setFactoryError(null);
                setIsFactoryModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Daftar Kilang Rakan Kongsi</span>
            </button>
          )}
        </div>
      </div>

      {/* ----------------- METRICS STRIP: COGS & MARGIN HIGHLIGHTS ----------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Job Aktif Kilang
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-zinc-100">
              {metrics.activeJobsCount} Jobs <span className="text-xs font-medium text-slate-500">({metrics.totalUnitsInProd} helai)</span>
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-[#00BDFF] flex items-center justify-center">
            <Factory className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Kos Produksi (COGS)
            </span>
            <span className="text-base font-extrabold text-rose-600 dark:text-rose-400">
              {formatCurrency(metrics.totalProductionCost)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Untung Kasar Agensi
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metrics.totalGrossProfit)}
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Purata Margin Kasar
            </span>
            <span className="text-base font-extrabold text-[#00BDFF]">
              {metrics.overallGrossMargin}%
            </span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-[#00BDFF] flex items-center justify-center">
            <Percent className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ----------------- MAIN VIEW 1: FACTORY JOBS TABLE ----------------- */}
      {activeTab === 'jobs' && (
        <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-hidden flex flex-col">
          {/* Status Filter Tabs */}
          <div className="px-4 py-2 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto">
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'sent_to_factory', label: 'Dihantar ke Kilang' },
              { id: 'in_production', label: 'Sedang Dijahit / Cetak' },
              { id: 'factory_completed', label: 'Siap di Kilang' },
              { id: 'received_at_svf', label: 'Diterima di SVF / Selesai' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Jobs Table List */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin text-[#00BDFF] mr-2" />
              <span>Memuatkan senarai Job Sheet kilang...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 flex items-center justify-center">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Tiada Rekod Job Sheet</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Belum ada Job Sheet pengeluaran kilang yang sepadan dengan tapisan ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleOpenCreateJob()}
                className="px-4 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-bold transition-all shadow-xs"
              >
                + Jana Job Sheet Pertama
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-auto sparkle-scroll">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50/80 dark:bg-zinc-800/80 sticky top-0 z-10 border-b border-slate-200/80 dark:border-zinc-800 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">PO & Pesanan</th>
                    <th className="py-3 px-4">Kilang All-in-One</th>
                    <th className="py-3 px-4 text-center">Kuantiti</th>
                    <th className="py-3 px-4 text-right">Kos Kilang (COGS)</th>
                    <th className="py-3 px-4 text-right">Harga Jual</th>
                    <th className="py-3 px-4 text-right">Untung Kasar</th>
                    <th className="py-3 px-4 text-center">Status Produksi</th>
                    <th className="py-3 px-4 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                  {filteredJobs.map((job) => {
                    const cleanPhone = (job.factory?.phone || '').replace(/[^0-9]/g, '');

                    return (
                      <tr
                        key={job.id}
                        onClick={() => {
                          setSelectedJob(job);
                          setIsTechPackOpen(true);
                        }}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                      >
                        {/* PO & Order */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-xs text-slate-900 dark:text-zinc-100 group-hover:text-[#00BDFF] transition-colors block">
                              {job.job_number}
                            </span>
                            <span className="text-[11px] text-slate-500 block">
                              Pesanan #{job.order?.order_number || 'N/A'} • {job.order?.customer_name}
                            </span>
                          </div>
                        </td>

                        {/* Factory */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-800 dark:text-zinc-200 block truncate max-w-[160px]">
                              {job.factory?.factory_name || 'Kilang Rakan Kongsi'}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Kadar: {formatCurrency(job.cost_per_unit)}/helai
                            </span>
                          </div>
                        </td>

                        {/* Quantity */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200">
                            {job.total_quantity} helai
                          </span>
                        </td>

                        {/* COGS Factory Cost */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {formatCurrency(job.total_factory_cost)}
                        </td>

                        {/* Customer Price */}
                        <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700 dark:text-zinc-300">
                          {formatCurrency(job.customer_price_total)}
                        </td>

                        {/* Gross Profit & Margin % */}
                        <td className="py-3 px-4 text-right">
                          <div className="space-y-0.5">
                            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                              +{formatCurrency(job.gross_profit)}
                            </span>
                            <span className="text-[10px] font-bold text-[#00BDFF] block">
                              {job.gross_margin_percent}% margin
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              job.status === 'received_at_svf'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : job.status === 'factory_completed'
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : job.status === 'in_production'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {job.status === 'received_at_svf'
                              ? 'Diterima di SVF'
                              : job.status === 'factory_completed'
                              ? 'Siap di Kilang'
                              : job.status === 'in_production'
                              ? 'Dalam Jahitan'
                              : 'Dihantar ke Kilang'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                  `Salam ${job.factory?.pic_name || 'Tuan'}, ini rujukan Job Sheet Pengeluaran SVF APPAREL [${job.job_number}] untuk ${job.total_quantity} helai jersi sublimasi. Sila semak spesifikasi kain: ${job.fabric_spec}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                                title="Hantar ke WhatsApp Kilang"
                              >
                                <FaWhatsapp className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedJob(job);
                                setIsTechPackOpen(true);
                              }}
                              className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 transition-colors"
                              title="Buka Job Sheet / Tech Pack"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ----------------- MAIN VIEW 2: PARTNER FACTORIES DIRECTORY ----------------- */}
      {activeTab === 'factories' && (
        <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-hidden flex flex-col p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto sparkle-scroll">
            {factories.map((fact) => {
              const cleanPhone = fact.phone.replace(/[^0-9]/g, '');

              return (
                <div
                  key={fact.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 space-y-3 hover:border-[#00BDFF]/50 transition-all shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#00BDFF]/10 text-[#00BDFF] flex items-center justify-center font-bold">
                        <Factory className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                          {fact.factory_name}
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          PIC: {fact.pic_name || 'Pengurus Kilang'}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Aktif
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">+{cleanPhone}</span>
                    </div>
                    {fact.address && (
                      <p className="text-[11px] text-slate-500 truncate">{fact.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Kadar Seunit Standard</span>
                      <span className="font-bold text-[#00BDFF]">{formatCurrency(fact.default_unit_cost)}/helai</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block">Tempoh Siap (Lead Time)</span>
                      <span className="font-bold text-slate-800 dark:text-zinc-200">{fact.lead_time_days} Hari</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-2">
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <FaWhatsapp className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setFactoryFormData({
                          id: fact.id,
                          factory_name: fact.factory_name,
                          pic_name: fact.pic_name || '',
                          phone: fact.phone,
                          email: fact.email || '',
                          address: fact.address || '',
                          specialty: fact.specialty || 'Full Sublimation All-in-One',
                          default_unit_cost: fact.default_unit_cost,
                          lead_time_days: fact.lead_time_days,
                          notes: fact.notes || '',
                        });
                        setFactoryError(null);
                        setIsFactoryModalOpen(true);
                      }}
                      className="p-1.5 rounded-full bg-slate-200/60 hover:bg-slate-300 dark:bg-zinc-700 text-slate-700 dark:text-zinc-200 text-xs transition-colors"
                      title="Kemaskini"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFactory(fact.id, fact.factory_name)}
                      className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs transition-colors"
                      title="Padam"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- JOB SHEET TECH PACK DETAIL DRAWER ------------------- */}
      {/* ========================================================================= */}
      {isTechPackOpen && selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 px-5 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center space-x-2">
                <Factory className="w-4 h-4 text-[#00BDFF]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Job Sheet Tech Pack: {selectedJob.job_number}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                  title="Cetak Job Sheet"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsTechPackOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tech Pack Printable Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 sparkle-scroll font-sans text-xs">
              {/* Document Banner */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] font-extrabold text-[#00BDFF] tracking-widest uppercase">
                    SVF APPAREL • WORK ORDER TECH PACK
                  </span>
                  <h2 className="text-lg font-extrabold mt-0.5">{selectedJob.job_number}</h2>
                  <p className="text-[11px] text-slate-300">
                    Kilang: <strong>{selectedJob.factory?.factory_name || 'Kilang Rakan Kongsi'}</strong>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase block">Kuantiti Tempahan</span>
                  <span className="text-xl font-extrabold text-[#00BDFF]">{selectedJob.total_quantity} helai</span>
                </div>
              </div>

              {/* Status Update Quick Bar */}
              <div className="p-3 bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-zinc-300">Status Pengeluaran:</span>
                <select
                  value={selectedJob.status}
                  onChange={(e) => handleStatusChange(selectedJob.id, e.target.value as FactoryJobStatus)}
                  className="px-3 py-1 bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-600 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30 cursor-pointer"
                >
                  <option value="sent_to_factory">Dihantar ke Kilang</option>
                  <option value="in_production">Sedang Dijahit / Cetak</option>
                  <option value="factory_completed">Siap di Kilang</option>
                  <option value="received_at_svf">Diterima di SVF / Sedia Pos</option>
                </select>
              </div>

              {/* Technical Specifications */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Spesifikasi Jersi</h4>
                <div className="grid grid-cols-2 gap-3 text-slate-800 dark:text-zinc-200">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Jenis Kain</span>
                    <span className="font-semibold">{selectedJob.fabric_spec || 'Microfiber Interlock 160gsm'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Jenis Kolar</span>
                    <span className="font-semibold">{selectedJob.collar_spec || 'V-Neck Rib Hitam'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Potongan & Lengan</span>
                    <span className="font-semibold">{selectedJob.cutting_spec || 'Regular Fit (Pendek)'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Tarikh Sasaran Siap</span>
                    <span className="font-semibold font-mono text-[#00BDFF]">
                      {selectedJob.target_ready_date || '7 Hari'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Profit & Cost Breakdown for Admin */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Kiraan Margin Agensi (Sulit Pentadbir)</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Jual Pelanggan</span>
                    <span className="font-bold text-slate-900 dark:text-zinc-100">
                      {formatCurrency(selectedJob.customer_price_total)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Kos Kilang (COGS)</span>
                    <span className="font-bold text-rose-600">
                      -{formatCurrency(selectedJob.total_factory_cost)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Untung Kasar</span>
                    <span className="font-bold text-emerald-600">
                      +{formatCurrency(selectedJob.gross_profit)} ({selectedJob.gross_margin_percent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Artwork HD Link */}
              {selectedJob.artwork_hd_url && (
                <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#00BDFF]" />
                    <span className="font-semibold text-slate-800 dark:text-zinc-200">Fail Artwork HD / Vektor</span>
                  </div>
                  <a
                    href={selectedJob.artwork_hd_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <span>Muat Turun Fail</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- CREATE / EDIT JOB SHEET MODAL ---------------------- */}
      {/* ========================================================================= */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center space-x-2">
                <Factory className="w-4 h-4 text-[#00BDFF]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  Tugaskan Job Sheet Kilang Sublimasi All-in-One
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsJobModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveJob} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto sparkle-scroll">
              {jobError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {jobError}
                </div>
              )}

              {/* Order Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Pilih Pesanan Pelanggan <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={jobFormData.order_id}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30 cursor-pointer"
                >
                  <option value="">-- Pilih Pesanan Aktif --</option>
                  {orders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      #{ord.order_number} - {ord.customer_name} ({ord.total_quantity} helai - {formatCurrency(ord.total_amount)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Partner Factory Selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Kilang Sublimasi All-in-One <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={jobFormData.factory_id}
                  onChange={(e) => {
                    const fact = factories.find((f) => f.id === e.target.value);
                    setJobFormData({
                      ...jobFormData,
                      factory_id: e.target.value,
                      cost_per_unit: fact?.default_unit_cost || jobFormData.cost_per_unit,
                    });
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#00BDFF]/30 cursor-pointer"
                >
                  <option value="">-- Pilih Kilang Rakan Kongsi --</option>
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.factory_name} (Kadar Std: {formatCurrency(f.default_unit_cost)}/helai)
                    </option>
                  ))}
                </select>
              </div>

              {/* Production Costing & Margin Preview */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-sky-50/60 dark:bg-sky-950/40 rounded-2xl border border-sky-200 dark:border-sky-900">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Kos Seunit Kilang (RM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    required
                    value={jobFormData.cost_per_unit}
                    onChange={(e) => setJobFormData({ ...jobFormData, cost_per_unit: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 font-mono font-bold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Tarikh Siap Sasaran
                  </label>
                  <input
                    type="date"
                    value={jobFormData.target_ready_date}
                    onChange={(e) => setJobFormData({ ...jobFormData, target_ready_date: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>

                <div className="col-span-2 pt-2 border-t border-sky-200/60 dark:border-sky-800 text-xs flex items-center justify-between">
                  <span className="text-slate-600 dark:text-zinc-400">Total Kos Kilang:</span>
                  <span className="font-mono font-bold text-rose-600">
                    {formatCurrency(jobFormData.total_quantity * jobFormData.cost_per_unit)}
                  </span>
                </div>
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Spesifikasi Kain
                  </label>
                  <input
                    type="text"
                    value={jobFormData.fabric_spec}
                    onChange={(e) => setJobFormData({ ...jobFormData, fabric_spec: e.target.value })}
                    placeholder="Microfiber Interlock 160gsm"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Spesifikasi Kolar
                  </label>
                  <input
                    type="text"
                    value={jobFormData.collar_spec}
                    onChange={(e) => setJobFormData({ ...jobFormData, collar_spec: e.target.value })}
                    placeholder="V-Neck Rib Hitam"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Pautan Fail Artwork HD / AI / PDF
                </label>
                <input
                  type="url"
                  value={jobFormData.artwork_hd_url}
                  onChange={(e) => setJobFormData({ ...jobFormData, artwork_hd_url: e.target.value })}
                  placeholder="https://drive.google.com/... atau fail storan"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={jobSubmitting}
                  className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {jobSubmitting ? 'Menjana Job Sheet...' : 'Jana & Tugaskan ke Kilang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* -------------------- PARTNER FACTORY MODAL ------------------------------ */}
      {/* ========================================================================= */}
      {isFactoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 px-5 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-800/50">
              <div className="flex items-center space-x-2">
                <Factory className="w-4 h-4 text-[#00BDFF]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                  {factoryFormData.id ? 'Kemaskini Kilang Rakan Kongsi' : 'Daftar Kilang Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFactoryModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveFactory} className="p-5 space-y-4">
              {factoryError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {factoryError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Nama Kilang Sublimasi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={factoryFormData.factory_name}
                  onChange={(e) => setFactoryFormData({ ...factoryFormData, factory_name: e.target.value })}
                  placeholder="Contoh: Kilang Sublimasi Utama"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Nama PIC / Pengurus
                  </label>
                  <input
                    type="text"
                    value={factoryFormData.pic_name}
                    onChange={(e) => setFactoryFormData({ ...factoryFormData, pic_name: e.target.value })}
                    placeholder="En. Rizal"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    No. Telefon / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={factoryFormData.phone}
                    onChange={(e) => setFactoryFormData({ ...factoryFormData, phone: e.target.value })}
                    placeholder="0123456789"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Kadar Standard Seunit (RM)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    value={factoryFormData.default_unit_cost}
                    onChange={(e) => setFactoryFormData({ ...factoryFormData, default_unit_cost: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono font-bold text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Tempoh Siap (Hari)
                  </label>
                  <input
                    type="number"
                    value={factoryFormData.lead_time_days}
                    onChange={(e) => setFactoryFormData({ ...factoryFormData, lead_time_days: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Alamat / Lokasi Kilang
                </label>
                <textarea
                  rows={2}
                  value={factoryFormData.address}
                  onChange={(e) => setFactoryFormData({ ...factoryFormData, address: e.target.value })}
                  placeholder="Shah Alam, Selangor"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-xs resize-none"
                />
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsFactoryModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={factorySubmitting}
                  className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {factorySubmitting ? 'Menyimpan...' : factoryFormData.id ? 'Simpan Perubahan' : 'Daftar Kilang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
