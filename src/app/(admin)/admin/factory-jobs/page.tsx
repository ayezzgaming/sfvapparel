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
  Trash2,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Printer,
  ChevronRight,
  Building2,
  Phone,
  DollarSign,
  TrendingUp,
  Percent,
  SlidersHorizontal
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
  getFactoryJobs,
  createOrUpdateFactoryJob,
  updateFactoryJobStatus,
} from '@/app/actions/factoryActions';
import { calculateFactoryUnitCost, DEFAULT_COLLAR_LIST } from '@/lib/factory-pricing-calculator';
import { useAppStore } from '@/lib/store/app-store';
import FactoryJobSheetModal from '@/components/factory/FactoryJobSheetModal';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

const STATUS_CONFIG: Record<
  FactoryJobStatus,
  { label: string; badgeClass: string; step: number }
> = {
  draft: {
    label: 'Draf',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    step: 1,
  },
  sent_to_factory: {
    label: 'Dihantar ke Kilang',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    step: 2,
  },
  in_production: {
    label: 'Sedang Cetak & Jahit',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    step: 3,
  },
  factory_completed: {
    label: 'Siap di Kilang',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    step: 4,
  },
  received_at_svf: {
    label: 'Diterima di SVF (QC)',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    step: 5,
  },
  closed: {
    label: 'Selesai / Ditutup',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    step: 6,
  },
};

