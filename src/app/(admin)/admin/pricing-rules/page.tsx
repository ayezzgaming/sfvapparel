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
  Check,
  Edit3,
  Plus,
  Trash2,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Info,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';
import { ApparelCut, DtfDimension, FabricMaterial, QuantityTierDiscount } from '@/types/database';

export default function AdminPricingRulesPage() {
  const {
    fabrics,
    cuts,
    dtfDimensions,
    tiers,
    addFabric,
    updateFabric,
    deleteFabric,
    addCut,
    updateCut,
    deleteCut,
    addDtfDimension,
    updateDtfDimension,
    deleteDtfDimension,
    addQuantityTier,
    updateQuantityTier,
    deleteQuantityTier,
    isLoadingCms,
    refreshAllDb,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'sublimation_fabrics' | 'apparel_cuts' | 'dtf_dims' | 'volume_tiers' | 'simulator'>('sublimation_fabrics');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  // Modals
  const [fabricModalData, setFabricModalData] = useState<Partial<FabricMaterial> | null>(null);
  const [cutModalData, setCutModalData] = useState<Partial<ApparelCut> | null>(null);
  const [tierModalData, setTierModalData] = useState<Partial<QuantityTierDiscount> | null>(null);
  const [dtfModalData, setDtfModalData] = useState<Partial<DtfDimension> | null>(null);

  // Quick inline price editing states
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

  // Quick save handlers
  const handleSaveFabricInline = (id: string) => {
    updateFabric(id, { sublimation_base_price: fabricPriceInput });
    setEditingFabricId(null);
  };

  const handleSaveCutInline = (id: string) => {
    updateCut(id, { cut_add_on_price: cutPriceInput });
    setEditingCutId(null);
  };

  const handleSaveDtfInline = (id: string) => {
    updateDtfDimension(id, {
      base_price: dtfBasePriceInput,
      garment_included_base_price: dtfGarmentPriceInput,
    });
    setEditingDtfId(null);
  };

  const handleSaveTierInline = (id: string) => {
    updateQuantityTier(id, { discount_percentage: tierDiscountInput });
    setEditingTierId(null);
  };

  // Full Modal Save Handlers
  const handleSaveFabricModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fabricModalData?.name) return;

    if (fabricModalData.id) {
      updateFabric(fabricModalData.id, fabricModalData);
    } else {
      addFabric({
        name: fabricModalData.name || 'Fabrik Baru',
        code: fabricModalData.code || fabricModalData.name.toLowerCase().replace(/\s+/g, '_'),
        weight_gsm: Number(fabricModalData.weight_gsm) || 160,
        breathability: (fabricModalData.breathability as any) || 'High',
        sublimation_base_price: Number(fabricModalData.sublimation_base_price) || 30,
        description: fabricModalData.description || '',
        is_popular: Boolean(fabricModalData.is_popular),
        is_active: fabricModalData.is_active ?? true,
        sort_order: fabrics.length + 1,
      });
    }
    setFabricModalData(null);
  };

  const handleSaveCutModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cutModalData?.name) return;

    if (cutModalData.id) {
      updateCut(cutModalData.id, cutModalData);
    } else {
      addCut({
        name: cutModalData.name || 'Pola Potongan Baru',
        code: cutModalData.code || cutModalData.name.toLowerCase().replace(/\s+/g, '_'),
        cut_add_on_price: Number(cutModalData.cut_add_on_price) || 0,
        description: cutModalData.description || '',
        is_active: cutModalData.is_active ?? true,
        sort_order: cuts.length + 1,
      });
    }
    setCutModalData(null);
  };

  const handleSaveTierModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tierModalData?.tier_label) return;

    if (tierModalData.id) {
      updateQuantityTier(tierModalData.id, {
        tier_label: tierModalData.tier_label,
        min_qty: Number(tierModalData.min_qty) || 1,
        max_qty: tierModalData.max_qty ? Number(tierModalData.max_qty) : null,
        discount_percentage: Number(tierModalData.discount_percentage) || 0,
      });
    } else {
      addQuantityTier({
        tier_label: tierModalData.tier_label || 'Tier Baru',
        min_qty: Number(tierModalData.min_qty) || 1,
        max_qty: tierModalData.max_qty ? Number(tierModalData.max_qty) : null,
        discount_percentage: Number(tierModalData.discount_percentage) || 0,
      });
    }
    setTierModalData(null);
  };

  const handleSaveDtfModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dtfModalData?.name) return;

    if (dtfModalData.id) {
      updateDtfDimension(dtfModalData.id, dtfModalData);
    } else {
      addDtfDimension({
        name: dtfModalData.name || 'Format DTF Baru',
        code: dtfModalData.code || dtfModalData.name.toLowerCase().replace(/\s+/g, '_'),
        dimensions_desc: dtfModalData.dimensions_desc || 'A3 Size',
        base_price: Number(dtfModalData.base_price) || 10,
        garment_included_base_price: Number(dtfModalData.garment_included_base_price) || 25,
        is_meter_rate: Boolean(dtfModalData.is_meter_rate),
        description: dtfModalData.description || '',
        is_active: dtfModalData.is_active ?? true,
        sort_order: dtfDimensions.length + 1,
      });
    }
    setDtfModalData(null);
  };

  return (
    <div className="w-full h-full overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950 flex flex-col p-4 gap-3 text-slate-900 dark:text-zinc-100 font-sans select-none">
      
      {/* ----------------- TOP TOOLBAR BAR ----------------- */}
      <div className="shrink-0 flex items-center justify-between gap-3 min-h-[38px]">
        {/* Title & Active Badge */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
              Formula Harga & Borang Tempahan
            </span>
            <span className="text-[10px] font-semibold text-[#00BDFF] bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-900">
              {activeTab === 'sublimation_fabrics' && `Jenis Fabrik (${fabrics.length})`}
              {activeTab === 'apparel_cuts' && `Pola & Kolar (${cuts.length})`}
              {activeTab === 'volume_tiers' && `Diskaun Kuantiti (${tiers.length})`}
              {activeTab === 'dtf_dims' && `Dimensi DTF (${dtfDimensions.length})`}
              {activeTab === 'simulator' && 'Simulator Sebut Harga'}
            </span>
          </div>
        </div>

        {/* Toolbar Kanan */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refreshAllDb()}
            disabled={isLoadingCms}
            className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:text-zinc-200 text-xs font-medium border border-slate-200 dark:border-zinc-700 shadow-2xs flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-slate-500 ${isLoadingCms ? 'animate-spin' : ''}`} />
            <span>{isLoadingCms ? 'Memuatkan...' : 'Muat Semula'}</span>
          </button>
        </div>
      </div>

      {/* ----------------- 1 MAIN CARD (SPLIT LAYOUT) ----------------- */}
      <div className="flex-1 min-h-0 flex overflow-hidden bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-xs relative">
        
        {/* LEFT PANEL: Categories Navigation (Collapsible) */}
        <div
          className={`shrink-0 transition-all duration-300 ease-in-out border-r border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col h-full overflow-hidden ${
            isLeftPanelCollapsed ? 'w-0 border-r-0 overflow-hidden' : 'w-64 sm:w-72'
          }`}
        >
          {/* Header Panel Kiri */}
          <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-zinc-800/50">
            <h2 className="text-xs font-bold text-slate-800 dark:text-zinc-100 uppercase tracking-wider">
              Kategori Formula
            </h2>
            <span className="text-[10px] font-semibold text-slate-400 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-2 py-0.5 rounded-full">
              5 Modul
            </span>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {[
              { id: 'sublimation_fabrics', label: 'Jenis Fabrik', icon: Layers, count: fabrics.length, desc: 'Material asas sublimasi' },
              { id: 'apparel_cuts', label: 'Pola & Kolar', icon: Scissors, count: cuts.length, desc: 'Pilihan potongan & kolar' },
              { id: 'volume_tiers', label: 'Diskaun Kuantiti', icon: Percent, count: tiers.length, desc: 'Tier diskaun pukal' },
              { id: 'dtf_dims', label: 'Dimensi DTF', icon: Printer, count: dtfDimensions.length, desc: 'Format saiz & filem/baju' },
              { id: 'simulator', label: 'Simulator Harga', icon: Calculator, desc: 'Kalkulator sebut harga' },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#C2E7FF] dark:bg-sky-950 text-[#001D35] dark:text-[#00BDFF] font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-[#00BDFF] text-white' : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="block truncate font-bold">{tab.label}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{tab.desc}</span>
                    </div>
                  </div>
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                      isActive
                        ? 'bg-white/80 dark:bg-sky-900 text-[#001D35] dark:text-[#00BDFF]'
                        : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Tab Content Area with internal scroll */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden bg-slate-50/40 dark:bg-zinc-900/40 relative">
          
          {/* FLOATING CAPSULE TOGGLE HANDLE (LEFT EDGE OF RIGHT PANEL) */}
          <button
            type="button"
            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-5 h-12 bg-white dark:bg-zinc-800 border-y border-r border-slate-200 dark:border-zinc-700 rounded-r-full shadow-md flex items-center justify-center text-slate-500 hover:text-[#00BDFF] dark:hover:text-[#00BDFF] transition-all cursor-pointer"
            title={isLeftPanelCollapsed ? 'Buka Kategori Formula' : 'Tutup Kategori Formula'}
            aria-label="Toggle Left Panel"
          >
            {isLeftPanelCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Tab Content Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* TAB 1: FABRIC MATERIALS */}
            {activeTab === 'sublimation_fabrics' && (
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Jenis Fabrik (Material Sublimasi)</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Pilihan material kain sublimasi beserta harga seunit asas.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFabricModalData({
                      name: '',
                      code: '',
                      weight_gsm: 160,
                      breathability: 'High',
                      sublimation_base_price: 35.00,
                      description: '',
                      is_popular: false,
                      is_active: true,
                    })}
                    className="px-4 py-2 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Fabrik</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/80 dark:bg-zinc-800/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-zinc-700">
                      <tr>
                        <th className="py-3 px-3.5">Nama Fabrik</th>
                        <th className="py-3 px-3.5">Berat (GSM)</th>
                        <th className="py-3 px-3.5">Pengudaraan</th>
                        <th className="py-3 px-3.5 text-right">Harga Asas / Helai</th>
                        <th className="py-3 px-3.5 text-center">Status</th>
                        <th className="py-3 px-3.5 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {fabrics.map((f) => {
                        const isEditing = editingFabricId === f.id;
                        return (
                          <tr key={f.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3.5 px-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-zinc-100">{f.name}</span>
                                {f.is_popular && (
                                  <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.2 rounded-full font-bold">
                                    POPULAR
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 line-clamp-1">{f.description || 'Tiada deskripsi'}</span>
                            </td>
                            <td className="py-3.5 px-3.5 font-mono text-slate-600 dark:text-zinc-400">{f.weight_gsm} GSM</td>
                            <td className="py-3.5 px-3.5 text-slate-600 dark:text-zinc-400">{f.breathability}</td>
                            <td className="py-3.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  value={fabricPriceInput}
                                  onChange={(e) => setFabricPriceInput(Number(e.target.value))}
                                  className="w-20 px-2 py-1 bg-white dark:bg-zinc-800 border border-[#00BDFF] rounded-lg text-right text-xs font-mono font-bold"
                                />
                              ) : (
                                formatCurrency(f.sublimation_base_price)
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => updateFabric(f.id, { is_active: !f.is_active })}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                  f.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                                }`}
                              >
                                {f.is_active ? 'Aktif' : 'Nyahaktif'}
                              </button>
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {isEditing ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSaveFabricInline(f.id)}
                                    className="p-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                                    title="Simpan"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingFabricId(f.id);
                                      setFabricPriceInput(f.sublimation_base_price);
                                    }}
                                    className="p-1 rounded-full text-slate-400 hover:text-[#00BDFF] hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    title="Edit Cepat Harga"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setFabricModalData(f)}
                                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                  title="Edit Lengkap"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Padam fabrik ${f.name}?`)) deleteFabric(f.id);
                                  }}
                                  className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                  title="Padam"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: APPAREL CUTS (POLA & KOLAR) */}
            {activeTab === 'apparel_cuts' && (
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Pola Potongan & Kolar Baju</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Kadar caj tambahan mengikut jenis potongan atau kolar.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCutModalData({
                      name: '',
                      code: '',
                      cut_add_on_price: 0,
                      description: '',
                      is_active: true,
                    })}
                    className="px-4 py-2 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Pola</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/80 dark:bg-zinc-800/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-zinc-700">
                      <tr>
                        <th className="py-3 px-3.5">Nama Pola / Kolar</th>
                        <th className="py-3 px-3.5">Kod Sistem</th>
                        <th className="py-3 px-3.5 text-right">Caj Tambahan (RM)</th>
                        <th className="py-3 px-3.5 text-center">Status</th>
                        <th className="py-3 px-3.5 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {cuts.map((c) => {
                        const isEditing = editingCutId === c.id;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3.5 px-3.5">
                              <span className="font-bold text-slate-900 dark:text-zinc-100 block">{c.name}</span>
                              <span className="text-[11px] text-slate-400">{c.description || 'Tiada deskripsi'}</span>
                            </td>
                            <td className="py-3.5 px-3.5 font-mono text-slate-500">{c.code}</td>
                            <td className="py-3.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  value={cutPriceInput}
                                  onChange={(e) => setCutPriceInput(Number(e.target.value))}
                                  className="w-20 px-2 py-1 bg-white dark:bg-zinc-800 border border-[#00BDFF] rounded-lg text-right text-xs font-mono font-bold"
                                />
                              ) : (
                                c.cut_add_on_price > 0 ? `+${formatCurrency(c.cut_add_on_price)}` : 'Percuma (RM 0.00)'
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => updateCut(c.id, { is_active: !c.is_active })}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                  c.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                                }`}
                              >
                                {c.is_active ? 'Aktif' : 'Nyahaktif'}
                              </button>
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {isEditing ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSaveCutInline(c.id)}
                                    className="p-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingCutId(c.id);
                                      setCutPriceInput(c.cut_add_on_price);
                                    }}
                                    className="p-1 rounded-full text-slate-400 hover:text-[#00BDFF] hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    title="Edit Caj"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setCutModalData(c)}
                                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                  title="Edit Lengkap"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Padam pola ${c.name}?`)) deleteCut(c.id);
                                  }}
                                  className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: QUANTITY TIER DISCOUNTS */}
            {activeTab === 'volume_tiers' && (
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Diskaun Kuantiti Pukal (Volume Tiers)</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Peratusan diskaun automatik mengikut jumlah tempahan baju.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTierModalData({
                      tier_label: '',
                      min_qty: 1,
                      max_qty: null,
                      discount_percentage: 0,
                    })}
                    className="px-4 py-2 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Tier Diskaun</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/80 dark:bg-zinc-800/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-zinc-700">
                      <tr>
                        <th className="py-3 px-3.5">Label Tier</th>
                        <th className="py-3 px-3.5">Julat Kuantiti</th>
                        <th className="py-3 px-3.5 text-right">Kadar Diskaun (%)</th>
                        <th className="py-3 px-3.5 text-center">Status</th>
                        <th className="py-3 px-3.5 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {tiers.map((t) => {
                        const isEditing = editingTierId === t.id;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3.5 px-3.5 font-bold text-slate-900 dark:text-zinc-100">{t.tier_label}</td>
                            <td className="py-3.5 px-3.5 font-mono text-slate-600 dark:text-zinc-400">
                              {t.min_qty} - {t.max_qty ? `${t.max_qty} helai` : 'Ke atas'}
                            </td>
                            <td className="py-3.5 px-3.5 text-right font-mono font-bold text-emerald-600">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={tierDiscountInput}
                                  onChange={(e) => setTierDiscountInput(Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-white dark:bg-zinc-800 border border-[#00BDFF] rounded-lg text-right text-xs font-mono font-bold"
                                />
                              ) : (
                                `${t.discount_percentage}% OFF`
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400">
                                Aktif
                              </span>
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {isEditing ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSaveTierInline(t.id)}
                                    className="p-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTierId(t.id);
                                      setTierDiscountInput(t.discount_percentage);
                                    }}
                                    className="p-1 rounded-full text-slate-400 hover:text-[#00BDFF] hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                    title="Edit Diskaun"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setTierModalData(t)}
                                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Padam tier ${t.tier_label}?`)) deleteQuantityTier(t.id);
                                  }}
                                  className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 4: DTF DIMENSIONS */}
            {activeTab === 'dtf_dims' && (
              <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Format & Dimensi Cetakan DTF</h2>
                    <p className="text-xs text-slate-500 mt-0.5">Penetapan harga untuk filem DTF sahaja atau cetakan siap t-shirt.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDtfModalData({
                      name: '',
                      dimensions_desc: '',
                      base_price: 10,
                      garment_included_base_price: 25,
                      is_meter_rate: false,
                      description: '',
                      is_active: true,
                    })}
                    className="px-4 py-2 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Saiz DTF</span>
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-zinc-800">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50/80 dark:bg-zinc-800/80 text-slate-500 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200 dark:border-zinc-700">
                      <tr>
                        <th className="py-3 px-3.5">Format Saiz</th>
                        <th className="py-3 px-3.5">Ukuran</th>
                        <th className="py-3 px-3.5 text-right">Filem Sahaja</th>
                        <th className="py-3 px-3.5 text-right">Siap Baju (Cotton)</th>
                        <th className="py-3 px-3.5 text-center">Status</th>
                        <th className="py-3 px-3.5 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {dtfDimensions.map((d) => {
                        const isEditing = editingDtfId === d.id;
                        return (
                          <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                            <td className="py-3.5 px-3.5 font-bold text-slate-900 dark:text-zinc-100">{d.name}</td>
                            <td className="py-3.5 px-3.5 font-mono text-slate-500">{d.dimensions_desc}</td>
                            <td className="py-3.5 px-3.5 text-right font-mono font-bold text-slate-900 dark:text-zinc-100">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  value={dtfBasePriceInput}
                                  onChange={(e) => setDtfBasePriceInput(Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-white dark:bg-zinc-800 border border-[#00BDFF] rounded-lg text-right text-xs font-mono font-bold"
                                />
                              ) : (
                                formatCurrency(d.base_price)
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 text-right font-mono font-bold text-sky-600">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  value={dtfGarmentPriceInput}
                                  onChange={(e) => setDtfGarmentPriceInput(Number(e.target.value))}
                                  className="w-16 px-2 py-1 bg-white dark:bg-zinc-800 border border-[#00BDFF] rounded-lg text-right text-xs font-mono font-bold"
                                />
                              ) : (
                                formatCurrency(d.garment_included_base_price)
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              <button
                                type="button"
                                onClick={() => updateDtfDimension(d.id, { is_active: !d.is_active })}
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                                  d.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-slate-100 dark:bg-zinc-800 text-slate-400'
                                }`}
                              >
                                {d.is_active ? 'Aktif' : 'Nyahaktif'}
                              </button>
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {isEditing ? (
                                  <button
                                    type="button"
                                    onClick={() => handleSaveDtfInline(d.id)}
                                    className="p-1 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 cursor-pointer"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingDtfId(d.id);
                                      setDtfBasePriceInput(d.base_price);
                                      setDtfGarmentPriceInput(d.garment_included_base_price);
                                    }}
                                    className="p-1 rounded-full text-slate-400 hover:text-[#00BDFF] hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setDtfModalData(d)}
                                  className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                                >
                                  <SlidersHorizontal className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm(`Padam dimensi ${d.name}?`)) deleteDtfDimension(d.id);
                                  }}
                                  className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 5: PRICE SIMULATOR */}
            {activeTab === 'simulator' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Form Controls */}
                <div className="lg:col-span-7 bg-white dark:bg-zinc-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <Calculator className="w-4 h-4 text-[#00BDFF]" />
                        <span>Simulator Sebut Harga Kilang</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">Uji formula harga secara masa nyata mengikut spesifikasi tempahan.</p>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-full border border-slate-200 dark:border-zinc-700">
                    <button
                      type="button"
                      onClick={() => setSimMode('sublimation')}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        simMode === 'sublimation'
                          ? 'bg-[#00BDFF] text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-[#00BDFF]'
                      }`}
                    >
                      Jersi Sublimasi Penuh
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimMode('dtf')}
                      className={`flex-1 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                        simMode === 'dtf'
                          ? 'bg-[#00BDFF] text-white shadow-xs'
                          : 'text-slate-600 dark:text-zinc-400 hover:text-[#00BDFF]'
                      }`}
                    >
                      Cetakan Baju DTF
                    </button>
                  </div>

                  {/* Specific Controls */}
                  {simMode === 'sublimation' ? (
                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">Pilihan Fabrik</label>
                        <select
                          value={simFabricId}
                          onChange={(e) => setSimFabricId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium text-slate-800 dark:text-zinc-100"
                        >
                          {fabrics.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name} ({f.weight_gsm} GSM) - RM {f.sublimation_base_price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">Pola & Kolar</label>
                        <select
                          value={simCutId}
                          onChange={(e) => setSimCutId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium text-slate-800 dark:text-zinc-100"
                        >
                          {cuts.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name} {c.cut_add_on_price > 0 ? `(+RM ${c.cut_add_on_price.toFixed(2)})` : '(Percuma)'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 text-xs">
                      <div>
                        <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">Dimensi DTF</label>
                        <select
                          value={simDtfId}
                          onChange={(e) => setSimDtfId(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium text-slate-800 dark:text-zinc-100"
                        >
                          {dtfDimensions.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.dimensions_desc})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">Pakej DTF</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setSimDtfType('film_only')}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              simDtfType === 'film_only'
                                ? 'border-[#00BDFF] bg-sky-50 dark:bg-sky-950/40 text-[#00BDFF]'
                                : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800'
                            }`}
                          >
                            <span className="font-bold block">Filem Sahaja</span>
                            <span className="text-[10px] text-slate-500">Customer bawa baju sendiri</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSimDtfType('with_garment')}
                            className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                              simDtfType === 'with_garment'
                                ? 'border-[#00BDFF] bg-sky-50 dark:bg-sky-950/40 text-[#00BDFF]'
                                : 'border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800'
                            }`}
                          >
                            <span className="font-bold block">Siap Baju Cotton</span>
                            <span className="text-[10px] text-slate-500">Termasuk 100% Combed Cotton</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quantity Slider */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-xs">
                      <label className="font-bold text-slate-700 dark:text-zinc-300">Kuantiti Tempahan</label>
                      <span className="font-mono font-bold text-slate-900 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 px-3 py-1 rounded-full">
                        {simQuantity} Helai
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="500"
                      value={simQuantity}
                      onChange={(e) => setSimQuantity(Number(e.target.value))}
                      className="w-full accent-[#00BDFF] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>1 helai</span>
                      <span>50 helai</span>
                      <span>150 helai</span>
                      <span>300 helai</span>
                      <span>500+ helai</span>
                    </div>
                  </div>
                </div>

                {/* Live Quote Output Card */}
                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#00BDFF] uppercase tracking-wider">
                        Hasil Sebut Harga Automatik
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white">
                        Masa Nyata
                      </span>
                    </div>

                    <div className="pt-2">
                      <span className="text-xs text-slate-400 block">Jumlah Anggaran Sebut Harga</span>
                      <span className="text-3xl sm:text-4xl font-black text-[#00BDFF] font-mono">
                        {formatCurrency(simQuote.finalTotal)}
                      </span>
                      <span className="text-xs text-slate-300 font-mono mt-1 block">
                        Kadar Seunit: <strong className="text-white">{formatCurrency(simQuote.finalUnitPrice)}</strong> / helai
                      </span>
                    </div>

                    {/* Breakdown */}
                    <div className="pt-4 border-t border-white/10 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-300">
                        <span>Harga Asas Seunit:</span>
                        <span className="font-mono">{formatCurrency(simQuote.rawUnitPrice)}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Diskaun Pukal Dikenakan:</span>
                        <span className="font-mono text-emerald-400 font-bold">
                          {simQuote.discountPercentage > 0 ? `-${simQuote.discountPercentage}% OFF (${formatCurrency(simQuote.totalSavings)})` : 'Tiada'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Tier Kuantiti Aktif:</span>
                        <span className="font-bold text-white">{simQuote.tierLabel}</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Deposit 50% Diperlukan:</span>
                        <span className="font-mono text-[#00BDFF] font-bold">
                          {formatCurrency(simQuote.finalTotal * 0.5)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 text-[11px] text-slate-400 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-[#00BDFF] shrink-0 mt-0.5" />
                    <span>
                      Formula ini diselaraskan secara automatik dengan Borang Tempahan Kustom yang diakses oleh pelanggan awam.
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ----------------- MODALS ----------------- */}

      {/* MODAL: FABRIC MATERIAL (ADD / EDIT) */}
      {fabricModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveFabricModal} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {fabricModalData.id ? 'Edit Fabrik' : 'Tambah Fabrik Baru'}
              </h3>
              <button type="button" onClick={() => setFabricModalData(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Nama Fabrik *</label>
                <input
                  type="text"
                  required
                  value={fabricModalData.name || ''}
                  onChange={(e) => setFabricModalData({ ...fabricModalData, name: e.target.value })}
                  placeholder="cth: Microfiber Eyelet Premium"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Berat GSM *</label>
                  <input
                    type="number"
                    required
                    value={fabricModalData.weight_gsm || 160}
                    onChange={(e) => setFabricModalData({ ...fabricModalData, weight_gsm: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Pengudaraan *</label>
                  <select
                    value={fabricModalData.breathability || 'High'}
                    onChange={(e) => setFabricModalData({ ...fabricModalData, breathability: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                  >
                    <option value="High">High</option>
                    <option value="Ultra-High">Ultra-High</option>
                    <option value="Medium">Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Harga Asas Sublimasi (RM) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={fabricModalData.sublimation_base_price || 35}
                  onChange={(e) => setFabricModalData({ ...fabricModalData, sublimation_base_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono text-[#00BDFF] font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Deskripsi Ringkas</label>
                <textarea
                  rows={2}
                  value={fabricModalData.description || ''}
                  onChange={(e) => setFabricModalData({ ...fabricModalData, description: e.target.value })}
                  placeholder="Kain serap peluh cepat kering, sesuai sukan aktif."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={fabricModalData.is_popular || false}
                    onChange={(e) => setFabricModalData({ ...fabricModalData, is_popular: e.target.checked })}
                    className="rounded accent-[#00BDFF]"
                  />
                  <span>Tag Popular</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-zinc-300">
                  <input
                    type="checkbox"
                    checked={fabricModalData.is_active ?? true}
                    onChange={(e) => setFabricModalData({ ...fabricModalData, is_active: e.target.checked })}
                    className="rounded accent-[#00BDFF]"
                  />
                  <span>Aktif di Borang</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setFabricModalData(null)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
              >
                Simpan Fabrik
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: APPAREL CUT (ADD / EDIT) */}
      {cutModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveCutModal} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {cutModalData.id ? 'Edit Pola / Kolar' : 'Tambah Pola / Kolar Baru'}
              </h3>
              <button type="button" onClick={() => setCutModalData(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Nama Pola / Kolar *</label>
                <input
                  type="text"
                  required
                  value={cutModalData.name || ''}
                  onChange={(e) => setCutModalData({ ...cutModalData, name: e.target.value })}
                  placeholder="cth: Kolar Berkolar V-Neck"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Caj Tambahan (RM) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={cutModalData.cut_add_on_price || 0}
                  onChange={(e) => setCutModalData({ ...cutModalData, cut_add_on_price: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono text-[#00BDFF] font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Letak 0 jika tiada caj tambahan.</span>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Deskripsi Ringkas</label>
                <textarea
                  rows={2}
                  value={cutModalData.description || ''}
                  onChange={(e) => setCutModalData({ ...cutModalData, description: e.target.value })}
                  placeholder="Potongan standard leher bulat atau kolar polo."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-zinc-300 pt-1">
                <input
                  type="checkbox"
                  checked={cutModalData.is_active ?? true}
                  onChange={(e) => setCutModalData({ ...cutModalData, is_active: e.target.checked })}
                  className="rounded accent-[#00BDFF]"
                />
                <span>Aktif di Borang Tempahan</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setCutModalData(null)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
              >
                Simpan Pola
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: QUANTITY TIER (ADD / EDIT) */}
      {tierModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveTierModal} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {tierModalData.id ? 'Edit Tier Diskaun' : 'Tambah Tier Diskaun Baru'}
              </h3>
              <button type="button" onClick={() => setTierModalData(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Nama / Label Tier *</label>
                <input
                  type="text"
                  required
                  value={tierModalData.tier_label || ''}
                  onChange={(e) => setTierModalData({ ...tierModalData, tier_label: e.target.value })}
                  placeholder="cth: Pukal Kelab 30-49 helai"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Min Kuantiti *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tierModalData.min_qty || 1}
                    onChange={(e) => setTierModalData({ ...tierModalData, min_qty: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Maks Kuantiti</label>
                  <input
                    type="number"
                    value={tierModalData.max_qty ?? ''}
                    onChange={(e) => setTierModalData({ ...tierModalData, max_qty: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Tiada had"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Kadar Diskaun (%) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={tierModalData.discount_percentage || 0}
                  onChange={(e) => setTierModalData({ ...tierModalData, discount_percentage: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono text-emerald-600 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setTierModalData(null)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
              >
                Simpan Tier
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DTF DIMENSION (ADD / EDIT) */}
      {dtfModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form onSubmit={handleSaveDtfModal} className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {dtfModalData.id ? 'Edit Saiz DTF' : 'Tambah Saiz DTF Baru'}
              </h3>
              <button type="button" onClick={() => setDtfModalData(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Nama Format DTF *</label>
                <input
                  type="text"
                  required
                  value={dtfModalData.name || ''}
                  onChange={(e) => setDtfModalData({ ...dtfModalData, name: e.target.value })}
                  placeholder="cth: A3 Large Print"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Dimensi / Ukuran *</label>
                <input
                  type="text"
                  required
                  value={dtfModalData.dimensions_desc || ''}
                  onChange={(e) => setDtfModalData({ ...dtfModalData, dimensions_desc: e.target.value })}
                  placeholder="cth: 29.7 x 42 cm"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Harga Filem Sahaja (RM) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={dtfModalData.base_price || 10}
                    onChange={(e) => setDtfModalData({ ...dtfModalData, base_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-zinc-300 block mb-1">Harga Siap Baju (RM) *</label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={dtfModalData.garment_included_base_price || 25}
                    onChange={(e) => setDtfModalData({ ...dtfModalData, garment_included_base_price: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono text-[#00BDFF] font-bold"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-zinc-300 pt-1">
                <input
                  type="checkbox"
                  checked={dtfModalData.is_active ?? true}
                  onChange={(e) => setDtfModalData({ ...dtfModalData, is_active: e.target.checked })}
                  className="rounded accent-[#00BDFF]"
                />
                <span>Aktif di Borang Tempahan</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setDtfModalData(null)}
                className="px-4 py-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white text-xs font-bold cursor-pointer"
              >
                Simpan Saiz DTF
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
