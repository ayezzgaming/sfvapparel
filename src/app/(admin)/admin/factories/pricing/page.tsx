'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertCircle,
  Layers,
  Shirt,
  Percent,
  SlidersHorizontal,
  Calculator,
  ChevronRight,
  Trash2,
  Tag
} from 'lucide-react';
import { PartnerFactory, FactoryPricingMatrix, FactoryTierDiscount } from '@/types/database';
import { getPartnerFactories, savePartnerFactory } from '@/app/actions/factoryActions';
import { calculateFactoryUnitCost } from '@/lib/factory-pricing-calculator';

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ms-MY', {
    style: 'currency',
    currency: 'MYR',
    minimumFractionDigits: 2,
  }).format(amount || 0);
}

const DEFAULT_FABRICS = [
  'Microfiber Eyelet 160gsm',
  'Microfiber Interlock 180gsm',
  'Microfiber Honeycomb',
  'Microfiber Jacquard',
];

const DEFAULT_CUTS = [
  'Regular Fit (Lengan Pendek)',
  'Lengan Panjang (Long Sleeve)',
  'Potongan Muslimah',
  'Tanpa Lengan (Sleeveless)',
];

const DEFAULT_COLLARS = [
  'Round Neck Rib',
  'V-Neck Rib',
  'Collar Polo Berbutang',
  'Kolar Mandarin / Zip',
];

