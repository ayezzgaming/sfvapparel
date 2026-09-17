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
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Dynamic Pricing Engine Configuration
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure base fabric rates, cut surcharges, DTF dimensions, and volume tier discount rules.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset pricing rules back to factory defaults?')) {
              resetToSeedData();
            }
          }}
          className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 flex items-center space-x-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restore Default Rates</span>
        </button>
      </div>

      {/* Grid: Left 2 Cols = Rules Tables, Right 1 Col = Live Simulator Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pricing Rules Managers */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sub Navigation Tabs */}
          <div className="bg-slate-900 p-1.5 rounded-2xl border border-slate-800 flex items-center overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('sublimation_fabrics')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'sublimation_fabrics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. Fabric Materials ({fabrics.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('apparel_cuts')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'apparel_cuts'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>2. Apparel Cuts ({cuts.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('dtf_dims')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'dtf_dims'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>3. DTF Dimensions ({dtfDimensions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('volume_tiers')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeTab === 'volume_tiers'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Percent className="w-3.5 h-3.5" />
              <span>4. Volume Tiers ({tiers.length})</span>
            </button>
          </div>

          {/* TAB 1: FABRIC MATERIALS */}
          {activeTab === 'sublimation_fabrics' && (
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Sublimation Fabric Base Pricing</h3>
                  <p className="text-xs text-slate-400">
                    Defines the base unit rate per jersey for each knit weave & weight.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Fabric Name & Spec</th>
                      <th className="p-3">Weight (GSM)</th>
                      <th className="p-3">Breathability</th>
                      <th className="p-3 text-right">Base Price (IDR)</th>
                      <th className="p-3 rounded-r-xl text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {fabrics.map((f) => {
                      const isEditing = editingFabricId === f.id;
                      return (
                        <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3">
                            <span className="font-bold text-slate-200 block">{f.name}</span>
                            <span className="text-[10px] text-slate-500 line-clamp-1">{f.description}</span>
                          </td>
                          <td className="p-3 font-mono text-slate-300">{f.weight_gsm} GSM</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-500/10 text-blue-400">
                              {f.breathability}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            {isEditing ? (
                              <input
                                type="number"
                                value={fabricPriceInput}
                                onChange={(e) => setFabricPriceInput(Number(e.target.value))}
                                className="w-28 px-2 py-1 bg-slate-950 border border-blue-500 rounded text-right text-xs text-white"
                              />
                            ) : (
                              formatCurrency(f.sublimation_base_price)
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveFabric(f.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingFabricId(f.id);
                                  setFabricPriceInput(f.sublimation_base_price);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                              >
                                Edit Rate
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
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Apparel Cut Add-on Surcharges</h3>
                  <p className="text-xs text-slate-400">
                    Additional fee added to base fabric rate for premium sleeves, collars & cuts.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Cut / Pattern Name</th>
                      <th className="p-3">Description</th>
                      <th className="p-3 text-right">Add-on Cost (IDR)</th>
                      <th className="p-3 rounded-r-xl text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {cuts.map((c) => {
                      const isEditing = editingCutId === c.id;
                      return (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-bold text-slate-200">{c.name}</td>
                          <td className="p-3 text-xs text-slate-400 max-w-[200px]">{c.description}</td>
                          <td className="p-3 text-right font-mono font-bold text-amber-400">
                            {isEditing ? (
                              <input
                                type="number"
                                value={cutPriceInput}
                                onChange={(e) => setCutPriceInput(Number(e.target.value))}
                                className="w-24 px-2 py-1 bg-slate-950 border border-blue-500 rounded text-right text-xs text-white"
                              />
                            ) : c.cut_add_on_price > 0 ? (
                              `+${formatCurrency(c.cut_add_on_price)}`
                            ) : (
                              'Included (Rp 0)'
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveCut(c.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingCutId(c.id);
                                  setCutPriceInput(c.cut_add_on_price);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                              >
                                Edit Add-on
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
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">DTF Dimension Sheet Rates</h3>
                <p className="text-xs text-slate-400">
                  Standard direct-to-film dimensions and garment bundle rates.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Size Category</th>
                      <th className="p-3">Dimensions</th>
                      <th className="p-3 text-right">Film Only</th>
                      <th className="p-3 text-right">With Combed 24s Tee</th>
                      <th className="p-3 rounded-r-xl text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {dtfDimensions.map((d) => {
                      const isEditing = editingDtfId === d.id;
                      return (
                        <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-bold text-slate-200">{d.name}</td>
                          <td className="p-3 font-mono text-slate-400">{d.dimensions_desc}</td>
                          <td className="p-3 text-right font-mono font-bold text-orange-400">
                            {isEditing ? (
                              <input
                                type="number"
                                value={dtfBasePriceInput}
                                onChange={(e) => setDtfBasePriceInput(Number(e.target.value))}
                                className="w-20 px-1 py-1 bg-slate-950 border border-blue-500 rounded text-right text-xs text-white"
                              />
                            ) : (
                              formatCurrency(d.base_price)
                            )}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            {isEditing ? (
                              <input
                                type="number"
                                value={dtfGarmentPriceInput}
                                onChange={(e) => setDtfGarmentPriceInput(Number(e.target.value))}
                                className="w-20 px-1 py-1 bg-slate-950 border border-blue-500 rounded text-right text-xs text-white"
                              />
                            ) : (
                              d.garment_included_base_price > 0 ? formatCurrency(d.garment_included_base_price) : 'N/A'
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveDtf(d.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingDtfId(d.id);
                                  setDtfBasePriceInput(d.base_price);
                                  setDtfGarmentPriceInput(d.garment_included_base_price);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                              >
                                Edit Rate
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
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Quantity Tier Volume Discounts</h3>
                <p className="text-xs text-slate-400">
                  Automatic percentage deductions calculated dynamically upon order quantity thresholds.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                    <tr>
                      <th className="p-3 rounded-l-xl">Tier Classification</th>
                      <th className="p-3">Min Qty</th>
                      <th className="p-3">Max Qty</th>
                      <th className="p-3 text-right">Discount %</th>
                      <th className="p-3 rounded-r-xl text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {tiers.map((t) => {
                      const isEditing = editingTierId === t.id;
                      return (
                        <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-bold text-slate-200">{t.tier_label}</td>
                          <td className="p-3 font-mono text-slate-400">{t.min_qty} pcs</td>
                          <td className="p-3 font-mono text-slate-400">
                            {t.max_qty ? `${t.max_qty} pcs` : 'Unlimited (Bulk)'}
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-400">
                            {isEditing ? (
                              <input
                                type="number"
                                value={tierDiscountInput}
                                onChange={(e) => setTierDiscountInput(Number(e.target.value))}
                                className="w-16 px-1 py-1 bg-slate-950 border border-blue-500 rounded text-right text-xs text-white"
                              />
                            ) : (
                              `${t.discount_percentage}% OFF`
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isEditing ? (
                              <button
                                onClick={() => handleSaveTier(t.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                              >
                                Save
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingTierId(t.id);
                                  setTierDiscountInput(t.discount_percentage);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                              >
                                Edit %
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
          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Calculator className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Live Pricing Simulator</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                SANDBOX
              </span>
            </div>

            {/* Mode Switcher */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center">
              <button
                onClick={() => setSimMode('sublimation')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  simMode === 'sublimation'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400'
                }`}
              >
                Sublimation
              </button>
              <button
                onClick={() => setSimMode('dtf')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  simMode === 'dtf'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'text-slate-400'
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Fabric Material
                    </label>
                    <select
                      value={simFabricId}
                      onChange={(e) => setSimFabricId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    >
                      {fabrics.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name} ({formatCurrency(f.sublimation_base_price)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Apparel Cut & Surcharge
                    </label>
                    <select
                      value={simCutId}
                      onChange={(e) => setSimCutId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
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
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      DTF Dimension
                    </label>
                    <select
                      value={simDtfId}
                      onChange={(e) => setSimDtfId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    >
                      {dtfDimensions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.dimensions_desc})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Garment Option
                    </label>
                    <select
                      value={simDtfType}
                      onChange={(e) => setSimDtfType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    >
                      <option value="with_garment">Include Combed 24s Cotton Tee</option>
                      <option value="film_only">Transfer Film Sheet Only</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Order Quantity (Pieces)
                  </label>
                  <span className="font-mono font-bold text-amber-400">{simQuantity} pcs</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={simQuantity}
                  onChange={(e) => setSimQuantity(Number(e.target.value))}
                  className="w-full accent-blue-500 bg-slate-950"
                />
              </div>
            </div>

            {/* Calculated Breakdown Display */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Raw Base Rate:</span>
                <span className="font-mono">{formatCurrency(simQuote.rawUnitPrice)}/pc</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Volume Tier Discount:</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {simQuote.discountPercentage}% ({simQuote.tierLabel})
                </span>
              </div>

              <div className="flex justify-between text-slate-300 font-semibold border-t border-slate-800 pt-1.5">
                <span>Final Unit Price:</span>
                <span className="font-mono text-white text-sm">{formatCurrency(simQuote.finalUnitPrice)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Gross Total ({simQuantity} pcs):</span>
                <span className="font-mono">{formatCurrency(simQuote.subtotal)}</span>
              </div>

              <div className="flex justify-between text-emerald-400 font-semibold">
                <span>Client Total Savings:</span>
                <span className="font-mono">-{formatCurrency(simQuote.totalSavings)}</span>
              </div>

              <div className="flex justify-between items-baseline pt-2 border-t border-slate-800 text-white">
                <span className="font-bold text-xs uppercase text-slate-400">Final Quotation:</span>
                <span className="text-lg font-black font-mono text-amber-400">
                  {formatCurrency(simQuote.finalTotal)}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              Updates to rules in the left tables immediately recalibrate this calculation and sync to the Public Mobile PWA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
