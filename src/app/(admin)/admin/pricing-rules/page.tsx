'use client';

import React, { useState, useMemo } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import {
  calculateSublimationPrice,
  calculateDtfPrice,
  formatCurrency
} from '@/lib/pricing-calculator';
import {
  RotateCcw,
  Calculator,
  Layers,
  Scissors,
  Printer,
  Percent,
  Check
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

  const [activeTab, setActiveTab] = useState<'sublimation_fabrics' | 'apparel_cuts' | 'dtf_dims' | 'volume_tiers' | 'simulator'>('sublimation_fabrics');

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-slate-800 tracking-tight">
            Formula Harga
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kadar fabrik, potongan kolar, dimensi DTF, dan diskaun kuantiti
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Kembalikan formula harga kepada kadar asal?')) {
              resetToSeedData();
            }
          }}
          className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-xs flex items-center space-x-1.5 transition-all self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset Lalai</span>
        </button>
      </div>

      {/* 2-Panel Settings Layout */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Panel Navigation */}
        <aside className="w-full md:w-56 shrink-0 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs space-y-1 md:sticky md:top-20">
          {[
            { id: 'sublimation_fabrics', label: 'Fabrik Sublimasi', icon: Layers, count: fabrics.length },
            { id: 'apparel_cuts', label: 'Potongan & Kolar', icon: Scissors, count: cuts.length },
            { id: 'dtf_dims', label: 'Dimensi DTF', icon: Printer, count: dtfDimensions.length },
            { id: 'volume_tiers', label: 'Diskaun Kuantiti', icon: Percent, count: tiers.length },
            { id: 'simulator', label: 'Simulator Harga', icon: Calculator },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#001D35]' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/70 text-[#001D35] font-semibold' : 'text-slate-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Right Content Panel */}
        <main className="flex-1 min-w-0 space-y-6">
          {/* TAB 1: FABRIC MATERIALS */}
          {activeTab === 'sublimation_fabrics' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-normal text-slate-800">Fabrik Sublimasi</h2>
                <p className="text-xs text-slate-500 mt-0.5">Kadar harga seunit asas bagi setiap material</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-medium tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Nama Fabrik</th>
                      <th className="py-2.5 px-3">Berat</th>
                      <th className="py-2.5 px-3">Ciri</th>
                      <th className="py-2.5 px-3 text-right">Harga Asas</th>
                      <th className="py-2.5 px-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {fabrics.map((f) => {
                      const isEditing = editingFabricId === f.id;
                      return (
                        <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3">
                            <span className="font-medium text-slate-800 block">{f.name}</span>
                            <span className="text-[11px] text-slate-400">{f.description}</span>
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-600">{f.weight_gsm} GSM</td>
                          <td className="py-3 px-3 text-slate-600">{f.breathability}</td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                            {isEditing ? (
                              <input
                                type="number"
                                value={fabricPriceInput}
                                onChange={(e) => setFabricPriceInput(Number(e.target.value))}
                                className="w-24 px-2 py-1 bg-white border border-[#0B57D0] rounded-lg text-right text-xs font-mono font-medium"
                              />
                            ) : (
                              formatCurrency(f.sublimation_base_price)
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveFabric(f.id)}
                                className="px-3.5 py-1.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white font-medium text-xs shadow-xs transition-all"
                              >
                                Simpan
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingFabricId(f.id);
                                  setFabricPriceInput(f.sublimation_base_price);
                                }}
                                className="px-3.5 py-1 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium transition-all"
                              >
                                Ubah
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
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-normal text-slate-800">Potongan & Kolar</h2>
                <p className="text-xs text-slate-500 mt-0.5">Surcaj tambahan bagi jenis kolar khusus</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-medium tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Jenis Potongan</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                      <th className="py-2.5 px-3 text-right">Surcaj</th>
                      <th className="py-2.5 px-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {cuts.map((c) => {
                      const isEditing = editingCutId === c.id;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-medium text-slate-800">{c.name}</td>
                          <td className="py-3 px-3 text-xs text-slate-500">{c.description}</td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                            {isEditing ? (
                              <input
                                type="number"
                                value={cutPriceInput}
                                onChange={(e) => setCutPriceInput(Number(e.target.value))}
                                className="w-24 px-2 py-1 bg-white border border-[#0B57D0] rounded-lg text-right text-xs font-mono font-medium"
                              />
                            ) : c.cut_add_on_price > 0 ? (
                              `+${formatCurrency(c.cut_add_on_price)}`
                            ) : (
                              'RM 0'
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveCut(c.id)}
                                className="px-3.5 py-1.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white font-medium text-xs shadow-xs transition-all"
                              >
                                Simpan
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingCutId(c.id);
                                  setCutPriceInput(c.cut_add_on_price);
                                }}
                                className="px-3.5 py-1 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium transition-all"
                              >
                                Ubah
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
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-normal text-slate-800">Dimensi DTF</h2>
                <p className="text-xs text-slate-500 mt-0.5">Kadar saiz filem cetakan dan pilihan bersama baju</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-medium tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Saiz</th>
                      <th className="py-2.5 px-3">Ukuran</th>
                      <th className="py-2.5 px-3 text-right">Filem Sahaja</th>
                      <th className="py-2.5 px-3 text-right">Termasuk Baju</th>
                      <th className="py-2.5 px-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {dtfDimensions.map((d) => {
                      const isEditing = editingDtfId === d.id;
                      return (
                        <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-medium text-slate-800">{d.name}</td>
                          <td className="py-3 px-3 font-mono text-slate-500">{d.dimensions_desc}</td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                            {isEditing ? (
                              <input
                                type="number"
                                value={dtfBasePriceInput}
                                onChange={(e) => setDtfBasePriceInput(Number(e.target.value))}
                                className="w-20 px-2 py-1 bg-white border border-[#0B57D0] rounded-lg text-right text-xs font-mono font-medium"
                              />
                            ) : (
                              formatCurrency(d.base_price)
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                            {isEditing ? (
                              <input
                                type="number"
                                value={dtfGarmentPriceInput}
                                onChange={(e) => setDtfGarmentPriceInput(Number(e.target.value))}
                                className="w-20 px-2 py-1 bg-white border border-[#0B57D0] rounded-lg text-right text-xs font-mono font-medium"
                              />
                            ) : (
                              d.garment_included_base_price > 0 ? formatCurrency(d.garment_included_base_price) : '—'
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveDtf(d.id)}
                                className="px-3.5 py-1.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white font-medium text-xs shadow-xs transition-all"
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
                                className="px-3.5 py-1 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium transition-all"
                              >
                                Ubah
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
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-normal text-slate-800">Diskaun Mengikut Kuantiti</h2>
                <p className="text-xs text-slate-500 mt-0.5">Peratusan potongan harga mengikut kelompok tempahan</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-medium tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Peringkat</th>
                      <th className="py-2.5 px-3">Min</th>
                      <th className="py-2.5 px-3">Maks</th>
                      <th className="py-2.5 px-3 text-right">Diskaun</th>
                      <th className="py-2.5 px-3 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {tiers.map((t) => {
                      const isEditing = editingTierId === t.id;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-3 font-medium text-slate-800">{t.tier_label}</td>
                          <td className="py-3 px-3 font-mono text-slate-600">{t.min_qty} helai</td>
                          <td className="py-3 px-3 font-mono text-slate-600">
                            {t.max_qty ? `${t.max_qty} helai` : 'Pukal'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-medium text-emerald-700">
                            {isEditing ? (
                              <input
                                type="number"
                                value={tierDiscountInput}
                                onChange={(e) => setTierDiscountInput(Number(e.target.value))}
                                className="w-16 px-2 py-1 bg-white border border-[#0B57D0] rounded-lg text-right text-xs font-mono font-medium"
                              />
                            ) : (
                              `${t.discount_percentage}%`
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveTier(t.id)}
                                className="px-3.5 py-1.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white font-medium text-xs shadow-xs transition-all"
                              >
                                Simpan
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingTierId(t.id);
                                  setTierDiscountInput(t.discount_percentage);
                                }}
                                className="px-3.5 py-1 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium transition-all"
                              >
                                Ubah
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

          {/* TAB 5: SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-5 max-w-xl">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-normal text-slate-800">Simulator Harga</h2>
                <p className="text-xs text-slate-500 mt-0.5">Ujian pengiraan harga seunit dan diskaun kuantiti secara langsung</p>
              </div>

              {/* Mode Switcher */}
              <div className="bg-slate-100 p-1 rounded-full border border-slate-200 flex items-center">
                <button
                  onClick={() => setSimMode('sublimation')}
                  className={`flex-1 py-1 text-xs font-medium rounded-full transition-all ${
                    simMode === 'sublimation'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sublimasi
                </button>
                <button
                  onClick={() => setSimMode('dtf')}
                  className={`flex-1 py-1 text-xs font-medium rounded-full transition-all ${
                    simMode === 'dtf'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  DTF
                </button>
              </div>

              {/* Simulator Controls */}
              <div className="space-y-4 text-xs">
                {simMode === 'sublimation' ? (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Material Fabrik</label>
                      <select
                        value={simFabricId}
                        onChange={(e) => setSimFabricId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white font-medium"
                      >
                        {fabrics.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({formatCurrency(f.sublimation_base_price)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Potongan & Kolar</label>
                      <select
                        value={simCutId}
                        onChange={(e) => setSimCutId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white font-medium"
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
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Dimensi DTF</label>
                      <select
                        value={simDtfId}
                        onChange={(e) => setSimDtfId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white font-medium"
                      >
                        {dtfDimensions.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.dimensions_desc})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Pilihan Pakaian</label>
                      <select
                        value={simDtfType}
                        onChange={(e) => setSimDtfType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white font-medium"
                      >
                        <option value="with_garment">Termasuk T-Shirt Kapas 24s</option>
                        <option value="film_only">Lembaran Filem Sahaja</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="space-y-1 pt-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] text-slate-500">Kuantiti Tempahan</label>
                    <span className="font-mono font-medium text-slate-800">{simQuantity} helai</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={200}
                    value={simQuantity}
                    onChange={(e) => setSimQuantity(Number(e.target.value))}
                    className="w-full accent-[#0B57D0]"
                  />
                </div>
              </div>

              {/* Calculated Breakdown Display */}
              <div className="p-4 rounded-2xl bg-slate-50 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Harga Asas:</span>
                  <span className="font-mono text-slate-700">{formatCurrency(simQuote.rawUnitPrice)}/helai</span>
                </div>

                <div className="flex justify-between text-slate-500">
                  <span>Diskaun:</span>
                  <span className="font-mono text-emerald-700 font-medium">
                    {simQuote.discountPercentage}% ({simQuote.tierLabel})
                  </span>
                </div>

                <div className="flex justify-between text-slate-700 font-medium border-t border-slate-200 pt-2">
                  <span>Harga Seunit:</span>
                  <span className="font-mono text-[#0B57D0] text-sm font-semibold">{formatCurrency(simQuote.finalUnitPrice)}</span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-800">
                  <span className="text-xs font-medium text-slate-600">Jumlah Sebut Harga:</span>
                  <span className="text-base font-medium font-mono text-[#0B57D0]">
                    {formatCurrency(simQuote.finalTotal)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