export default function FactoryPricingMatrixPage() {
  const [factories, setFactories] = useState<PartnerFactory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFactoryId, setSelectedFactoryId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active matrix state
  const [currentMatrix, setCurrentMatrix] = useState<FactoryPricingMatrix>({
    base_unit_cost: 22.0,
    tier_discounts: [
      { min_qty: 10, max_qty: 29, unit_cost: 24.0 },
      { min_qty: 30, max_qty: 49, unit_cost: 22.0 },
      { min_qty: 50, max_qty: 99, unit_cost: 20.0 },
      { min_qty: 100, max_qty: null, unit_cost: 18.0 },
    ],
    fabric_surcharges: { Interlock: 2.0, Honeycomb: 2.0, Jacquard: 3.0 },
    cut_surcharges: { 'Lengan Panjang': 3.0, Muslimah: 5.0, 'Tanpa Lengan': -1.0 },
    collar_surcharges: { Polo: 3.0, Mandarin: 3.0, Zip: 4.0 },
  });

  // Simulator
  const [simQty, setSimQty] = useState(30);
  const [simFabric, setSimFabric] = useState('Microfiber Eyelet 160gsm');
  const [simCut, setSimCut] = useState('Regular Fit (Lengan Pendek)');
  const [simCollar, setSimCollar] = useState('Round Neck Rib');

  const loadData = async () => {
    try {
      const res = await getPartnerFactories();
      if (res.success && res.data) {
        setFactories(res.data);
        if (res.data.length > 0 && !selectedFactoryId) {
          const first = res.data[0];
          setSelectedFactoryId(first.id);
          if (first.pricing_matrix) {
            setCurrentMatrix(first.pricing_matrix);
          }
        }
      }
    } catch {
      // no-op
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedFactory = useMemo(() => {
    return factories.find((f) => f.id === selectedFactoryId) || factories[0];
  }, [factories, selectedFactoryId]);

  const handleSelectFactory = (fId: string) => {
    setSelectedFactoryId(fId);
    const target = factories.find((f) => f.id === fId);
    if (target && target.pricing_matrix) {
      setCurrentMatrix(target.pricing_matrix);
    }
  };

  // Tier operations
  const handleAddTier = () => {
    const currentTiers = currentMatrix.tier_discounts || [];
    const lastTier = currentTiers[currentTiers.length - 1];
    const nextMin = lastTier ? (lastTier.max_qty ? lastTier.max_qty + 1 : lastTier.min_qty + 50) : 10;
    const newTier: FactoryTierDiscount = {
      min_qty: nextMin,
      max_qty: nextMin + 49,
      unit_cost: Math.max(15, (lastTier?.unit_cost || 22) - 1),
    };
    setCurrentMatrix((prev) => ({
      ...prev,
      tier_discounts: [...currentTiers, newTier],
    }));
  };

  const handleRemoveTier = (idx: number) => {
    setCurrentMatrix((prev) => ({
      ...prev,
      tier_discounts: prev.tier_discounts.filter((_, i) => i !== idx),
    }));
  };

  const handleUpdateTier = (idx: number, field: keyof FactoryTierDiscount, value: any) => {
    setCurrentMatrix((prev) => {
      const updated = [...prev.tier_discounts];
      updated[idx] = { ...updated[idx], [field]: value };
      return {
        ...prev,
        tier_discounts: updated,
      };
    });
  };

  // Surcharge operations
  const handleUpdateSurcharge = (
    category: 'fabric_surcharges' | 'cut_surcharges' | 'collar_surcharges',
    key: string,
    value: number
  ) => {
    setCurrentMatrix((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
  };

  const handleRemoveSurcharge = (
    category: 'fabric_surcharges' | 'cut_surcharges' | 'collar_surcharges',
    key: string
  ) => {
    setCurrentMatrix((prev) => {
      const nextMap = { ...prev[category] };
      delete nextMap[key];
      return {
        ...prev,
        [category]: nextMap,
      };
    });
  };

  const [newSurchargeCat, setNewSurchargeCat] = useState<'fabric_surcharges' | 'cut_surcharges' | 'collar_surcharges'>('fabric_surcharges');
  const [newSurchargeKey, setNewSurchargeKey] = useState('');
  const [newSurchargeVal, setNewSurchargeVal] = useState(2.0);

  const handleAddSurcharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurchargeKey.trim()) return;
    handleUpdateSurcharge(newSurchargeCat, newSurchargeKey.trim(), newSurchargeVal);
    setNewSurchargeKey('');
    setNewSurchargeVal(2.0);
  };

  // Save changes
  const handleSaveMatrix = async () => {
    if (!selectedFactory) return;
    setSubmitting(true);
    setErrorMessage(null);
    setSuccessToast(null);

    try {
      const res = await savePartnerFactory({
        ...selectedFactory,
        default_unit_cost: currentMatrix.base_unit_cost || selectedFactory.default_unit_cost,
        pricing_matrix: currentMatrix,
      });

      if (res.success) {
        setSuccessToast(`Matriks harga bagi "${selectedFactory.factory_name}" berjaya disimpan!`);
        setTimeout(() => setSuccessToast(null), 4000);
        await loadData();
      } else {
        setErrorMessage(res.message || 'Gagal menyimpan matriks harga kilang.');
      }
    } catch {
      setErrorMessage('Ralat sambungan pelayan.');
    } finally {
      setSubmitting(false);
    }
  };

  const dummyFac = {
    id: selectedFactory?.id || 'temp',
    factory_name: selectedFactory?.factory_name || 'Kilang',
    default_unit_cost: currentMatrix.base_unit_cost,
    pricing_matrix: currentMatrix,
  } as any;

  const simResult = calculateFactoryUnitCost(dummyFac, simQty, simFabric, simCut, simCollar);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <Link href="/admin/factories" className="hover:text-[#00BDFF] transition-colors">
              Pengurusan Kilang
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">Formula & Kad Kadar Kilang</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-[#00BDFF]" />
            <span>Formula & Matriks Harga Kilang Sublimasi</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Sama seperti formula harga jualan, urus tangga diskaun kuantiti dan surcaj bahan bagi setiap kilang rakan kongsi secara berpusat.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/factories"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs transition-all"
          >
            <span>Ke Direktori Kilang</span>
          </Link>
          <button
            type="button"
            onClick={handleSaveMatrix}
            disabled={submitting || !selectedFactory}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Simpan Matriks Harga</span>
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

      {/* Select Target Factory Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#00BDFF] flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
              Pilih Kilang Sasaran
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {selectedFactory?.factory_name || 'Pilih Kilang'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedFactoryId}
            onChange={(e) => handleSelectFactory(e.target.value)}
            className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-[#00BDFF] focus:outline-none"
          >
            {factories.map((f) => (
              <option key={f.id} value={f.id}>
                {f.factory_name} (RM {f.default_unit_cost}/u)
              </option>
            ))}
          </select>
          {selectedFactory && (
            <Link
              href={`/admin/factories/${selectedFactory.id}`}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            >
              Ubah Profil Kilang
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Rate Card Configuration & Live Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Rate Matrix */}
        <div className="lg:col-span-2 space-y-6">
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
                <span className="text-xs font-semibold text-slate-600">Kadar Asas Default (RM):</span>
                <input
                  type="number"
                  step="0.50"
                  value={currentMatrix.base_unit_cost}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setCurrentMatrix((prev) => ({
                      ...prev,
                      base_unit_cost: val,
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
                    {(currentMatrix.tier_discounts || []).map((tier, idx) => (
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

          {/* Surcharges Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Fabric */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#00BDFF]" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Surcaj Kain (RM)</h3>
              </div>
              <div className="space-y-2 text-xs">
                {Object.entries(currentMatrix.fabric_surcharges || {}).map(([name, cost]) => (
                  <div key={name} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-800 truncate">{name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        step="0.50"
                        value={cost}
                        onChange={(e) => handleUpdateSurcharge('fabric_surcharges', name, parseFloat(e.target.value) || 0)}
                        className="w-14 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSurcharge('fabric_surcharges', name)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cut */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-[#00BDFF]" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Surcaj Potongan (RM)</h3>
              </div>
              <div className="space-y-2 text-xs">
                {Object.entries(currentMatrix.cut_surcharges || {}).map(([name, cost]) => (
                  <div key={name} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-800 truncate">{name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        step="0.50"
                        value={cost}
                        onChange={(e) => handleUpdateSurcharge('cut_surcharges', name, parseFloat(e.target.value) || 0)}
                        className="w-14 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSurcharge('cut_surcharges', name)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Collar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#00BDFF]" />
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Surcaj Kolar (RM)</h3>
              </div>
              <div className="space-y-2 text-xs">
                {Object.entries(currentMatrix.collar_surcharges || {}).map(([name, cost]) => (
                  <div key={name} className="flex items-center justify-between gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-800 truncate">{name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        step="0.50"
                        value={cost}
                        onChange={(e) => handleUpdateSurcharge('collar_surcharges', name, parseFloat(e.target.value) || 0)}
                        className="w-14 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-right font-bold text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSurcharge('collar_surcharges', name)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Add Custom Surcharge */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-2 text-xs">
            <span className="font-bold text-slate-900 block">Tambah Item Surcaj Kilang</span>
            <form onSubmit={handleAddSurcharge} className="flex flex-wrap items-center gap-2">
              <select
                value={newSurchargeCat}
                onChange={(e) => setNewSurchargeCat(e.target.value as any)}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold"
              >
                <option value="fabric_surcharges">Jenis Kain</option>
                <option value="cut_surcharges">Potongan / Lengan</option>
                <option value="collar_surcharges">Jenis Kolar</option>
              </select>

              <input
                type="text"
                placeholder="Cth: Kolar Mandarin Zip / Silk Dryfit"
                value={newSurchargeKey}
                onChange={(e) => setNewSurchargeKey(e.target.value)}
                className="flex-1 min-w-[180px] px-3 py-2 bg-white border border-slate-200 rounded-xl"
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

        {/* Right 1 Col: Live Calculator Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 sticky top-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#00BDFF]" />
                <span>Simulator Langsung (Live Test)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Semak pengiraan automatik semasa Job Sheet dijana.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kuantiti: <span className="font-bold text-[#00BDFF]">{simQty} helai</span>
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
                <label className="block font-semibold text-slate-700 mb-1">Jenis Kain</label>
                <select
                  value={simFabric}
                  onChange={(e) => setSimFabric(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-xs"
                >
                  {DEFAULT_FABRICS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Potongan</label>
                <select
                  value={simCut}
                  onChange={(e) => setSimCut(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-xs"
                >
                  {DEFAULT_CUTS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Jenis Kolar</label>
                <select
                  value={simCollar}
                  onChange={(e) => setSimCollar(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-xs"
                >
                  {DEFAULT_COLLARS.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Result Box */}
            <div className="p-4 bg-sky-50/60 rounded-xl border border-sky-100 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-sky-700 block">Kos Seunit Terhitung:</span>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(simResult.finalUnitCost)} <span className="text-xs text-slate-500 font-normal">/ helai</span>
              </div>
              <div className="text-[11px] text-slate-600 font-semibold border-t border-sky-200/60 pt-2 flex justify-between">
                <span>Jumlah Kos Kilang:</span>
                <span className="text-[#00BDFF] font-bold">{formatCurrency(simResult.finalUnitCost * simQty)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveMatrix}
              disabled={submitting}
              className="w-full py-2.5 bg-[#00BDFF] hover:bg-[#00a6e0] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Simpan Matriks {selectedFactory?.factory_name || ''}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
