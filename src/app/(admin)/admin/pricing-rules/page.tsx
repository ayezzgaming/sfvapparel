'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import {
  calculateSublimationPrice,
  calculateDtfPrice,
  formatCurrency
} from '@/lib/pricing-calculator';
import {
  DollarSign,
  Layers,
  Scissors,
  Printer,
  Percent,
  Check,
  Edit2,
  Save,
  Calculator,
  RotateCcw,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';

export default function AdminPricingRulesPage() {
  const {
    fabrics,
    cuts,
    dtfDimensions,
    tiers,
    updateFabric,
    updateCut,
    updateDtfDimension,
    updateQuantityTier,
    resetToSeedData
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'sublimation_fabrics' | 'apparel_cuts' | 'dtf_dims' | 'volume_tiers'>('sublimation_fabrics');

  // Edit inline states
  const [editingFabricId, setEditingFabricId] = useState<string | null>(null);
  const [fabricPriceInput, setFabricPriceInput] = useState<number>(0);

  const [editingCutId, setEditingCutId] = useState<string | null>(null);
  const [cutPriceInput, setCutPriceInput] = useState<number>(0);

  const [editingDtfId, setEditingDtfId] = useState<string | null>(null);
  const [dtfBasePriceInput, setDtfBasePriceInput] = useState<number>(0);
  const [dtfGarmentPriceInput, setDtfGarmentPriceInput] = useState<number>(0);

  const [editingTierId, setEditingTierId] = useState<string | null>(null);
  const [tierDiscountInput, setTierDiscountInput] = useState<number>(0);

  // Live Simulator States
  const [simMode, setSimMode] = useState<'sublimation' | 'dtf'>('sublimation');
  const [simFabricId, setSimFabricId] = useState<string>(fabrics[0]?.id || 'mat-1');
  const [simCutId, setSimCutId] = useState<string>(cuts[0]?.id || 'cut-1');
  const [simDtfId, setSimDtfId] = useState<string>(dtfDimensions[1]?.id || 'dtf-2');
  const [simDtfType, setSimDtfType] = useState<'film_only' | 'with_garment'>('with_garment');
  const [simQuantity, setSimQuantity] = useState<number>(25);

  const simSelectedFabric = fabrics.find((f) => f.id === simFabricId) || fabrics[0];
  const simSelectedCut = cuts.find((c) => c.id === simCutId) || cuts[0];
  const simSelectedDtf = dtfDimensions.find((d) => d.id === simDtfId) || dtfDimensions[0];

  const simQuote = useMemo(() => {
    if (simMode === 'sublimation') {
      return calculateSublimationPrice({
        fabric: simSelectedFabric,
        cut: simSelectedCut,
        quantity: simQuantity,
        tiers,
      });
    } else {
      return calculateDtfPrice({
        dimension: simSelectedDtf,
        optionType: simDtfType,
        quantity: simQuantity,
        tiers,
      });
    }
  }, [simMode, simSelectedFabric, simSelectedCut, simSelectedDtf, simDtfType, simQuantity, tiers]);

  // Handlers for inline edits
  const handleSaveFabric = (id: string) => {
    updateFabric(id, { sublimation_base_price: fabricPriceInput });
    setEditingFabricId(null);
  };

  const handleSaveCut = (id: string) => {
    updateCut(id, { cut_add_on_price: cutPriceInput });
    setEditingCutId(null);
  };

  const handleSaveDtf = (id: string) => {
    updateDtfDimension(id, {
      base_price: dtfBasePriceInput,
      garment_included_base_price: dtfGarmentPriceInput,
    });
    setEditingDtfId(null);
  };

  const handleSaveTier = (id: string) => {
    updateQuantityTier(id, { discount_percentage: tierDiscountInput });
    setEditingTierId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Konfigurasi Formula Harga Dinamik
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tetapkan kadar asas fabrik, surcaj potongan kolar, dimensi DTF, dan diskaun kelompok kuantiti.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Kembalikan tetapan formula harga kepada kadar lalai asal?')) {
              resetToSeedData();
            }
          }}
          className="px-3 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs flex items-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Kadar Asal</span>
        </button>
      </div>

      {/* Grid: Left 2 Cols = Rules Tables, Right 1 Col = Live Simulator Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pricing Rules Managers */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sub Navigation Tabs */}
          <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('sublimation_fabrics')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'sublimation_fabrics'
                  ? 'bg-[#0052FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Material Fabrik ({fabrics.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('apparel_cuts')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'apparel_cuts'
                  ? 'bg-[#0052FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>2. Jenis Potongan / Kolar ({cuts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('dtf_dims')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'dtf_dims'
                  ? 'bg-[#0052FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>3. Dimensi DTF ({dtfDimensions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('volume_tiers')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'volume_tiers'
                  ? 'bg-[#0052FF] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>4. Diskaun Kuantiti ({tiers.length})</span>
            </button>
          </div>

          {/* TAB 1: FABRIC MATERIALS */}
          {activeTab === 'sublimation_fabrics' && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Harga Asas Fabrik Sublimasi</h3>
                <p className="text-xs text-slate-500">
                  Menetapkan kadar seunit bagi setiap jenis anyaman & ketebalan GSM fabrik.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 rounded-l-xl">Nama & Spesifikasi Fabrik</th>
                      <th className="p-3">Berat (GSM)</th>
                      <th className="p-3">Pengudaraan</th>
                      <th className="p-3 text-right">Harga Asas</th>
                      <th className="p-3 rounded-r-xl text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {fabrics.map((f) => {
                      const isEditing = editingFabricId === f.id;
                      return (
                        <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3">
                            <span className="font-bold text-slate-900 block">{f.name}</span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">{f.description}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-700">{f.weight_gsm} GSM</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-[#0052FF] border border-blue-100">
                              {f.breathability}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            {isEditing ? (
                              <input
                                type="number"
                                value={fabricPriceInput}
                                onChange={(e) => setFabricPriceInput(Number(e.target.value))}
                                className="w-28 px-2 py-1 bg-slate-50 border border-[#0052FF] rounded text-right text-xs text-slate-900 font-bold"
                              />
                            ) : (
                              formatCurrency(f.sublimation_base_price)
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveFabric(f.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                              >
                                Simpan
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingFabricId(f.id);
                                  setFabricPriceInput(f.sublimation_base_price);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                              >
                                Ubah Kadar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: APPAREL CUTS */}
          {activeTab === 'apparel_cuts' && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Surcaj Tambahan Potongan & Kolar</h3>
                <p className="text-xs text-slate-500">
                  Caj tambahan yang ditambah ke atas harga fabrik asas untuk kolar premium & potongan khusus.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 rounded-l-xl">Nama Potongan / Corak</th>
                      <th className="p-3">Keterangan</th>
                      <th className="p-3 text-right">Kos Tambahan</th>
                      <th className="p-3 rounded-r-xl text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {cuts.map((c) => {
                      const isEditing = editingCutId === c.id;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{c.name}</td>
                          <td className="p-3 text-xs text-slate-500 max-w-[200px]">{c.description}</td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700">
                            {isEditing ? (
                              <input
                                type="number"
                                value={cutPriceInput}
                                onChange={(e) => setCutPriceInput(Number(e.target.value))}
                                className="w-24 px-2 py-1 bg-slate-50 border border-[#0052FF] rounded text-right text-xs text-slate-900 font-bold"
                              />
                            ) : c.cut_add_on_price > 0 ? (
                              `+${formatCurrency(c.cut_add_on_price)}`
                            ) : (
                              'Termasuk (RM 0)'
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveCut(c.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                              >
                                Simpan
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingCutId(c.id);
                                  setCutPriceInput(c.cut_add_on_price);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                              >
                                Ubah Surcaj
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: DTF DIMENSIONS */}
          {activeTab === 'dtf_dims' && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Kadar Lembaran Dimensi DTF</h3>
                <p className="text-xs text-slate-500">
                  Kadar saiz cetakan direct-to-film dan pilihan pakej bersama t-shirt.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 rounded-l-xl">Kategori Saiz</th>
                      <th className="p-3">Dimensi Ukuran</th>
                      <th className="p-3 text-right">Filem Sahaja</th>
                      <th className="p-3 text-right">Termasuk T-Shirt 24s</th>
                      <th className="p-3 rounded-r-xl text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {dtfDimensions.map((d) => {
                      const isEditing = editingDtfId === d.id;
                      return (
                        <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{d.name}</td>
                          <td className="p-3 font-mono text-slate-500">{d.dimensions_desc}</td>
                          <td className="p-3 text-right font-mono font-bold text-amber-700">
                            {isEditing ? (
                              <input
                                type="number"
                                value={dtfBasePriceInput}
                                onChange={(e) => setDtfBasePriceInput(Number(e.target.value))}
                                className="w-20 px-1 py-1 bg-slate-50 border border-[#0052FF] rounded text-right text-xs text-slate-900 font-bold"
                              />
                            ) : (
                              formatCurrency(d.base_price)
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            {isEditing ? (
                              <input
                                type="number"
                                value={dtfGarmentPriceInput}
                                onChange={(e) => setDtfGarmentPriceInput(Number(e.target.value))}
                                className="w-20 px-1 py-1 bg-slate-50 border border-[#0052FF] rounded text-right text-xs text-slate-900 font-bold"
                              />
                            ) : (
                              d.garment_included_base_price > 0 ? formatCurrency(d.garment_included_base_price) : 'N/A'
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveDtf(d.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                              >
                                Simpan
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingDtfId(d.id);
                                  setDtfBasePriceInput(d.base_price);
                                  setDtfGarmentPriceInput(d.garment_included_base_price);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                              >
                                Ubah Kadar
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: VOLUME TIERS */}
          {activeTab === 'volume_tiers' && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Diskaun Kelompok Mengikut Kuantiti</h3>
                <p className="text-xs text-slate-500">
                  Potongan peratusan automatik yang dikira secara dinamik mengikut jumlah tempahan.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3 rounded-l-xl">Tahap Kuantiti</th>
                      <th className="p-3">Kuantiti Min</th>
                      <th className="p-3">Kuantiti Maks</th>
                      <th className="p-3 text-right">Diskaun %</th>
                      <th className="p-3 rounded-r-xl text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {tiers.map((t) => {
                      const isEditing = editingTierId === t.id;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-900">{t.tier_label}</td>
                          <td className="p-3 font-mono text-slate-600">{t.min_qty} helai</td>
                          <td className="p-3 font-mono text-slate-600">
                            {t.max_qty ? `${t.max_qty} helai` : 'Pukal (Tanpa Had)'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">
                            {isEditing ? (
                              <input
                                type="number"
                                value={tierDiscountInput}
                                onChange={(e) => setTierDiscountInput(Number(e.target.value))}
                                className="w-16 px-1 py-1 bg-slate-50 border border-[#0052FF] rounded text-right text-xs text-slate-900 font-bold"
                              />
                            ) : (
                              `${t.discount_percentage}% DISKAUN`
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveTier(t.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                              >
                                Simpan
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingTierId(t.id);
                                  setTierDiscountInput(t.discount_percentage);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                              >
                                Ubah %
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Dynamic Live Pricing Sandbox / Simulator */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-[#0052FF]" />
                <h3 className="text-sm font-bold text-slate-900">Simulator Harga Langsung</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0052FF] border border-blue-200">
                Masa Nyata
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center">
              <button
                onClick={() => setSimMode('sublimation')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  simMode === 'sublimation'
                    ? 'bg-[#0052FF] text-white shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                Sublimasi
              </button>
              <button
                onClick={() => setSimMode('dtf')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  simMode === 'dtf'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600'
                }`}
              >
                DTF Transfer
              </button>
            </div>

            {/* Simulator Controls */}
            <div className="space-y-3 text-xs">
              {simMode === 'sublimation' ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Material Fabrik
                    </label>
                    <select
                      value={simFabricId}
                      onChange={(e) => setSimFabricId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white"
                    >
                      {fabrics.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({formatCurrency(f.sublimation_base_price)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Potongan Pakaian & Kolar
                    </label>
                    <select
                      value={simCutId}
                      onChange={(e) => setSimCutId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white"
                    >
                      {cuts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (+{formatCurrency(c.cut_add_on_price)})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Dimensi Ukuran DTF
                    </label>
                    <select
                      value={simDtfId}
                      onChange={(e) => setSimDtfId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white"
                    >
                      {dtfDimensions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.dimensions_desc})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                      Pilihan Pakaian
                    </label>
                    <select
                      value={simDtfType}
                      onChange={(e) => setSimDtfType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:bg-white"
                    >
                      <option value="with_garment">Termasuk T-Shirt Kapas Combed 24s</option>
                      <option value="film_only">Lembaran Filem Transfer Sahaja</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">
                    Kuantiti Tempahan (Helai)
                  </label>
                  <span className="font-mono font-bold text-[#0052FF]">{simQuantity} helai</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={simQuantity}
                  onChange={(e) => setSimQuantity(Number(e.target.value))}
                  className="w-full accent-[#0052FF]"
                />
              </div>
            </div>

            {/* Calculated Breakdown Display */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Kadar Asas Kasar:</span>
                <span className="font-mono text-slate-800">{formatCurrency(simQuote.rawUnitPrice)}/helai</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Diskaun Kelompok:</span>
                <span className="font-mono text-emerald-700 font-bold">
                  {simQuote.discountPercentage}% ({simQuote.tierLabel})
                </span>
              </div>

              <div className="flex justify-between text-slate-800 font-semibold border-t border-slate-200 pt-1.5">
                <span>Harga Seunit Akhir:</span>
                <span className="font-mono text-[#0052FF] text-sm font-bold">{formatCurrency(simQuote.finalUnitPrice)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Jumlah Kasar ({simQuantity} helai):</span>
                <span className="font-mono text-slate-800">{formatCurrency(simQuote.subtotal)}</span>
              </div>

              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Jumlah Jimat Pelanggan:</span>
                <span className="font-mono">-{formatCurrency(simQuote.totalSavings)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
                <span className="font-bold text-xs uppercase text-slate-600">Sebut Harga Akhir:</span>
                <span className="text-lg font-black font-mono text-[#0052FF]">
                  {formatCurrency(simQuote.finalTotal)}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Sebarang kemas kini pada formula di atas akan terus mengkalibrasi harga di Laman Awam Mobile PWA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
