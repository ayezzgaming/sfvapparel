'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
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
  X,
  Layers,
  Shirt,
  DollarSign,
  Percent,
  SlidersHorizontal,
  ChevronRight,
  Calculator,
  Tag
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import {
  PartnerFactory,
  FactoryPricingMatrix,
  FactoryTierDiscount
} from '@/types/database';
import {
  getPartnerFactories,
  savePartnerFactory,
  deletePartnerFactory,
} from '@/app/actions/factoryActions';
import { calculateFactoryUnitCost } from '@/lib/factory-pricing-calculator';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

const DEFAULT_FABRIC_LIST = [
  'Microfiber Eyelet 160gsm',
  'Microfiber Interlock 180gsm',
  'Microfiber Honeycomb',
  'Microfiber Jacquard',
];

const DEFAULT_CUT_LIST = [
  'Regular Fit (Lengan Pendek)',
  'Lengan Panjang (Long Sleeve)',
  'Potongan Muslimah',
  'Tanpa Lengan (Sleeveless)',
];

const DEFAULT_COLLAR_LIST = [
  'Round Neck Rib',
  'V-Neck Rib',
  'Collar Polo Berbutang',
  'Kolar Mandarin / Zip',
];

export default function AdminFactoriesPage() {
  const [factories, setFactories] = useState<PartnerFactory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Simulator state
  const [selectedSimFactoryId, setSelectedSimFactoryId] = useState<string>('');
  const [simQty, setSimQty] = useState(30);
  const [simFabric, setSimFabric] = useState('Microfiber Eyelet 160gsm');
  const [simCut, setSimCut] = useState('Regular Fit (Lengan Pendek)');
  const [simCollar, setSimCollar] = useState('Round Neck Rib');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'profile' | 'rates'>('profile');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<{
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
    pricing_matrix: FactoryPricingMatrix;
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
    pricing_matrix: {
      base_unit_cost: 22.0,
      tier_discounts: [
        { min_qty: 10, max_qty: 29, unit_cost: 24.0 },
        { min_qty: 30, max_qty: 49, unit_cost: 22.0 },
        { min_qty: 50, max_qty: 99, unit_cost: 20.0 },
        { min_qty: 100, max_qty: null, unit_cost: 18.0 },
      ],
      fabric_surcharges: {
        'Interlock': 2.0,
        'Honeycomb': 2.0,
        'Jacquard': 3.0,
      },
      cut_surcharges: {
        'Lengan Panjang': 3.0,
        'Muslimah': 5.0,
        'Sleeveless': -2.0,
      },
      collar_surcharges: {
        'Polo': 3.0,
        'Mandarin': 3.0,
        'Zip': 4.0,
      },
    },
  });

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getPartnerFactories();
      if (res.success) {
        setFactories(res.data || []);
        if (res.data && res.data.length > 0 && !selectedSimFactoryId) {
          setSelectedSimFactoryId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setFormData({
      id: undefined,
      factory_name: '',
      pic_name: '',
      phone: '',
      email: '',
      address: '',
      specialty: 'Full Sublimation All-in-One',
      default_unit_cost: 22.0,
      lead_time_days: 7,
      notes: '',
      pricing_matrix: {
        base_unit_cost: 22.0,
        tier_discounts: [
          { min_qty: 10, max_qty: 29, unit_cost: 24.0 },
          { min_qty: 30, max_qty: 49, unit_cost: 22.0 },
          { min_qty: 50, max_qty: 99, unit_cost: 20.0 },
          { min_qty: 100, max_qty: null, unit_cost: 18.0 },
        ],
        fabric_surcharges: {
          'Interlock': 2.0,
          'Honeycomb': 2.0,
          'Jacquard': 3.0,
        },
        cut_surcharges: {
          'Lengan Panjang': 3.0,
          'Muslimah': 5.0,
          'Sleeveless': -2.0,
        },
        collar_surcharges: {
          'Polo': 3.0,
          'Mandarin': 3.0,
          'Zip': 4.0,
        },
      },
    });
    setModalTab('profile');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (fac: PartnerFactory) => {
    setFormData({
      id: fac.id,
      factory_name: fac.factory_name,
      pic_name: fac.pic_name || '',
      phone: fac.phone || '',
      email: fac.email || '',
      address: fac.address || '',
      specialty: fac.specialty || 'Full Sublimation All-in-One',
      default_unit_cost: Number(fac.default_unit_cost) || 22.0,
      lead_time_days: Number(fac.lead_time_days) || 7,
      notes: fac.notes || '',
      pricing_matrix: fac.pricing_matrix || {
        base_unit_cost: Number(fac.default_unit_cost) || 22.0,
        tier_discounts: [
          { min_qty: 10, max_qty: 29, unit_cost: 24.0 },
          { min_qty: 30, max_qty: 49, unit_cost: 22.0 },
          { min_qty: 50, max_qty: 99, unit_cost: 20.0 },
          { min_qty: 100, max_qty: null, unit_cost: 18.0 },
        ],
        fabric_surcharges: {},
        cut_surcharges: {},
        collar_surcharges: {},
      },
    });
    setModalTab('profile');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.factory_name.trim()) {
      setFormError('Sila masukkan nama kilang.');
      return;
    }
    if (!formData.phone.trim()) {
      setFormError('Sila masukkan nombor telefon kilang.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const res = await savePartnerFactory({
        ...formData,
        default_unit_cost: formData.pricing_matrix.base_unit_cost || formData.default_unit_cost,
      });

      if (res.success) {
        setIsModalOpen(false);
        await loadData(true);
      } else {
        setFormError(res.message || 'Gagal menyimpan kilang.');
      }
    } catch {
      setFormError('Ralat sambungan pelayan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Padam rekod kilang "${name}" dari sistem?`)) return;
    try {
      const res = await deletePartnerFactory(id);
      if (res.success) {
        await loadData(true);
      } else {
        alert(res.message || 'Gagal memadam.');
      }
    } catch {
      alert('Ralat sambungan.');
    }
  };

  const filteredFactories = useMemo(() => {
    if (!searchQuery.trim()) return factories;
    const q = searchQuery.toLowerCase();
    return factories.filter(
      (f) =>
        f.factory_name.toLowerCase().includes(q) ||
        f.pic_name?.toLowerCase().includes(q) ||
        f.specialty?.toLowerCase().includes(q) ||
        f.address?.toLowerCase().includes(q)
    );
  }, [factories, searchQuery]);

  // Simulator calculation
  const simFactory = factories.find((f) => f.id === selectedSimFactoryId) || factories[0];
  const simResult = useMemo(() => {
    return calculateFactoryUnitCost(simFactory, simQty, simFabric, simCut, simCollar);
  }, [simFactory, simQty, simFabric, simCut, simCollar]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengurusan Kilang & Kadar Formula Kos</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-[#00BDFF] border border-sky-200">
              {factories.length} Kilang Rakan Kongsi
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasikan direktori kilang sublimasi All-in-One, kadar kos asas, jadual diskaun kuantiti, dan caj variasi potongan & kain.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/factory-jobs"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-[#00BDFF] text-xs font-semibold text-slate-700 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Layers className="w-4 h-4 text-[#00BDFF]" />
            <span>Buka Job Sheet Produksi</span>
          </Link>

          <button
            onClick={() => loadData(true)}
            disabled={refreshing || loading}
            title="Muat semula data"
            className="p-2 text-slate-500 hover:text-[#00BDFF] hover:bg-sky-50 rounded-xl border border-slate-200 transition-colors bg-white shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-[#00BDFF]' : ''}`} />
          </button>

          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kilang Baru</span>
          </button>
        </div>
      </div>

      {/* Simulator Section: Ujian Pengiraan Kos Kilang Masa-Nyata */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Simulator Pengiraan Kos Kilang Otomatik</h2>
              <p className="text-xs text-slate-500">Uji formula kos cetak & jahit yang dijana daripada matriks kadar kilang pilihan.</p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">Formula Dinamik</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          {/* Pilih Kilang */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pilih Kilang</label>
            <select
              value={selectedSimFactoryId}
              onChange={(e) => setSelectedSimFactoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
            >
              {factories.map((f) => (
                <option key={f.id} value={f.id}>{f.factory_name}</option>
              ))}
            </select>
          </div>

          {/* Kuantiti */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Kuantiti (Helai)</label>
            <input
              type="number"
              min="1"
              value={simQty}
              onChange={(e) => setSimQty(parseInt(e.target.value, 10) || 1)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-bold"
            />
          </div>

          {/* Jenis Kain */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Kain</label>
            <select
              value={simFabric}
              onChange={(e) => setSimFabric(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
            >
              {DEFAULT_FABRIC_LIST.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          {/* Potongan */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Potongan</label>
            <select
              value={simCut}
              onChange={(e) => setSimCut(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
            >
              {DEFAULT_CUT_LIST.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Kolar */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Jenis Kolar</label>
            <select
              value={simCollar}
              onChange={(e) => setSimCollar(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
            >
              {DEFAULT_COLLAR_LIST.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Hasil Simulator */}
        <div className="mt-4 p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-700">
            <span>Kadar Asas: <b>RM {simResult.baseCost.toFixed(2)}</b></span>
            {simResult.tierApplied && <span className="px-2 py-0.5 bg-sky-100 text-[#00BDFF] rounded font-bold">Tier {simResult.tierApplied}</span>}
            {simResult.fabricSurcharge > 0 && <span>Caj Kain: <b>+RM {simResult.fabricSurcharge.toFixed(2)}</b></span>}
            {simResult.cutSurcharge !== 0 && <span>Caj Potongan: <b>{simResult.cutSurcharge > 0 ? '+' : ''}RM {simResult.cutSurcharge.toFixed(2)}</b></span>}
            {simResult.collarSurcharge > 0 && <span>Caj Kolar: <b>+RM {simResult.collarSurcharge.toFixed(2)}</b></span>}
          </div>

          <div className="flex items-center gap-4 text-right">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase">Kos Seunit Terhitung</span>
              <span className="text-base font-bold text-[#00BDFF]">RM {simResult.finalUnitCost.toFixed(2)} / helai</span>
            </div>
            <div className="pl-4 border-l border-sky-200">
              <span className="text-[10px] text-slate-400 block uppercase">Jumlah Kos ({simQty} Helai)</span>
              <span className="text-base font-bold text-amber-700">{formatCurrency(simResult.totalCost)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Factories List Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-700">
          Senarai Kilang Sublimasi Rakan Kongsi ({filteredFactories.length})
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama kilang, PIC, kepakaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00BDFF] focus:border-transparent transition-all shadow-xs"
          />
        </div>
      </div>

      {/* Factories Grid Cards */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin text-[#00BDFF] mx-auto mb-2" />
          <p className="text-xs">Memuatkan direktori kilang...</p>
        </div>
      ) : filteredFactories.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200/80 p-8">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">Tiada Kilang Rakan Kongsi Dijumpai</h3>
          <p className="text-xs text-slate-500 mt-1">Gunakan butang di atas untuk mendaftarkan kilang sublimasi baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFactories.map((fac) => {
            const matrix = fac.pricing_matrix;
            const baseRate = Number(matrix?.base_unit_cost) || Number(fac.default_unit_cost) || 22.0;

            return (
              <div
                key={fac.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-[#00BDFF]/60 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm leading-snug">{fac.factory_name}</h3>
                        <span className="text-[11px] text-slate-500 block">{fac.specialty || 'Full Sublimation All-in-One'}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                      RM {baseRate.toFixed(2)}/helai
                    </span>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 space-y-1 text-xs text-slate-600 bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">PIC Kilang:</span>
                      <span className="font-medium text-slate-900">{fac.pic_name || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">No. Telefon:</span>
                      <span className="font-mono font-medium text-slate-900">{fac.phone || '-'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Lead Time:</span>
                      <span className="font-medium text-slate-900">{fac.lead_time_days || 7} Hari Bekerja</span>
                    </div>
                  </div>

                  {/* Pricing Matrix Summary */}
                  <div className="mt-3 space-y-2 text-xs">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Matriks Kadar Kos Kilang:
                    </span>

                    {/* Tier Discounts Pills */}
                    {matrix?.tier_discounts && matrix.tier_discounts.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 block">Kadar Mengikut Kuantiti:</span>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          {matrix.tier_discounts.map((t, idx) => (
                            <div key={idx} className="p-1.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between">
                              <span className="text-slate-600">{t.min_qty}{t.max_qty ? `-${t.max_qty}` : '+'} pcs</span>
                              <span className="font-bold text-[#00BDFF]">RM {Number(t.unit_cost).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Surcharges badges */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {Object.entries(matrix?.fabric_surcharges || {}).map(([k, v]) => (
                        <span key={k} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {k}: +RM {Number(v).toFixed(2)}
                        </span>
                      ))}
                      {Object.entries(matrix?.cut_surcharges || {}).map(([k, v]) => (
                        <span key={k} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {k}: {Number(v) > 0 ? '+' : ''}RM {Number(v).toFixed(2)}
                        </span>
                      ))}
                      {Object.entries(matrix?.collar_surcharges || {}).map(([k, v]) => (
                        <span key={k} className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                          {k}: +RM {Number(v).toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                  <a
                    href={`https://wa.me/${fac.phone?.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    <FaWhatsapp className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(fac)}
                      className="p-1.5 text-slate-400 hover:text-[#00BDFF] rounded-lg transition-colors cursor-pointer"
                      title="Edit Maklumat & Matriks Harga"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(fac.id, fac.factory_name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Padam Kilang"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =========================================================================
          MODAL: TAMBAH / KEMASKINI KILANG & MATRIKS FORMULA KOS
          ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {formData.id ? 'Kemaskini Kilang & Matriks Kos' : 'Daftar Kilang Rakan Kongsi Baru'}
                  </h3>
                  <p className="text-xs text-slate-500">Tetapan profil kilang dan formula harga kos All-in-One.</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setModalTab('profile')}
                className={`pb-2.5 font-semibold transition-colors cursor-pointer border-b-2 ${
                  modalTab === 'profile'
                    ? 'border-[#00BDFF] text-[#00BDFF]'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                1. Profil & Kontak Kilang
              </button>
              <button
                type="button"
                onClick={() => setModalTab('rates')}
                className={`pb-2.5 font-semibold transition-colors cursor-pointer border-b-2 ${
                  modalTab === 'rates'
                    ? 'border-[#00BDFF] text-[#00BDFF]'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                2. Matriks Formula Kos (Rate Card)
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* TAB 1: PROFIL KILANG */}
              {modalTab === 'profile' && (
                <div className="space-y-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Kilang / Syarikat <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.factory_name}
                      onChange={(e) => setFormData({ ...formData, factory_name: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-medium"
                      placeholder="Cth: Kilang Sublimasi Utama Selangor"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Nama PIC Kilang</label>
                      <input
                        type="text"
                        value={formData.pic_name}
                        onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                        placeholder="Cth: En. Rizal (Manager)"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        No. Telefon / WhatsApp <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-mono"
                        placeholder="Cth: 60123456789"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Kepakaran / Specialty</label>
                      <input
                        type="text"
                        value={formData.specialty}
                        onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                        placeholder="Cth: Full Sublimation All-in-One"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Lead Time (Hari Bekerja)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.lead_time_days}
                        onChange={(e) =>
                          setFormData({ ...formData, lead_time_days: parseInt(e.target.value, 10) || 7 })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Alamat Premis Kilang</label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                      placeholder="Alamat pengambilan & penghantaran jersi..."
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: MATRIKS FORMULA KOS (RATE CARD) */}
              {modalTab === 'rates' && (
                <div className="space-y-4">
                  {/* Kadar Asas */}
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <label className="block font-bold text-slate-900 mb-1">
                      Kadar Asas Cetak + Jahit Standard (RM / Helai) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      min="1"
                      value={formData.pricing_matrix.base_unit_cost || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          pricing_matrix: {
                            ...formData.pricing_matrix,
                            base_unit_cost: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-bold text-slate-900 text-sm"
                      required
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Kadar asas untuk jersi round neck / v-neck standard microfiber eyelet.
                    </span>
                  </div>

                  {/* Tier QTY Discounts */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">Jadual Diskaun Kuantiti Pukal Kilang (Tier Qty)</span>
                      <button
                        type="button"
                        onClick={() => {
                          const lastTier = formData.pricing_matrix.tier_discounts[formData.pricing_matrix.tier_discounts.length - 1];
                          const newMin = lastTier ? (lastTier.max_qty ? lastTier.max_qty + 1 : 100) : 10;
                          setFormData({
                            ...formData,
                            pricing_matrix: {
                              ...formData.pricing_matrix,
                              tier_discounts: [
                                ...formData.pricing_matrix.tier_discounts,
                                { min_qty: newMin, max_qty: newMin + 20, unit_cost: 20.0 },
                              ],
                            },
                          });
                        }}
                        className="text-[#00BDFF] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah Tier</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {formData.pricing_matrix.tier_discounts.map((tier, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                          <span className="text-slate-500 font-mono w-16">Min Qty:</span>
                          <input
                            type="number"
                            min="1"
                            value={tier.min_qty}
                            onChange={(e) => {
                              const updated = [...formData.pricing_matrix.tier_discounts];
                              updated[idx].min_qty = parseInt(e.target.value, 10) || 1;
                              setFormData({
                                ...formData,
                                pricing_matrix: { ...formData.pricing_matrix, tier_discounts: updated },
                              });
                            }}
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />

                          <span className="text-slate-500 font-mono">Max Qty:</span>
                          <input
                            type="number"
                            min="1"
                            placeholder="Tanpa Had"
                            value={tier.max_qty || ''}
                            onChange={(e) => {
                              const updated = [...formData.pricing_matrix.tier_discounts];
                              updated[idx].max_qty = e.target.value ? parseInt(e.target.value, 10) : null;
                              setFormData({
                                ...formData,
                                pricing_matrix: { ...formData.pricing_matrix, tier_discounts: updated },
                              });
                            }}
                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />

                          <span className="text-slate-500 font-mono">Kadar Kos (RM):</span>
                          <input
                            type="number"
                            step="0.10"
                            min="1"
                            value={tier.unit_cost}
                            onChange={(e) => {
                              const updated = [...formData.pricing_matrix.tier_discounts];
                              updated[idx].unit_cost = parseFloat(e.target.value) || 0;
                              setFormData({
                                ...formData,
                                pricing_matrix: { ...formData.pricing_matrix, tier_discounts: updated },
                              });
                            }}
                            className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-[#00BDFF]"
                          />

                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.pricing_matrix.tier_discounts.filter((_, i) => i !== idx);
                              setFormData({
                                ...formData,
                                pricing_matrix: { ...formData.pricing_matrix, tier_discounts: updated },
                              });
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tambahan Variasi Potongan & Kolar */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block">Caj Tambahan Potongan (RM)</span>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Lengan Panjang</span>
                          <input
                            type="number"
                            step="0.50"
                            value={formData.pricing_matrix.cut_surcharges['Lengan Panjang'] ?? 3}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pricing_matrix: {
                                  ...formData.pricing_matrix,
                                  cut_surcharges: {
                                    ...formData.pricing_matrix.cut_surcharges,
                                    'Lengan Panjang': parseFloat(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Muslimah</span>
                          <input
                            type="number"
                            step="0.50"
                            value={formData.pricing_matrix.cut_surcharges['Muslimah'] ?? 5}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pricing_matrix: {
                                  ...formData.pricing_matrix,
                                  cut_surcharges: {
                                    ...formData.pricing_matrix.cut_surcharges,
                                    'Muslimah': parseFloat(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <span className="font-bold text-slate-900 block">Caj Tambahan Kolar (RM)</span>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Kolar Polo</span>
                          <input
                            type="number"
                            step="0.50"
                            value={formData.pricing_matrix.collar_surcharges['Polo'] ?? 3}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pricing_matrix: {
                                  ...formData.pricing_matrix,
                                  collar_surcharges: {
                                    ...formData.pricing_matrix.collar_surcharges,
                                    'Polo': parseFloat(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Kolar Zip / Mandarin</span>
                          <input
                            type="number"
                            step="0.50"
                            value={formData.pricing_matrix.collar_surcharges['Zip'] ?? 4}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                pricing_matrix: {
                                  ...formData.pricing_matrix,
                                  collar_surcharges: {
                                    ...formData.pricing_matrix.collar_surcharges,
                                    'Zip': parseFloat(e.target.value) || 0,
                                  },
                                },
                              })
                            }
                            className="w-20 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {modalTab === 'profile' ? (
                  <button
                    type="button"
                    onClick={() => setModalTab('rates')}
                    className="px-4 py-2 text-[#00BDFF] font-semibold text-xs hover:underline cursor-pointer"
                  >
                    Seterusnya: Tetapkan Matriks Kadar Kos →
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalTab('profile')}
                    className="px-4 py-2 text-slate-500 font-semibold text-xs hover:underline cursor-pointer"
                  >
                    ← Kembali ke Profil
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#00BDFF] hover:bg-[#00a6e0] text-white font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{formData.id ? 'Simpan Kemaskini' : 'Daftar Kilang'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