function FactoryJobsContent() {
  const { orders, fabrics, cuts } = useAppStore();
  const searchParams = useSearchParams();

  // Filters & State
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

  // Job Form State
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
    fabric_spec: 'Microfiber Eyelet 160gsm',
    collar_spec: 'Round Neck Rib',
    cutting_spec: 'Regular Fit',
    factory_notes: '',
    artwork_hd_url: '',
    sizing_breakdown: {} as Record<string, number>,
    player_roster: [] as any[],
  });
  const [jobSubmitting, setJobSubmitting] = useState(false);
  const [jobError, setJobError] = useState<string | null>(null);

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
    const ord = preselectedOrder || (orders.length > 0 ? orders[0] : null);
    const qty = ord ? (Number(ord.total_quantity) || 0) : 10;
    const custPrice = ord ? (Number(ord.total_amount) || 0) : 0;
    const fabric = ord?.fabric_name || fabrics[0]?.name || 'Microfiber Eyelet 160gsm';
    const cut = ord?.cut_name || cuts[0]?.name || 'Regular Fit';
    const collar = DEFAULT_COLLAR_LIST[0] || 'Round Neck Rib';

    const costCalc = calculateFactoryUnitCost(defaultFactory, qty, fabric, cut, collar);
    const sizingObj = ord?.sizing_breakdown || { S: 2, M: 4, L: 4 };

    setJobFormData({
      id: '',
      order_id: ord?.id || '',
      factory_id: defaultFactory?.id || '',
      status: 'sent_to_factory',
      target_ready_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      total_quantity: qty,
      cost_per_unit: costCalc.finalUnitCost,
      customer_price_total: custPrice,
      fabric_spec: fabric,
      collar_spec: collar,
      cutting_spec: cut,
      factory_notes: '',
      artwork_hd_url: ord?.custom_artwork_url || ord?.mockup_url || '',
      sizing_breakdown: sizingObj,
      player_roster: (ord as any)?.player_roster || [],
    });
    setJobError(null);
    setIsJobModalOpen(true);
  };

  // Live breakdown of factory rate calculations
  const liveCostBreakdown = useMemo(() => {
    const fac = factories.find((f) => f.id === jobFormData.factory_id) || factories[0];
    return calculateFactoryUnitCost(
      fac,
      Number(jobFormData.total_quantity) || 1,
      jobFormData.fabric_spec,
      jobFormData.cutting_spec,
      jobFormData.collar_spec
    );
  }, [factories, jobFormData.factory_id, jobFormData.total_quantity, jobFormData.fabric_spec, jobFormData.cutting_spec, jobFormData.collar_spec]);

  // On Order selected in Create Job Sheet Form
  const handleOrderChange = (orderId: string) => {
    const ord = orders.find((o) => o.id === orderId);
    if (ord) {
      const selectedFac = factories.find((f) => f.id === jobFormData.factory_id) || factories[0];
      const qty = Number(ord.total_quantity) || 0;
      const fabric = ord.fabric_name || jobFormData.fabric_spec || fabrics[0]?.name || 'Microfiber Eyelet 160gsm';
      const cut = ord.cut_name || jobFormData.cutting_spec || cuts[0]?.name || 'Regular Fit';
      const collar = jobFormData.collar_spec || DEFAULT_COLLAR_LIST[0];

      const costCalc = calculateFactoryUnitCost(selectedFac, qty, fabric, cut, collar);

      setJobFormData((prev) => ({
        ...prev,
        order_id: orderId,
        total_quantity: qty,
        customer_price_total: Number(ord.total_amount) || 0,
        cost_per_unit: costCalc.finalUnitCost,
        fabric_spec: fabric,
        cutting_spec: cut,
        artwork_hd_url: ord.custom_artwork_url || ord.mockup_url || prev.artwork_hd_url,
        sizing_breakdown: ord.sizing_breakdown || prev.sizing_breakdown,
        player_roster: (ord as any).player_roster || prev.player_roster,
      }));
    }
  };

  // On Factory selected in Create Job Sheet Form
  const handleFactoryChange = (factoryId: string) => {
    const fac = factories.find((f) => f.id === factoryId);
    const costCalc = calculateFactoryUnitCost(
      fac,
      jobFormData.total_quantity,
      jobFormData.fabric_spec,
      jobFormData.cutting_spec,
      jobFormData.collar_spec
    );

    setJobFormData((prev) => ({
      ...prev,
      factory_id: factoryId,
      cost_per_unit: costCalc.finalUnitCost,
    }));
  };

  // On Spec changed - Recalculate Unit Cost from Selected Factory's Matrix
  const handleSpecFieldChange = (field: 'fabric_spec' | 'cutting_spec' | 'collar_spec', value: string) => {
    const selectedFac = factories.find((f) => f.id === jobFormData.factory_id) || factories[0];
    const newFabric = field === 'fabric_spec' ? value : jobFormData.fabric_spec;
    const newCut = field === 'cutting_spec' ? value : jobFormData.cutting_spec;
    const newCollar = field === 'collar_spec' ? value : jobFormData.collar_spec;

    const costCalc = calculateFactoryUnitCost(
      selectedFac,
      jobFormData.total_quantity,
      newFabric,
      newCut,
      newCollar
    );

    setJobFormData((prev) => ({
      ...prev,
      [field]: value,
      cost_per_unit: costCalc.finalUnitCost,
    }));
  };

  // Calculations inside modal
  const computedFactoryCost = (Number(jobFormData.total_quantity) || 0) * (Number(jobFormData.cost_per_unit) || 0);
  const computedGrossProfit = (Number(jobFormData.customer_price_total) || 0) - computedFactoryCost;
  const computedGrossMargin =
    jobFormData.customer_price_total > 0
      ? (computedGrossProfit / jobFormData.customer_price_total) * 100
      : 0;

  // Submit Job Sheet Form
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobFormData.order_id) {
      setJobError('Sila pilih pesanan pelanggan.');
      return;
    }
    if (!jobFormData.factory_id) {
      setJobError('Sila pilih kilang penerima.');
      return;
    }

    setJobSubmitting(true);
    setJobError(null);
    try {
      const res = await createOrUpdateFactoryJob({
        id: jobFormData.id || undefined,
        order_id: jobFormData.order_id,
        factory_id: jobFormData.factory_id,
        status: jobFormData.status,
        target_ready_date: jobFormData.target_ready_date,
        total_quantity: Number(jobFormData.total_quantity) || 0,
        cost_per_unit: Number(jobFormData.cost_per_unit) || 0,
        customer_price_total: Number(jobFormData.customer_price_total) || 0,
        fabric_spec: jobFormData.fabric_spec,
        collar_spec: jobFormData.collar_spec,
        cutting_spec: jobFormData.cutting_spec,
        sizing_breakdown: jobFormData.sizing_breakdown,
        player_roster: jobFormData.player_roster,
        artwork_hd_url: jobFormData.artwork_hd_url,
        factory_notes: jobFormData.factory_notes,
      });

      if (res.success && res.data) {
        setIsJobModalOpen(false);
        await loadData();
        setSelectedJob(res.data);
        setIsTechPackOpen(true);
      } else {
        setJobError(res.message || 'Gagal menjana Job Sheet.');
      }
    } catch {
      setJobError('Ralat sambungan pelayan.');
    } finally {
      setJobSubmitting(false);
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (jobId: string, status: FactoryJobStatus) => {
    try {
      const res = await updateFactoryJobStatus(jobId, status);
      if (res.success) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status } : j))
        );
        if (selectedJob?.id === jobId) {
          setSelectedJob((prev) => (prev ? { ...prev, status } : null));
        }
      }
    } catch {
      alert('Gagal mengemaskini status.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span className="text-slate-800 font-medium">Produksi Kilang</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span>Job Sheet Pesanan</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Job Sheet Pesanan</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengurusan tugasan pengeluaran, status proses dan kos kilang.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            title="Muat semula"
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <Link
            href="/admin/factories"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Pengurusan Kilang</span>
          </Link>

          <button
            onClick={() => handleOpenCreateJob()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Jana Job Sheet</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Job Aktif Kilang</span>
            <p className="text-xl font-bold text-slate-900 mt-1">{metrics.activeJobsCount}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{metrics.totalUnitsInProd} helai dalam produksi</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center">
            <Factory className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Kos Kilang (COGS)</span>
            <p className="text-xl font-bold text-amber-600 mt-1">{formatCurrency(metrics.totalProductionCost)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Jumlah kos pesanan</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Untung Kasar SVF</span>
            <p className="text-xl font-bold text-emerald-600 mt-1">{formatCurrency(metrics.totalGrossProfit)}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Jualan tolak kos kilang</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Purata Margin Kasar</span>
            <p className="text-xl font-bold text-[#00BDFF] mt-1">{metrics.overallGrossMargin}%</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Peratus margin</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center">
            <Percent className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-[#00BDFF] text-white font-semibold shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua ({jobs.length})
          </button>
          {(Object.keys(STATUS_CONFIG) as FactoryJobStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#00BDFF] text-white font-semibold shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {STATUS_CONFIG[st].label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari PO, pesanan, kilang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00BDFF]"
          />
        </div>
      </div>

      {/* Job Sheets Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00BDFF] mx-auto mb-2" />
            <p className="text-xs">Memuatkan senarai job sheet...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Factory className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">Tiada Rekod Job Sheet</p>
            <p className="text-xs text-slate-400 mt-1">Gunakan butang Jana Job Sheet untuk memulakan tugasan produksi.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">No. Job Sheet</th>
                  <th className="py-3 px-4">Pesanan Pelanggan</th>
                  <th className="py-3 px-4">Kilang Penerima</th>
                  <th className="py-3 px-4 text-center">Kuantiti</th>
                  <th className="py-3 px-4 text-right">Kos Kilang</th>
                  <th className="py-3 px-4 text-right">Untung Kasar</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => {
                  const statusInfo = STATUS_CONFIG[job.status] || STATUS_CONFIG.draft;
                  const cleanPhone = job.factory?.phone?.replace(/[^0-9]/g, '') || '';

                  return (
                    <tr
                      key={job.id}
                      className="hover:bg-sky-50/40 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedJob(job);
                        setIsTechPackOpen(true);
                      }}
                    >
                      {/* Job Number */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {job.job_number}
                        <div className="text-[10px] text-slate-400 font-normal">
                          {job.created_at ? new Date(job.created_at).toLocaleDateString('ms-MY') : '-'}
                        </div>
                      </td>

                      {/* Order Info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">
                          {job.order?.order_number || `#${job.order_id?.slice(0, 8)}`}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {job.order?.customer_name || 'Pelanggan'} • {job.fabric_spec || 'Microfiber'}
                        </div>
                      </td>

                      {/* Factory */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-900">
                          {job.factory?.factory_name || 'Belum Ditugaskan'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {job.factory?.pic_name ? `PIC: ${job.factory.pic_name}` : '-'}
                        </div>
                      </td>

                      {/* Quantity */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-bold text-slate-900">{job.total_quantity}</span>
                        <span className="text-slate-400 text-[10px] block">helai</span>
                      </td>

                      {/* Factory Cost */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-amber-700">
                          {formatCurrency(Number(job.total_factory_cost) || 0)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          RM {Number(job.cost_per_unit).toFixed(2)}/u
                        </div>
                      </td>

                      {/* Gross Profit */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-emerald-600">
                          {formatCurrency(Number(job.gross_profit) || 0)}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium">
                          {job.gross_margin_percent}%
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={job.status}
                          onChange={(e) => handleUpdateStatus(job.id, e.target.value as FactoryJobStatus)}
                          className={`text-[11px] font-semibold px-2 py-1 rounded-lg border focus:ring-1 focus:ring-[#00BDFF] focus:outline-none cursor-pointer ${statusInfo.badgeClass}`}
                        >
                          {(Object.keys(STATUS_CONFIG) as FactoryJobStatus[]).map((st) => (
                            <option key={st} value={st}>
                              {STATUS_CONFIG[st].label}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(
                                `Salam ${job.factory?.pic_name || 'Tuan'}, rujukan Job Sheet: ${job.job_number} (Pesanan ${job.order?.order_number || '-'}).`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-colors"
                              title="WhatsApp Kilang"
                            >
                              <FaWhatsapp className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => {
                              setSelectedJob(job);
                              setIsTechPackOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-[#00BDFF] hover:bg-sky-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                            title="Pratonton Tech Pack"
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

      {/* =========================================================================
          MODAL: JANA / KEMASKINI JOB SHEET
          ========================================================================= */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl border border-slate-100">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/60 sticky top-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold">
                  <Factory className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {jobFormData.id ? 'Kemaskini Job Sheet' : 'Jana Job Sheet Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Tugasan pengeluaran & kos kilang</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJobModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveJob} className="p-5 space-y-4 text-xs">
              {jobError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{jobError}</span>
                </div>
              )}

              {/* 1. Pilih Pesanan Pelanggan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Pesanan Pelanggan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={jobFormData.order_id}
                  onChange={(e) => handleOrderChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-medium"
                  required
                >
                  <option value="">-- Pilih Pesanan --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} — {o.customer_name || 'Pelanggan'} ({o.total_quantity} pcs - {formatCurrency(Number(o.total_amount))})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Pilih Kilang Sublimasi */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Kilang Sublimasi Rakan Kongsi <span className="text-rose-500">*</span>
                  </label>
                  <Link
                    href="/admin/factories"
                    className="text-[#00BDFF] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>Urus Kilang</span>
                  </Link>
                </div>
                <select
                  value={jobFormData.factory_id}
                  onChange={(e) => handleFactoryChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-medium"
                  required
                >
                  <option value="">-- Pilih Kilang --</option>
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.factory_name} (Std: RM {Number(f.default_unit_cost).toFixed(2)}/helai)
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Kos Seunit & Tarikh Sasaran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kadar Kos Seunit Kilang (RM) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="1"
                    value={jobFormData.cost_per_unit || ''}
                    onChange={(e) =>
                      setJobFormData({ ...jobFormData, cost_per_unit: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-bold text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tarikh Siap Sasaran Kilang <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={jobFormData.target_ready_date}
                    onChange={(e) => setJobFormData({ ...jobFormData, target_ready_date: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-medium"
                    required
                  />
                </div>
              </div>

              {/* 4. Live Margin Breakdown Card */}
              <div className="bg-sky-50/60 border border-sky-100 rounded-xl p-3 grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Jualan Pelanggan</span>
                  <span className="font-bold text-slate-900 text-xs">{formatCurrency(jobFormData.customer_price_total)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-amber-700 block uppercase">Jumlah Kos Kilang</span>
                  <span className="font-bold text-amber-700 text-xs">{formatCurrency(computedFactoryCost)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-700 block uppercase">Untung Kasar SVF</span>
                  <span className="font-bold text-emerald-600 text-xs">
                    {formatCurrency(computedGrossProfit)} ({computedGrossMargin.toFixed(1)}%)
                  </span>
                </div>
              </div>

              {/* 5. Spesifikasi Produksi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700">
                    Spesifikasi Produksi
                  </label>
                  <span className="text-[11px] font-semibold text-[#00BDFF] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
                    Formula Dinamik
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Kain</label>
                    <select
                      value={jobFormData.fabric_spec}
                      onChange={(e) => handleSpecFieldChange('fabric_spec', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none text-xs font-medium"
                    >
                      {fabrics.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                      {!fabrics.some((f) => f.name === jobFormData.fabric_spec) && (
                        <option value={jobFormData.fabric_spec}>{jobFormData.fabric_spec}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Potongan</label>
                    <select
                      value={jobFormData.cutting_spec}
                      onChange={(e) => handleSpecFieldChange('cutting_spec', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none text-xs font-medium"
                    >
                      {cuts.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                      {!cuts.some((c) => c.name === jobFormData.cutting_spec) && (
                        <option value={jobFormData.cutting_spec}>{jobFormData.cutting_spec}</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Kolar</label>
                    <select
                      value={jobFormData.collar_spec}
                      onChange={(e) => handleSpecFieldChange('collar_spec', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none text-xs font-medium"
                    >
                      {DEFAULT_COLLAR_LIST.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                      {!DEFAULT_COLLAR_LIST.includes(jobFormData.collar_spec) && (
                        <option value={jobFormData.collar_spec}>{jobFormData.collar_spec}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Formula Breakdown Live Pill */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="font-semibold text-slate-700">Kiraan:</span>
                    <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded-md font-mono">
                      Asas: RM {liveCostBreakdown.baseCost.toFixed(2)}
                    </span>
                    {liveCostBreakdown.fabricSurcharge > 0 && (
                      <span className="px-1.5 py-0.5 bg-sky-50 border border-sky-100 text-[#00BDFF] rounded-md font-mono">
                        +Kain: RM {liveCostBreakdown.fabricSurcharge.toFixed(2)}
                      </span>
                    )}
                    {liveCostBreakdown.cutSurcharge > 0 && (
                      <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-md font-mono">
                        +Potongan: RM {liveCostBreakdown.cutSurcharge.toFixed(2)}
                      </span>
                    )}
                    {liveCostBreakdown.collarSurcharge > 0 && (
                      <span className="px-1.5 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-md font-mono">
                        +Kolar: RM {liveCostBreakdown.collarSurcharge.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] font-bold text-slate-800">
                    Kadar Seunit: RM {liveCostBreakdown.finalUnitCost.toFixed(2)}/helai
                  </div>
                </div>
              </div>

              {/* 6. Pautan Fail Artwork HD */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pautan Fail Artwork HD / AI / PDF</label>
                <input
                  type="url"
                  value={jobFormData.artwork_hd_url}
                  onChange={(e) => setJobFormData({ ...jobFormData, artwork_hd_url: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-mono text-xs"
                  placeholder="https://drive.google.com/..."
                />
              </div>

              {/* 7. Nota Khas untuk Kilang */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nota Arahan untuk Kilang</label>
                <textarea
                  rows={2}
                  value={jobFormData.factory_notes}
                  onChange={(e) => setJobFormData({ ...jobFormData, factory_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                  placeholder="Catatan jahitan atau susunan khas..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsJobModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={jobSubmitting}
                  className="px-5 py-2 bg-[#00BDFF] hover:bg-[#00a6e0] text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {jobSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{jobFormData.id ? 'Simpan Kemaskini' : 'Jana Job Sheet'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TECH PACK / PRINT MODAL */}
      {isTechPackOpen && selectedJob && (
        <FactoryJobSheetModal
          job={selectedJob}
          isOpen={isTechPackOpen}
          onClose={() => setIsTechPackOpen(false)}
          onUpdateStatus={handleUpdateStatus}
        />
      )}
    </div>
  );
}

export default function FactoryJobsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#00BDFF] mb-2" />
          Memuatkan Job Sheet...
        </div>
      }
    >
      <FactoryJobsContent />
    </Suspense>
  );
}
