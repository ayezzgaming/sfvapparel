'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Edit2,
  Trash2,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  Layers,
  Shirt,
  Percent,
  SlidersHorizontal,
  ChevronRight,
  Calculator,
  Tag,
  FileText,
  Save,
  X
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useAppStore } from '@/lib/store/app-store';
import { PartnerFactory, FactoryPricingMatrix, FactoryTierDiscount } from '@/types/database';
import {
  getPartnerFactories,
  savePartnerFactory,
  deletePartnerFactory
} from '@/app/actions/factoryActions';
import { calculateFactoryUnitCost, DEFAULT_COLLAR_LIST } from '@/lib/factory-pricing-calculator';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

function FactoriesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fabrics, cuts } = useAppStore();

  // Tab State: 'directory' | 'pricing'
  const initialTab = searchParams.get('tab') === 'pricing' ? 'pricing' : 'directory';
  const [activeTab, setActiveTab] = useState<'directory' | 'pricing'>(initialTab);

  // Data States
  const [factories, setFactories] = useState<PartnerFactory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Factory Form Modal State (Create / Edit)
  const [isFactoryModalOpen, setIsFactoryModalOpen] = useState(false);
  const [factoryFormData, setFactoryFormData] = useState<{
    id?: string;
    factory_name: string;
    pic_name: string;
    phone: string;
    email: string;
    address: string;
    specialty: string;
    default_unit_cost: number;
    lead_time_days: number;
    notes: string;
    is_active: boolean;
  }>({
    factory_name: '',
    pic_name: '',
    phone: '',
    email: '',
    address: '',
    specialty: 'Full Sublimation All-in-One',
    default_unit_cost: 22.0,
    lead_time_days: 7,
    notes: '',
    is_active: true,
  });
  const [factorySubmitting, setFactorySubmitting] = useState(false);

  // Pricing Matrix Tab State
  const initialFactoryId = searchParams.get('factory_id') || '';
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>(initialFactoryId);
  const [currentMatrix, setCurrentMatrix] = useState<FactoryPricingMatrix>({
    base_unit_cost: 22.0,
    tier_discounts: [
      { min_qty: 10, max_qty: 29, unit_cost: 24.0 },
      { min_qty: 30, max_qty: 49, unit_cost: 22.0 },
      { min_qty: 50, max_qty: 99, unit_cost: 20.0 },
      { min_qty: 100, max_qty: null, unit_cost: 18.0 },
    ],
    fabric_surcharges: {},
    cut_surcharges: {},
    collar_surcharges: {},
  });
  const [matrixSubmitting, setMatrixSubmitting] = useState(false);

  // Pricing Simulator State
  const [simQty, setSimQty] = useState<number>(30);
  const [simFabric, setSimFabric] = useState<string>('');
  const [simCut, setSimCut] = useState<string>('');
  const [simCollar, setSimCollar] = useState<string>('');

  const loadData = async () => {
    try {
      const res = await getPartnerFactories();
      if (res.success && res.data) {
        setFactories(res.data);
        if (!selectedFactoryId && res.data.length > 0) {
          setSelectedFactoryId(res.data[0].id);
        }
      }
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

  // Sync selected factory data to matrix editor
  useEffect(() => {
    if (selectedFactoryId && factories.length > 0) {
      const target = factories.find((f) => f.id === selectedFactoryId);
      if (target) {
        const defaultTierList: FactoryTierDiscount[] = [
          { min_qty: 10, max_qty: 29, unit_cost: Number(target.default_unit_cost) + 2 },
          { min_qty: 30, max_qty: 49, unit_cost: Number(target.default_unit_cost) },
          { min_qty: 50, max_qty: 99, unit_cost: Math.max(0, Number(target.default_unit_cost) - 2) },
          { min_qty: 100, max_qty: null, unit_cost: Math.max(0, Number(target.default_unit_cost) - 4) },
        ];

        const initialFabricSurcharges: Record<string, number> = {};
        fabrics.forEach((f) => {
          initialFabricSurcharges[f.name] = target.pricing_matrix?.fabric_surcharges?.[f.name] ?? 0;
        });

        const initialCutSurcharges: Record<string, number> = {};
        cuts.forEach((c) => {
          initialCutSurcharges[c.name] = target.pricing_matrix?.cut_surcharges?.[c.name] ?? 0;
        });

        const initialCollarSurcharges: Record<string, number> = {};
        DEFAULT_COLLAR_LIST.forEach((col) => {
          initialCollarSurcharges[col] = target.pricing_matrix?.collar_surcharges?.[col] ?? (col.includes('Polo') ? 3 : col.includes('Mandarin') ? 4 : 0);
        });

        setCurrentMatrix({
          base_unit_cost: Number(target.pricing_matrix?.base_unit_cost) || Number(target.default_unit_cost) || 22.0,
          tier_discounts: target.pricing_matrix?.tier_discounts?.length ? target.pricing_matrix.tier_discounts : defaultTierList,
          fabric_surcharges: { ...initialFabricSurcharges, ...(target.pricing_matrix?.fabric_surcharges || {}) },
          cut_surcharges: { ...initialCutSurcharges, ...(target.pricing_matrix?.cut_surcharges || {}) },
          collar_surcharges: { ...initialCollarSurcharges, ...(target.pricing_matrix?.collar_surcharges || {}) },
        });

        if (!simFabric && fabrics.length > 0) setSimFabric(fabrics[0].name);
        if (!simCut && cuts.length > 0) setSimCut(cuts[0].name);
        if (!simCollar) setSimCollar(DEFAULT_COLLAR_LIST[0]);
      }
    }
  }, [selectedFactoryId, factories, fabrics, cuts]);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  // Open Create Factory Modal
  const handleOpenCreateModal = () => {
    setFactoryFormData({
      factory_name: '',
      pic_name: '',
      phone: '',
      email: '',
      address: '',
      specialty: 'Full Sublimation All-in-One',
      default_unit_cost: 22.0,
      lead_time_days: 7,
      notes: '',
      is_active: true,
    });
    setIsFactoryModalOpen(true);
  };

  // Open Edit Factory Modal
  const handleOpenEditModal = (factory: PartnerFactory) => {
    setFactoryFormData({
      id: factory.id,
      factory_name: factory.factory_name,
      pic_name: factory.pic_name || '',
      phone: factory.phone || '',
      email: factory.email || '',
      address: factory.address || '',
      specialty: factory.specialty || 'Full Sublimation All-in-One',
      default_unit_cost: Number(factory.default_unit_cost) || 22.0,
      lead_time_days: Number(factory.lead_time_days) || 7,
      notes: factory.notes || '',
      is_active: factory.is_active ?? true,
    });
    setIsFactoryModalOpen(true);
  };

  // Save Factory Action
  const handleSaveFactory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factoryFormData.factory_name.trim()) {
      showToast('error', 'Sila masukkan nama kilang.');
      return;
    }

    setFactorySubmitting(true);
    try {
      const res = await savePartnerFactory(factoryFormData);
      if (res.success) {
        showToast('success', factoryFormData.id ? 'Maklumat kilang berjaya dikemaskini.' : 'Kilang baharu berjaya didaftarkan.');
        setIsFactoryModalOpen(false);
        await loadData();
      } else {
        showToast('error', res.message || 'Gagal menyimpan maklumat kilang.');
      }
    } catch {
      showToast('error', 'Ralat sambungan.');
    } finally {
      setFactorySubmitting(false);
    }
  };

  // Delete Factory Action
  const handleDeleteFactory = async (id: string, name: string) => {
    if (!confirm(`Padam kilang rakan kongsi "${name}"?`)) return;
    try {
      const res = await deletePartnerFactory(id);
      if (res.success) {
        showToast('success', 'Kilang berjaya dipadam.');
        await loadData();
      } else {
        showToast('error', res.message || 'Gagal memadam kilang.');
      }
    } catch {
      showToast('error', 'Ralat sambungan.');
    }
  };

  // Save Pricing Matrix
  const handleSaveMatrix = async () => {
    if (!selectedFactoryId) return;
    const target = factories.find((f) => f.id === selectedFactoryId);
    if (!target) return;

    setMatrixSubmitting(true);
    try {
      const payload: Partial<PartnerFactory> = {
        id: selectedFactoryId,
        factory_name: target.factory_name,
        default_unit_cost: Number(currentMatrix.base_unit_cost) || 22.0,
        pricing_matrix: currentMatrix,
      };

      const res = await savePartnerFactory(payload);
      if (res.success) {
        showToast('success', `Matriks harga untuk ${target.factory_name} berjaya disimpan.`);
        await loadData();
      } else {
        showToast('error', res.message || 'Gagal menyimpan matriks harga.');
      }
    } catch {
      showToast('error', 'Ralat sambungan.');
    } finally {
      setMatrixSubmitting(false);
    }
  };

  // Active Factory for Pricing Matrix
  const activeFactory = useMemo(() => {
    return factories.find((f) => f.id === selectedFactoryId);
  }, [factories, selectedFactoryId]);

  // Live Simulation Calculation
  const simCalculated = useMemo(() => {
    const mockFactory: PartnerFactory = {
      id: selectedFactoryId,
      factory_name: activeFactory?.factory_name || 'Kilang',
      phone: activeFactory?.phone || '',
      lead_time_days: activeFactory?.lead_time_days || 7,
      default_unit_cost: currentMatrix.base_unit_cost,
      pricing_matrix: currentMatrix,
      is_active: true,
      created_at: '',
      updated_at: '',
    };
    return calculateFactoryUnitCost(mockFactory, simQty, simFabric, simCut, simCollar);
  }, [selectedFactoryId, activeFactory, currentMatrix, simQty, simFabric, simCut, simCollar]);

  // Filtered factories list
  const filteredFactories = useMemo(() => {
    if (!searchQuery.trim()) return factories;
    const q = searchQuery.toLowerCase();
    return factories.filter(
      (f) =>
        f.factory_name.toLowerCase().includes(q) ||
        (f.pic_name && f.pic_name.toLowerCase().includes(q)) ||
        (f.phone && f.phone.includes(q)) ||
        (f.address && f.address.toLowerCase().includes(q))
    );
  }, [factories, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-lg flex items-center gap-2.5 text-xs font-semibold ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin/factory-jobs" className="hover:text-[#00BDFF] transition-colors">
              Produksi Kilang
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-800 font-medium">Pengurusan Kilang</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Pengurusan Kilang</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Pusat kawalan rakan kongsi pengeluaran, direktori kilang dan penetapan matriks harga.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Muat Semula Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kilang</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'bg-[#00BDFF] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Direktori Kilang ({factories.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'pricing'
              ? 'bg-[#00BDFF] text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Matriks Harga Dinamik Kilang</span>
        </button>
      </div>

      {/* TAB 1: DIREKTORI KILANG */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama kilang, PIC atau lokasi..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00BDFF] focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium px-2">
              Jumlah Kilang: <span className="font-bold text-[#00BDFF] text-sm">{filteredFactories.length}</span> rakan kongsi
            </div>
          </div>

          {/* Factories List Cards */}
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <RefreshCw className="w-6 h-6 animate-spin text-[#00BDFF] mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuatkan direktori kilang...</p>
            </div>
          ) : filteredFactories.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Tiada Kilang Dijumpai</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {searchQuery ? 'Tiada kilang sepadan dengan carian anda.' : 'Daftarkan kilang rakan kongsi pengeluaran cetak & jahit pertama anda.'}
              </p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kilang Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFactories.map((factory) => (
                <div
                  key={factory.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-[#00BDFF]/50 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3.5">
                    {/* Card Top: Factory Name & Status Badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="space-y-0.5">
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{factory.factory_name}</h3>
                        <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0"></span>
                          <span>{factory.specialty || 'Full Sublimation All-in-One'}</span>
                        </p>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${
                          factory.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}
                      >
                        {factory.is_active ? '● Aktif' : '○ Tidak Aktif'}
                      </span>
                    </div>

                    {/* Card Details Pill */}
                    <div className="space-y-2 text-xs bg-slate-50/80 p-3.5 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          Kadar Standard:
                        </span>
                        <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                          {formatCurrency(Number(factory.default_unit_cost) || 22)}/helai
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          Tempoh Siap:
                        </span>
                        <span className="font-semibold text-slate-800">
                          {factory.lead_time_days || 7} Hari Bekerja
                        </span>
                      </div>

                      {factory.pic_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            PIC Kilang:
                          </span>
                          <span className="font-medium text-slate-800 truncate max-w-[150px] text-right">
                            {factory.pic_name}
                          </span>
                        </div>
                      )}

                      {factory.address && (
                        <div className="text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/60 truncate flex items-center gap-1" title={factory.address}>
                          <span className="shrink-0 text-slate-400">📍</span>
                          <span className="truncate">{factory.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs gap-2">
                    <div className="flex items-center gap-1.5">
                      {factory.phone && (
                        <a
                          href={`https://wa.me/${factory.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 font-semibold transition-colors"
                          title="Hubungi WhatsApp Kilang"
                        >
                          <FaWhatsapp className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-[11px]">Chat</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFactoryId(factory.id);
                          setActiveTab('pricing');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-xl border border-sky-200 font-semibold transition-colors cursor-pointer"
                        title="Tetapkan Matriks Harga"
                      >
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#00BDFF]" />
                        <span className="text-[11px]">Matriks Harga</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(factory)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                        title="Kemaskini Profil Kilang"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteFactory(factory.id, factory.factory_name)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                        title="Padam Kilang"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MATRIKS HARGA DINAMIK KILANG */}
      {activeTab === 'pricing' && (
        <div className="space-y-6">
          {/* Factory Selector Header */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  Pilih Kilang Rakan Kongsi
                </label>
                <select
                  value={selectedFactoryId}
                  onChange={(e) => setSelectedFactoryId(e.target.value)}
                  className="mt-0.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                >
                  {factories.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.factory_name} (Std: RM {Number(f.default_unit_cost).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveMatrix}
              disabled={matrixSubmitting || !selectedFactoryId}
              className="inline-flex items-center gap-2 px-5 py-2 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {matrixSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Simpan Matriks Harga</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Matrix Editor */}
            <div className="lg:col-span-2 space-y-6">
              {/* 1. Base Cost & Quantity Tiers */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Percent className="w-4 h-4 text-[#00BDFF]" />
                    <span>1. Kadar Kos Asas & Diskaun Tier Kuantiti</span>
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kadar Asas Lalai (RM/helai)
                    </label>
                    <input
                      type="number"
                      step="0.50"
                      min="1"
                      value={currentMatrix.base_unit_cost}
                      onChange={(e) =>
                        setCurrentMatrix({
                          ...currentMatrix,
                          base_unit_cost: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Diskaun Mengikut Kuantiti Pesanan</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentMatrix.tier_discounts?.map((tier, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-slate-700">
                          {tier.min_qty} - {tier.max_qty ? `${tier.max_qty} pcs` : 'ke atas'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400">RM</span>
                          <input
                            type="number"
                            step="0.50"
                            value={tier.unit_cost}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...(currentMatrix.tier_discounts || [])];
                              updated[idx] = { ...updated[idx], unit_cost: val };
                              setCurrentMatrix({ ...currentMatrix, tier_discounts: updated });
                            }}
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right focus:ring-1 focus:ring-[#00BDFF] focus:outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. Fabric Surcharges (Synchronized with Master Formula) */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00BDFF]" />
                    <span>2. Surcaj Jenis Kain (Diselaraskan dari Master Formula)</span>
                  </h3>
                  <span className="text-[10px] font-semibold bg-sky-50 text-[#00BDFF] px-2 py-0.5 rounded-full border border-sky-100">
                    {fabrics.length} Jenis Kain
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {fabrics.map((fabric) => {
                    const currentVal = currentMatrix.fabric_surcharges?.[fabric.name] ?? 0;
                    return (
                      <div
                        key={fabric.id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="truncate">
                          <span className="font-semibold text-slate-800 block truncate">{fabric.name}</span>
                          <span className="text-[10px] text-slate-400">{fabric.weight_gsm}gsm • Std: RM {Number(fabric.sublimation_base_price).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-slate-400">+RM</span>
                          <input
                            type="number"
                            step="0.50"
                            value={currentVal}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              setCurrentMatrix({
                                ...currentMatrix,
                                fabric_surcharges: {
                                  ...(currentMatrix.fabric_surcharges || {}),
                                  [fabric.name]: val,
                                },
                              });
                            }}
                            className="w-18 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right focus:ring-1 focus:ring-[#00BDFF] focus:outline-none"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. Cut & Collar Surcharges */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Shirt className="w-4 h-4 text-[#00BDFF]" />
                    <span>3. Surcaj Jenis Potongan & Kolar</span>
                  </h3>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Jenis Potongan (Cuts)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {cuts.map((cut) => {
                        const currentVal = currentMatrix.cut_surcharges?.[cut.name] ?? 0;
                        return (
                          <div
                            key={cut.id}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-semibold text-slate-800 truncate">{cut.name}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-slate-400">+RM</span>
                              <input
                                type="number"
                                step="0.50"
                                value={currentVal}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCurrentMatrix({
                                    ...currentMatrix,
                                    cut_surcharges: {
                                      ...(currentMatrix.cut_surcharges || {}),
                                      [cut.name]: val,
                                    },
                                  });
                                }}
                                className="w-18 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right focus:ring-1 focus:ring-[#00BDFF] focus:outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">Jenis Kolar (Collars)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {DEFAULT_COLLAR_LIST.map((collar) => {
                        const currentVal = currentMatrix.collar_surcharges?.[collar] ?? 0;
                        return (
                          <div
                            key={collar}
                            className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="font-semibold text-slate-800 truncate">{collar}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className="text-slate-400">+RM</span>
                              <input
                                type="number"
                                step="0.50"
                                value={currentVal}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setCurrentMatrix({
                                    ...currentMatrix,
                                    collar_surcharges: {
                                      ...(currentMatrix.collar_surcharges || {}),
                                      [collar]: val,
                                    },
                                  });
                                }}
                                className="w-18 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right focus:ring-1 focus:ring-[#00BDFF] focus:outline-none"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Live Simulator */}
            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 sticky top-6 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-[#00BDFF]" />
                    <span>Ujian Kos Kilang Semasa</span>
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kuantiti Pesanan</label>
                    <input
                      type="number"
                      min="1"
                      value={simQty}
                      onChange={(e) => setSimQty(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenis Kain</label>
                    <select
                      value={simFabric}
                      onChange={(e) => setSimFabric(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                    >
                      {fabrics.map((f) => (
                        <option key={f.id} value={f.name}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenis Potongan</label>
                    <select
                      value={simCut}
                      onChange={(e) => setSimCut(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                    >
                      {cuts.map((c) => (
                        <option key={c.id} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Jenis Kolar</label>
                    <select
                      value={simCollar}
                      onChange={(e) => setSimCollar(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                    >
                      {DEFAULT_COLLAR_LIST.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Simulator Breakdown */}
                <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Kos Asas {simCalculated.tierApplied ? `(${simCalculated.tierApplied})` : ''}:</span>
                    <span className="font-semibold text-slate-900">RM {simCalculated.baseCost.toFixed(2)}</span>
                  </div>
                  {simCalculated.fabricSurcharge > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Surcaj Kain:</span>
                      <span className="font-semibold text-[#00BDFF]">+RM {simCalculated.fabricSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  {simCalculated.cutSurcharge > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Surcaj Potongan:</span>
                      <span className="font-semibold text-amber-700">+RM {simCalculated.cutSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  {simCalculated.collarSurcharge > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Surcaj Kolar:</span>
                      <span className="font-semibold text-purple-700">+RM {simCalculated.collarSurcharge.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-sky-200/80 flex justify-between items-center">
                    <span className="font-bold text-slate-800">Kos Kilang Seunit:</span>
                    <span className="font-bold text-base text-[#00BDFF]">
                      RM {simCalculated.finalUnitCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Jumlah Kos ({simQty} pcs):</span>
                    <span className="font-bold text-slate-800">{formatCurrency(simCalculated.totalCost)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveMatrix}
                  disabled={matrixSubmitting || !selectedFactoryId}
                  className="w-full py-2.5 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {matrixSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Simpan Matriks</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DAFTAR / KEMASKINI KILANG (SPACIOUS & CLEAN) */}
      {isFactoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-100 text-[#00BDFF] flex items-center justify-center font-bold shadow-2xs">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {factoryFormData.id ? 'Kemaskini Maklumat Kilang' : 'Daftar Kilang Rakan Kongsi'}
                  </h3>
                  <p className="text-xs text-slate-500">Direktori pengeluaran cetak & jahit sublimasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFactoryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveFactory} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Factory Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Kilang / Syarikat <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={factoryFormData.factory_name}
                    onChange={(e) => setFactoryFormData({ ...factoryFormData, factory_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#00BDFF] focus:outline-none transition-all"
                    placeholder="Cth: Kilang Sublimasi Teguh Sdn Bhd"
                    required
                  />
                </div>

                {/* Specialty */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kepakaran / Fokus Pengeluaran
                  </label>
                  <select
                    value={factoryFormData.specialty}
                    onChange={(e) => setFactoryFormData({ ...factoryFormData, specialty: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-[#00BDFF] focus:outline-none transition-all"
                  >
                    <option value="Full Sublimation All-in-One (Cetak + Potong + Jahit)">Full Sublimation All-in-One (Cetak + Potong + Jahit)</option>
                    <option value="Full Sublimation & Muslimah Cut">Full Sublimation & Potongan Muslimah</option>
                    <option value="Jersi Sukan & Polo Collar Specialist">Jersi Sukan & Kolar Polo</option>
                    <option value="Cetakan DTF & Silkscreen">Cetakan DTF & Silkscreen</option>
                    <option value="Jahitan Pukal Pantas (Express Mass Production)">Jahitan Pukal Pantas (Express Mass Production)</option>
                  </select>
                </div>

                {/* PIC Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama PIC / Pengurus Kilang</label>
                  <input
                    type="text"
                    value={factoryFormData.pic_name}
                    onChange={(e) => setFactoryFormData({ ...factoryFormData, pic_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#00BDFF] focus:outline-none transition-all"
                    placeholder="Cth: En. Azman (Pengurus)"
                  />
                </div>

                {/* Phone / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    No. Telefon / WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={factoryFormData.phone}
                    onChange={(e) => setFactoryFormData({ ...factoryFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#00BDFF] focus:outline-none transition-all font-mono"
                    placeholder="Cth: 60123456789"
                    required
                  />
                </div>

                {/* Standard Unit Cost */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Kadar Kos Standard (RM/helai)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">RM</span>
                    <input
                      type="number"
                      step="0.50"
                      min="1"
                      value={factoryFormData.default_unit_cost}
                      onChange={(e) =>
                        setFactoryFormData({ ...factoryFormData, default_unit_cost: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#00BDFF] focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Lead Time Days */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tempoh Siap (Hari Bekerja)</label>
                  <input
                    type="number"
                    min="1"
                    value={factoryFormData.lead_time_days}
                    onChange={(e) =>
                      setFactoryFormData({ ...factoryFormData, lead_time_days: parseInt(e.target.value) || 7 })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#00BDFF] focus:outline-none transition-all"
                  />
                </div>

                {/* Status Toggle */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Kilang</label>
                  <div className="flex items-center gap-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_active"
                        checked={factoryFormData.is_active === true}
                        onChange={() => setFactoryFormData({ ...factoryFormData, is_active: true })}
                        className="text-[#00BDFF] focus:ring-[#00BDFF]"
                      />
                      <span className="font-semibold text-emerald-700">● Aktif (Boleh Terima Job)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="is_active"
                        checked={factoryFormData.is_active === false}
                        onChange={() => setFactoryFormData({ ...factoryFormData, is_active: false })}
                        className="text-slate-400 focus:ring-slate-400"
                      />
                      <span className="font-semibold text-slate-500">○ Tidak Aktif (Rehat)</span>
                    </label>
                  </div>
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Alamat / Lokasi Kilang</label>
                  <input
                    type="text"
                    value={factoryFormData.address}
                    onChange={(e) => setFactoryFormData({ ...factoryFormData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#00BDFF] focus:outline-none transition-all"
                    placeholder="Cth: Shah Alam, Selangor"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Catatan / Terma Kilang</label>
                  <textarea
                    rows={2}
                    value={factoryFormData.notes}
                    onChange={(e) => setFactoryFormData({ ...factoryFormData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-[#00BDFF] focus:outline-none transition-all"
                    placeholder="Cth: Kilang rakan kongsi utama untuk jersi interlock & polo"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFactoryModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={factorySubmitting}
                  className="px-6 py-2.5 bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {factorySubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>{factoryFormData.id ? 'Simpan Kemaskini' : 'Daftar Kilang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminFactoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto text-[#00BDFF] mb-2" />
          Memuatkan pengurusan kilang...
        </div>
      }
    >
      <FactoriesContent />
    </Suspense>
  );
}
