'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ChevronLeft,
  Save,
  Plus,
  Trash2,
  Clock,
  Layers,
  Shirt,
  Percent,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calculator,
  Tag,
  Phone,
  Mail,
  MapPin,
  Info
} from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { PartnerFactory, FactoryPricingMatrix, FactoryTierDiscount } from '@/types/database';
import { getPartnerFactoryById, savePartnerFactory, deletePartnerFactory } from '@/app/actions/factoryActions';
import { calculateFactoryUnitCost } from '@/lib/factory-pricing-calculator';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

const DEFAULT_COLLAR_LIST = [
  'Round Neck Rib',
  'V-Neck Rib',
  'Collar Polo Berbutang',
  'Kolar Mandarin / Zip',
  'Kolar Round Neck Double Layer',
];

export default function EditFactoryPage() {
  const router = useRouter();
  const params = useParams();
  const factoryId = params.id as string;
  const { fabrics, cuts, tiers } = useAppStore();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'rates' | 'preview'>('profile');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    id: string;
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
    id: factoryId,
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
      fabric_surcharges: {},
      cut_surcharges: {},
      collar_surcharges: {
        'Round Neck Rib': 0.0,
        'V-Neck Rib': 0.0,
        'Collar Polo Berbutang': 3.0,
        'Kolar Mandarin / Zip': 3.5,
      },
    },
  });

  // Simulator State
  const [simQty, setSimQty] = useState(30);
  const [simFabric, setSimFabric] = useState(fabrics[0]?.name || 'Microfiber Eyelet 160gsm');
  const [simCut, setSimCut] = useState(cuts[0]?.name || 'Regular Fit (Lengan Pendek)');
  const [simCollar, setSimCollar] = useState(DEFAULT_COLLAR_LIST[0]);

  useEffect(() => {
    if (fabrics.length > 0 && !simFabric) {
      setSimFabric(fabrics[0].name);
    }
    if (cuts.length > 0 && !simCut) {
      setSimCut(cuts[0].name);
    }
  }, [fabrics, cuts, simFabric, simCut]);

  useEffect(() => {
    async function loadFactory() {
      if (!factoryId) return;
      try {
        const res = await getPartnerFactoryById(factoryId);
        if (res.success && res.data) {
          const f = res.data;
          setFormData({
            id: f.id,
            factory_name: f.factory_name || '',
            pic_name: f.pic_name || '',
            phone: f.phone || '',
            email: f.email || '',
            address: f.address || '',
            specialty: f.specialty || 'Full Sublimation All-in-One',
            default_unit_cost: Number(f.default_unit_cost) || 22.0,
            lead_time_days: Number(f.lead_time_days) || 7,
            notes: f.notes || '',
            pricing_matrix: f.pricing_matrix || {
              base_unit_cost: Number(f.default_unit_cost) || 22.0,
              tier_discounts: [
                { min_qty: 10, max_qty: 29, unit_cost: 24.0 },
                { min_qty: 30, max_qty: 49, unit_cost: 22.0 },
                { min_qty: 50, max_qty: 99, unit_cost: 20.0 },
                { min_qty: 100, max_qty: null, unit_cost: 18.0 },
              ],
              fabric_surcharges: {},
              cut_surcharges: {},
              collar_surcharges: {
                'Round Neck Rib': 0.0,
                'V-Neck Rib': 0.0,
                'Collar Polo Berbutang': 3.0,
                'Kolar Mandarin / Zip': 3.5,
              },
            },
          });
        } else {
          setErrorMessage('Kilang rakan kongsi tidak dijumpai.');
        }
      } catch {
        setErrorMessage('Ralat memuatkan maklumat kilang.');
      } finally {
        setLoading(false);
      }
    }
    loadFactory();
  }, [factoryId]);

  // Combined collars list
  const collarKeys = useMemo(() => {
    const fromMatrix = Object.keys(formData.pricing_matrix.collar_surcharges || {});
    return Array.from(new Set([...DEFAULT_COLLAR_LIST, ...fromMatrix]));
  }, [formData.pricing_matrix.collar_surcharges]);

  // Tier helper actions
  const handleAddTier = () => {
    const currentTiers = formData.pricing_matrix.tier_discounts || [];
    const lastTier = currentTiers[currentTiers.length - 1];
    const nextMin = lastTier ? (lastTier.max_qty ? lastTier.max_qty + 1 : lastTier.min_qty + 50) : 10;
    const newTier: FactoryTierDiscount = {
      min_qty: nextMin,
      max_qty: nextMin + 49,
      unit_cost: Math.max(15, (lastTier?.unit_cost || 22) - 1),
    };
    setFormData((prev) => ({
      ...prev,
      pricing_matrix: {
        ...prev.pricing_matrix,
        tier_discounts: [...currentTiers, newTier],
      },
    }));
  };

  const handleRemoveTier = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      pricing_matrix: {
        ...prev.pricing_matrix,
        tier_discounts: prev.pricing_matrix.tier_discounts.filter((_, i) => i !== idx),
      },
    }));
  };

  const handleUpdateTier = (idx: number, field: keyof FactoryTierDiscount, value: any) => {
    setFormData((prev) => {
      const updated = [...prev.pricing_matrix.tier_discounts];
      updated[idx] = { ...updated[idx], [field]: value };
      return {
        ...prev,
        pricing_matrix: {
          ...prev.pricing_matrix,
          tier_discounts: updated,
        },
      };
    });
  };

  // Surcharges helpers
  const handleUpdateSurcharge = (
    category: 'fabric_surcharges' | 'cut_surcharges' | 'collar_surcharges',
    key: string,
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      pricing_matrix: {
        ...prev.pricing_matrix,
        [category]: {
          ...prev.pricing_matrix[category],
          [key]: value,
        },
      },
    }));
  };

  const handleRemoveSurcharge = (
    category: 'fabric_surcharges' | 'cut_surcharges' | 'collar_surcharges',
    key: string
  ) => {
    setFormData((prev) => {
      const nextMap = { ...prev.pricing_matrix[category] };
      delete nextMap[key];
      return {
        ...prev,
        pricing_matrix: {
          ...prev.pricing_matrix,
          [category]: nextMap,
        },
      };
    });
  };

  const [newSurchargeKey, setNewSurchargeKey] = useState('');
  const [newSurchargeVal, setNewSurchargeVal] = useState(2.0);
  const [newSurchargeCat, setNewSurchargeCat] = useState<'fabric_surcharges' | 'cut_surcharges' | 'collar_surcharges'>('collar_surcharges');

  const handleAddCustomSurcharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurchargeKey.trim()) return;
    handleUpdateSurcharge(newSurchargeCat, newSurchargeKey.trim(), newSurchargeVal);
    setNewSurchargeKey('');
    setNewSurchargeVal(2.0);
  };

  // Live simulation
  const dummyFactory = {
    id: formData.id,
    factory_name: formData.factory_name || 'Kilang',
    default_unit_cost: formData.default_unit_cost,
    pricing_matrix: formData.pricing_matrix,
  } as any;

  const simResult = calculateFactoryUnitCost(dummyFactory, simQty, simFabric, simCut, simCollar);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.factory_name.trim()) {
      setErrorMessage('Sila masukkan nama kilang.');
      setActiveTab('profile');
      return;
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Sila masukkan nombor telefon / WhatsApp kilang.');
      setActiveTab('profile');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessToast(null);
    try {
      const res = await savePartnerFactory({
        ...formData,
        default_unit_cost: formData.pricing_matrix.base_unit_cost || formData.default_unit_cost,
      });

      if (res.success) {
        setSuccessToast('Maklumat dan formula harga kilang berjaya dikemaskini!');
        setTimeout(() => setSuccessToast(null), 4000);
      } else {
        setErrorMessage(res.message || 'Gagal mengemaskini maklumat kilang.');
      }
    } catch {
      setErrorMessage('Ralat sambungan pelayan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Adakah anda pasti mahu memadam kilang "${formData.factory_name}"?`)) return;
    try {
      const res = await deletePartnerFactory(formData.id);
      if (res.success) {
        router.push('/admin/factories');
        router.refresh();
      } else {
        alert(res.message || 'Gagal memadam kilang.');
      }
    } catch {
      alert('Ralat sambungan.');
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-slate-500">
        <RefreshCw className="w-6 h-6 animate-spin text-[#00BDFF] mx-auto mb-2" />
        <p className="text-xs">Memuatkan maklumat kilang...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin/factories" className="hover:text-[#00BDFF] transition-colors">
              Pengurusan Kilang
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">{formData.factory_name || 'Kemaskini Kilang'}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#00BDFF]" />
            <span>Kemaskini Maklumat & Formula Kilang</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ubah profil pembekal, kadar asas, tangga kuantiti, dan surcaj bahan jersi sublimasi yang diselaraskan dengan formula sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/factories"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Kembali</span>
          </Link>
          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-rose-200"
            title="Padam Kilang Ini"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Padam</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>

      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-[#00BDFF] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          1. Profil & PIC Kilang
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('rates')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'rates'
              ? 'bg-[#00BDFF] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          2. Formula Harga & Kad Kadar (Selaras Formula Sistem)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'preview'
              ? 'bg-[#00BDFF] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          3. Simulator Pengiraan Kos Langsung
        </button>
      </div>

      {/* TAB 1: PROFIL KILANG */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900">Maklumat Am Kilang & Pengurusan PIC</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Isikan maklumat perniagaan dan perhubungan bagi tujuan komunikasi pesanan dan penghantaran Job Sheet.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Kilang / Syarikat Pembekal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.factory_name}
                onChange={(e) => setFormData({ ...formData, factory_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-semibold"
                placeholder="Cth: Kilang Sublimasi Utama Selangor"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama PIC Kilang (Pengurus / Supervisor)</label>
              <input
                type="text"
                value={formData.pic_name}
                onChange={(e) => setFormData({ ...formData, pic_name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                placeholder="Cth: En. Rizal / Pn. Aisyah"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                No. Telefon / WhatsApp Kilang <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-mono font-medium"
                placeholder="Cth: 60123456789"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emel Kilang</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                placeholder="kilang@sublimasi.my"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Lead Time Standard (Hari Bekerja)</label>
              <input
                type="number"
                min="1"
                value={formData.lead_time_days}
                onChange={(e) => setFormData({ ...formData, lead_time_days: parseInt(e.target.value, 10) || 7 })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none font-semibold"
                placeholder="7"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat Premis / Lokasi Kilang</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                placeholder="Alamat lengkap penghantaran atau lokasi pengambilan stok..."
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Catatan Tambahan & Keistimewaan Kilang</label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                placeholder="Cth: Pakar kolar polo zip, masa siap pantas untuk tempahan lebih 500 helai..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveTab('rates')}
              className="px-5 py-2.5 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Seterusnya: Ubah Formula Harga &rarr;
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: FORMULA HARGA & RATE CARD - DYNAMICALLY SYNCED WITH MASTER FORMULA */}
      {activeTab === 'rates' && (
        <div className="space-y-6">
          {/* Base Unit Rate & Quantity Tiers */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Kadar Asas & Tangga Kuantiti Tempahan</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kos asas seunit automatik berdasarkan julat kuantiti helai yang ditempah.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Kadar Asas Standard (RM):</span>
                <input
                  type="number"
                  step="0.50"
                  value={formData.pricing_matrix.base_unit_cost}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setFormData((prev) => ({
                      ...prev,
                      default_unit_cost: val,
                      pricing_matrix: { ...prev.pricing_matrix, base_unit_cost: val },
                    }));
                  }}
                  className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-xs focus:ring-2 focus:ring-[#00BDFF] focus:outline-none text-right"
                />
              </div>
            </div>

            {/* Tiers Table */}
            <div className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                      <th className="py-2.5 px-4">Min Helai</th>
                      <th className="py-2.5 px-4">Maks Helai</th>
                      <th className="py-2.5 px-4 text-right">Kos Seunit Kilang (RM)</th>
                      <th className="py-2.5 px-4 text-center w-16">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(formData.pricing_matrix.tier_discounts || []).map((tier, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4">
                          <input
                            type="number"
                            min="1"
                            value={tier.min_qty}
                            onChange={(e) => handleUpdateTier(idx, 'min_qty', parseInt(e.target.value, 10) || 1)}
                            className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold"
                          />
                        </td>
                        <td className="py-2.5 px-4">
                          <input
                            type="number"
                            placeholder="Tanpa had"
                            value={tier.max_qty ?? ''}
                            onChange={(e) =>
                              handleUpdateTier(
                                idx,
                                'max_qty',
                                e.target.value === '' ? null : parseInt(e.target.value, 10)
                              )
                            }
                            className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <input
                            type="number"
                            step="0.10"
                            value={tier.unit_cost}
                            onChange={(e) => handleUpdateTier(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                            className="w-28 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-right text-slate-900"
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveTier(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Padam Tangga Kuantiti"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={handleAddTier}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-50 text-[#00BDFF] hover:bg-sky-100 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Tangga Kuantiti</span>
              </button>
            </div>
          </div>

          {/* DYNAMIC SECTION 1: JENIS KAIN (Syncs with Master Fabrics) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00BDFF]" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  1. Surcaj / Kos Tambahan Jenis Kain ({fabrics.length} Item Formula Sistem)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Diselaraskan automatik dengan <em>Pengaturan &gt; Formula Harga</em>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-4">Nama Material Kain</th>
                    <th className="py-2.5 px-4">GSM & Ketahanan</th>
                    <th className="py-2.5 px-4 text-right">Harga Jualan Sistem</th>
                    <th className="py-2.5 px-4 text-right">Kos Tambahan Kilang (+RM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {fabrics.map((fabric) => {
                    const currentSurcharge =
                      formData.pricing_matrix.fabric_surcharges[fabric.name] ??
                      formData.pricing_matrix.fabric_surcharges[fabric.code] ??
                      0;

                    return (
                      <tr key={fabric.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">
                          {fabric.name}
                          {fabric.is_popular && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-sky-50 text-[#00BDFF] font-bold">
                              Popular
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">
                          {fabric.weight_gsm ? `${fabric.weight_gsm} gsm` : '-'} • {fabric.breathability || 'Standard'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600 font-medium">
                          {formatCurrency(fabric.sublimation_base_price)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-slate-400 font-medium">+RM</span>
                            <input
                              type="number"
                              step="0.50"
                              value={currentSurcharge}
                              onChange={(e) =>
                                handleUpdateSurcharge(
                                  'fabric_surcharges',
                                  fabric.name,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                              placeholder="0.00"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DYNAMIC SECTION 2: JENIS POTONGAN (Syncs with Master Apparel Cuts) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-[#00BDFF]" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  2. Surcaj / Kos Tambahan Potongan & Lengan ({cuts.length} Item Formula Sistem)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Diselaraskan automatik dengan <em>Pengaturan &gt; Formula Harga</em>
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-4">Jenis Potongan / Pola</th>
                    <th className="py-2.5 px-4">Kod & Penerangan</th>
                    <th className="py-2.5 px-4 text-right">Tambahan Jualan Sistem</th>
                    <th className="py-2.5 px-4 text-right">Kos Tambahan Kilang (+RM)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cuts.map((cut) => {
                    const currentSurcharge =
                      formData.pricing_matrix.cut_surcharges[cut.name] ??
                      formData.pricing_matrix.cut_surcharges[cut.code] ??
                      0;

                    return (
                      <tr key={cut.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{cut.name}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                          {cut.code || '-'}
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-600 font-medium">
                          +{formatCurrency(cut.cut_add_on_price)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-slate-400 font-medium">+RM</span>
                            <input
                              type="number"
                              step="0.50"
                              value={currentSurcharge}
                              onChange={(e) =>
                                handleUpdateSurcharge(
                                  'cut_surcharges',
                                  cut.name,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                              placeholder="0.00"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* DYNAMIC SECTION 3: JENIS KOLAR & LEHER */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#00BDFF]" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  3. Surcaj / Kos Tambahan Jenis Kolar & Leher ({collarKeys.length} Pilihan)
                </h3>
              </div>
              <span className="text-[11px] text-slate-500">
                Tetapan kos jahitan rib, zip, atau kolar polo bagi kilang ini
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-4">Jenis Kolar / Leher</th>
                    <th className="py-2.5 px-4 text-right">Kos Tambahan Kilang (+RM)</th>
                    <th className="py-2.5 px-4 text-center w-16">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collarKeys.map((collarName) => {
                    const currentSurcharge = formData.pricing_matrix.collar_surcharges[collarName] ?? 0;

                    return (
                      <tr key={collarName} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-semibold text-slate-900">{collarName}</td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-slate-400 font-medium">+RM</span>
                            <input
                              type="number"
                              step="0.50"
                              value={currentSurcharge}
                              onChange={(e) =>
                                handleUpdateSurcharge(
                                  'collar_surcharges',
                                  collarName,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
                              placeholder="0.00"
                            />
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveSurcharge('collar_surcharges', collarName)}
                            className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            title="Padam Kolar Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Quick Add Custom Collar */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
              <span className="font-bold text-slate-900 text-xs block">Tambah Pilihan Kolar / Surcaj Tersuai</span>
              <form onSubmit={handleAddCustomSurcharge} className="flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Cth: Kolar Mandarin Berbutang / Kolar Zip Besi"
                  value={newSurchargeKey}
                  onChange={(e) => setNewSurchargeKey(e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-2 bg-white border border-slate-200 rounded-xl"
                />

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">+RM</span>
                  <input
                    type="number"
                    step="0.50"
                    value={newSurchargeVal}
                    onChange={(e) => setNewSurchargeVal(parseFloat(e.target.value) || 0)}
                    className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-right"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl font-semibold shadow-xs cursor-pointer"
                >
                  Tambah
                </button>
              </form>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
            >
              &larr; Kembali ke Profil
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className="px-5 py-2.5 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              Seterusnya: Uji Simulator &rarr;
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SIMULATOR PENGIRAAN KOS LANGSUNG */}
      {activeTab === 'preview' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#00BDFF]" />
              <span>Simulator Pengiraan Kos Langsung (Live Rate Simulator)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Uji formula harga yang telah anda tetapkan di atas bersama data kain & potongan sistem.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* Input Controls */}
            <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kuantiti Tempahan: <span className="font-bold text-[#00BDFF]">{simQty} helai</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={simQty}
                  onChange={(e) => setSimQty(parseInt(e.target.value, 10))}
                  className="w-full accent-[#00BDFF]"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Kain (Dari Formula Sistem)</label>
                <select
                  value={simFabric}
                  onChange={(e) => setSimFabric(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                >
                  {fabrics.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name} ({formatCurrency(f.sublimation_base_price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Potongan (Dari Formula Sistem)</label>
                <select
                  value={simCut}
                  onChange={(e) => setSimCut(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                >
                  {cuts.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} (+{formatCurrency(c.cut_add_on_price)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Kolar</label>
                <select
                  value={simCollar}
                  onChange={(e) => setSimCollar(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                >
                  {collarKeys.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Breakdown Card */}
            <div className="p-5 bg-sky-50/50 rounded-2xl border border-sky-100 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase text-sky-700 tracking-wider block">
                  Keputusan Formula Kos Kilang
                </span>
                <div className="text-3xl font-black text-slate-900 mt-1">
                  {formatCurrency(simResult.finalUnitCost)}{' '}
                  <span className="text-xs text-slate-500 font-normal">/ helai</span>
                </div>
                <div className="text-xs text-slate-600 font-semibold mt-1">
                  Jumlah Kos Pengeluaran ({simQty} helai):{' '}
                  <span className="text-[#00BDFF] font-bold">{formatCurrency(simResult.finalUnitCost * simQty)}</span>
                </div>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-sky-100 space-y-1.5 text-xs">
                <span className="font-bold text-slate-800 block text-[11px] mb-1">Perincian Surcaj Terpakai:</span>
                <div className="flex justify-between text-slate-600">
                  <span>Kadar Asas (Kuantiti {simQty} helai):</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(simResult.baseCost)}</span>
                </div>
                {simResult.fabricSurcharge !== 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Surcaj Kain ({simFabric}):</span>
                    <span className="font-semibold text-emerald-600">+{formatCurrency(simResult.fabricSurcharge)}</span>
                  </div>
                )}
                {simResult.cutSurcharge !== 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Surcaj Potongan ({simCut}):</span>
                    <span className="font-semibold text-emerald-600">+{formatCurrency(simResult.cutSurcharge)}</span>
                  </div>
                )}
                {simResult.collarSurcharge !== 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Surcaj Kolar ({simCollar}):</span>
                    <span className="font-semibold text-emerald-600">+{formatCurrency(simResult.collarSurcharge)}</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full py-2.5 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Simpan Perubahan Kilang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
