'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { Design, PrintType } from '@/types/database';
import { saveDesignDb, deleteDesignDb } from '@/app/actions/designActions';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Star,
  UploadCloud,
  X,
  RefreshCw,
  ImageIcon,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Layers,
} from 'lucide-react';

const CATEGORIES = ['Jersey', 'T-Shirt', 'Hoodie', 'Polo', 'Windbreaker', 'Singlet', 'Merchandise'];

const PRINT_LABELS: Record<string, { label: string; color: string }> = {
  sublimation: { label: 'Sublimasi', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  dtf: { label: 'DTF', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
};

interface CompressionInfo {
  originalKb: number;
  compressedKb: number;
  percentSaved: number;
}

export default function AdminCatalogPage() {
  const { designs, addDesign, updateDesign, deleteDesign } = useAppStore();

  // Layout
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [activeView, setActiveView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeDesignIndex, setActiveDesignIndex] = useState(0);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Jersey');
  const [printType, setPrintType] = useState<PrintType>('sublimation');
  const [imageUrl, setImageUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredDesigns = designs.filter((d) => {
    if (filterType !== 'all' && d.print_type !== filterType) return false;
    if (filterCategory !== 'all' && d.category !== filterCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!d.title.toLowerCase().includes(q) && !d.category.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  useEffect(() => {
    if (filteredDesigns.length > 0 && activeDesignIndex >= filteredDesigns.length) {
      setActiveDesignIndex(filteredDesigns.length - 1);
    }
  }, [filteredDesigns.length, activeDesignIndex]);

  const activeDesign = filteredDesigns[activeDesignIndex] || null;
  const typeInfo = activeDesign
    ? (PRINT_LABELS[activeDesign.print_type] || { label: activeDesign.print_type, color: 'bg-slate-100 text-slate-600 border-slate-200' })
    : null;

  const handlePrev = () => setActiveDesignIndex((i) => (i - 1 + filteredDesigns.length) % filteredDesigns.length);
  const handleNext = () => setActiveDesignIndex((i) => (i + 1) % filteredDesigns.length);

  const handleOpenAdd = () => {
    setEditingDesign(null); setTitle(''); setCategory('Jersey'); setPrintType('sublimation');
    setImageUrl(''); setIsFeatured(false); setCompressionInfo(null); setIsModalOpen(true);
  };

  const handleOpenEdit = (design: Design) => {
    setEditingDesign(design); setTitle(design.title); setCategory(design.category);
    setPrintType(design.print_type); setImageUrl(design.thumbnail_url || design.mockup_front_url || '');
    setIsFeatured(!!design.is_featured); setCompressionInfo(null); setIsModalOpen(true);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) { alert('Sila pilih fail imej yang sah.'); return; }
    const originalSizeKb = Math.round(file.size / 1024);
    setIsProcessingImage(true); setCompressionInfo(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = e.target?.result as string;
      if (file.type === 'image/svg+xml') { setImageUrl(raw); setIsProcessingImage(false); return; }
      const img = new Image();
      img.onload = () => {
        const maxDim = 1000;
        let w = img.width, h = img.height;
        if (w > h) { if (w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; } }
        else { if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; } }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, w, h); ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high'; ctx.drawImage(img, 0, 0, w, h);
          let opt = '';
          try { opt = canvas.toDataURL('image/webp', 0.82); if (!opt.startsWith('data:image/webp')) opt = canvas.toDataURL('image/png'); }
          catch { opt = canvas.toDataURL('image/png'); }
          const ckb = Math.round(((opt.length - (opt.indexOf(',') + 1)) * 3) / 4 / 1024);
          setCompressionInfo({ originalKb: originalSizeKb, compressedKb: ckb, percentSaved: Math.max(0, Math.round(((originalSizeKb - ckb) / Math.max(1, originalSizeKb)) * 100)) });
          setImageUrl(opt);
        } else { setImageUrl(raw); }
        setIsProcessingImage(false);
      };
      img.onerror = () => { setImageUrl(raw); setIsProcessingImage(false); };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (f) processImageFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim() || !imageUrl) return;
    setIsSaving(true);
    const tags = [category.toLowerCase(), printType === 'sublimation' ? 'sublimasi' : 'dtf', 'kustom'];
    try {
      if (editingDesign) {
        const u: Design = { ...editingDesign, title: title.trim(), category, print_type: printType, thumbnail_url: imageUrl, mockup_front_url: imageUrl, tags: editingDesign.tags?.length ? editingDesign.tags : tags, is_featured: isFeatured };
        updateDesign(editingDesign.id, u); await saveDesignDb(u);
      } else {
        const n: Design = { id: `des-${Date.now()}`, title: title.trim(), category, print_type: printType, thumbnail_url: imageUrl, mockup_front_url: imageUrl, tags, is_featured: isFeatured, is_active: true, created_at: new Date().toISOString() };
        addDesign(n); await saveDesignDb(n);
      }
      setSaveSuccessMessage('Rekaan berjaya disimpan.'); setTimeout(() => setSaveSuccessMessage(null), 3000);
    } catch { /* Ignore */ } finally { setIsSaving(false); setIsModalOpen(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Padam rekaan ini?')) { deleteDesign(id); try { await deleteDesignDb(id); } catch { /* Ignore */ } }
  };

  const checkerBg = 'bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%),linear-gradient(-45deg,#f8fafc_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#f8fafc_75%),linear-gradient(-45deg,transparent_75%,#f8fafc_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0px] bg-slate-50';

  return (
    <div className="flex flex-col select-none" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Toast */}
      {saveSuccessMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-700 flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /><span>{saveSuccessMessage}</span>
        </div>
      )}

      {/* Header Bar — matches Ads Generator */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
          {[
            { id: 'all', label: `Semua (${designs.length})` },
            { id: 'sublimation', label: `Sublimasi (${designs.filter((d) => d.print_type === 'sublimation').length})` },
            { id: 'dtf', label: `DTF (${designs.filter((d) => d.print_type === 'dtf').length})` },
          ].map((tab) => (
            <button key={tab.id} type="button" onClick={() => setFilterType(tab.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${filterType === tab.id ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            <button type="button" onClick={() => setActiveView('grid')} title="Grid"
              className={`p-1.5 rounded-lg transition-colors ${activeView === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={() => setActiveView('list')} title="Senarai"
              className={`p-1.5 rounded-lg transition-colors ${activeView === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <button type="button" onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium shadow-xs transition-all cursor-pointer">
            <Plus className="w-3.5 h-3.5" /><span>Tambah Rekaan</span>
          </button>
        </div>
      </div>

      {/* Split Panel Body */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-stretch">

        {/* LEFT PANEL */}
        <div className={`flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out border-r border-slate-200/60 bg-slate-50/60 ${isLeftPanelCollapsed ? 'w-0 opacity-0 overflow-hidden pointer-events-none' : 'w-[300px] xl:w-[340px] opacity-100'}`}>
          {/* Search + Category chips */}
          <div className="p-3 space-y-2 border-b border-slate-100 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama rekaan..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-white text-xs text-slate-800 placeholder-slate-400 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300" />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={() => setFilterCategory('all')}
                className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${filterCategory === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                Semua
              </button>
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setFilterCategory(cat)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all border ${filterCategory === cat ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="px-3 py-2 shrink-0">
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{filteredDesigns.length} rekaan dijumpai</span>
          </div>
          {/* Scrollable list */}
          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3">
            {filteredDesigns.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center space-y-2 text-slate-400">
                <ImageIcon className="w-7 h-7" /><p className="text-xs">Tiada rekaan dijumpai</p>
              </div>
            ) : activeView === 'grid' ? (
              <div className="grid grid-cols-2 gap-2 pt-1">
                {filteredDesigns.map((item, idx) => {
                  const isActive = idx === activeDesignIndex;
                  return (
                    <button key={item.id} type="button" onClick={() => setActiveDesignIndex(idx)}
                      className={`group relative rounded-xl overflow-hidden border transition-all text-left ${isActive ? 'border-slate-900 ring-2 ring-slate-900/10 shadow-md' : 'border-slate-200 hover:border-slate-400 bg-white'}`}>
                      <div className="aspect-square w-full bg-slate-50 flex items-center justify-center p-1.5 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.thumbnail_url || item.mockup_front_url || '/images/prod_sportswear.jpg'} alt={item.title}
                          onError={(e) => { e.currentTarget.src = '/images/prod_sportswear.jpg'; }}
                          className={`w-full h-full object-contain transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
                      </div>
                      <div className={`px-2 py-1.5 ${isActive ? 'bg-slate-900' : 'bg-white'}`}>
                        <p className={`text-[10px] font-semibold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>{item.title}</p>
                        <p className={`text-[9px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{item.category}</p>
                      </div>
                      {item.is_featured && (
                        <span className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shadow">
                          <Star className="w-2.5 h-2.5 fill-white text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-0.5 pt-1">
                {filteredDesigns.map((item, idx) => {
                  const isActive = idx === activeDesignIndex;
                  return (
                    <button key={item.id} type="button" onClick={() => setActiveDesignIndex(idx)}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all text-left ${isActive ? 'bg-slate-900' : 'hover:bg-white hover:shadow-xs'}`}>
                      <div className={`w-10 h-10 rounded-lg overflow-hidden shrink-0 border flex items-center justify-center bg-slate-100 p-0.5 ${isActive ? 'border-slate-700' : 'border-slate-200'}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.thumbnail_url || item.mockup_front_url || '/images/prod_sportswear.jpg'} alt={item.title}
                          onError={(e) => { e.currentTarget.src = '/images/prod_sportswear.jpg'; }}
                          className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>{item.title}</p>
                        <p className={`text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>{item.category} · {item.print_type === 'sublimation' ? 'Sublimasi' : 'DTF'}</p>
                      </div>
                      {item.is_featured && <Star className={`w-3 h-3 shrink-0 ${isActive ? 'fill-amber-300 text-amber-300' : 'fill-amber-400 text-amber-400'}`} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* TOGGLE HANDLE — 3 vertical pill lines */}
        <div className="flex flex-col items-center justify-center shrink-0 z-10">
          <button type="button" onClick={() => setIsLeftPanelCollapsed((v) => !v)}
            className="group h-20 w-4 flex flex-col items-center justify-center bg-slate-200/60 hover:bg-slate-300/80 rounded-r-lg transition-all cursor-pointer"
            title={isLeftPanelCollapsed ? 'Buka Panel Senarai' : 'Tutup Panel Senarai'}>
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-0.5 h-3 bg-slate-400 group-hover:bg-slate-600 rounded-full transition-colors" />
              <div className="w-0.5 h-3 bg-slate-400 group-hover:bg-slate-600 rounded-full transition-colors" />
              <div className="w-0.5 h-3 bg-slate-400 group-hover:bg-slate-600 rounded-full transition-colors" />
            </div>
          </button>
        </div>

        {/* RIGHT PANEL — Single Card Preview */}
        <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-6 relative overflow-y-auto bg-[#f0f4f9]">
          {filteredDesigns.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-4 text-center max-w-sm">
              <div className="w-16 h-16 rounded-3xl bg-white shadow-md flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-700">Katalog Masih Kosong</h3>
                <p className="text-xs text-slate-400 mt-1">Tambah rekaan pertama untuk dipamerkan kepada pelanggan.</p>
              </div>
              <button type="button" onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-md">
                <Plus className="w-3.5 h-3.5" />Tambah Rekaan Baharu
              </button>
            </div>
          ) : activeDesign ? (
            <div className="w-full max-w-lg mx-auto">
              {/* Counter + Dot indicators */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">
                    Rekaan <span className="text-slate-900 font-bold">{activeDesignIndex + 1}</span> / {filteredDesigns.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {filteredDesigns.slice(0, 7).map((_, idx) => (
                    <button key={idx} type="button" onClick={() => setActiveDesignIndex(idx)}
                      className={`rounded-full transition-all ${idx === activeDesignIndex ? 'w-5 h-2 bg-slate-800' : 'w-2 h-2 bg-slate-300 hover:bg-slate-500'}`} />
                  ))}
                  {filteredDesigns.length > 7 && <span className="text-[9px] text-slate-400 ml-1">+{filteredDesigns.length - 7}</span>}
                </div>
              </div>

              {/* Main Design Card */}
              <div className="bg-white rounded-3xl shadow-lg border border-slate-200/60 overflow-hidden">
                {/* Image area with checkerboard */}
                <div className={`relative group ${checkerBg}`} style={{ minHeight: '320px' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={activeDesign.thumbnail_url || activeDesign.mockup_front_url || '/images/prod_sportswear.jpg'}
                    alt={activeDesign.title}
                    onError={(e) => { e.currentTarget.src = '/images/prod_sportswear.jpg'; }}
                    className="w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    style={{ maxHeight: '360px', minHeight: '320px', objectPosition: 'center' }} />

                  {/* Badges */}
                  <div className="absolute top-3 left-3">
                    {activeDesign.is_featured && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/90 text-white text-[10px] font-semibold shadow-sm backdrop-blur-sm">
                        <Star className="w-3 h-3 fill-white" />Pilihan Utama
                      </span>
                    )}
                  </div>
                  <div className="absolute top-3 right-3">
                    {typeInfo && (
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-semibold border backdrop-blur-sm bg-white/80 ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    )}
                  </div>

                  {/* Prev/Next hover arrows */}
                  {filteredDesigns.length > 1 && (
                    <>
                      <button type="button" onClick={handlePrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-md border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={handleNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur-sm shadow-md border border-slate-200/60 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Info + Actions */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-slate-900 truncate">{activeDesign.title}</h2>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs text-slate-500 font-medium">{activeDesign.category}</span>
                        {activeDesign.tags && activeDesign.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {activeDesign.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[9px] font-medium">#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: {activeDesign.id}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button type="button" onClick={() => handleOpenEdit(activeDesign)} title="Kemaskini"
                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => handleDelete(activeDesign.id)} title="Padam"
                        className="w-9 h-9 rounded-xl flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-500 transition-colors cursor-pointer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Footer nav */}
                  {filteredDesigns.length > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                      <button type="button" onClick={handlePrev}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium transition-all cursor-pointer">
                        <ChevronLeft className="w-3.5 h-3.5" />Sebelum
                      </button>
                      <span className="text-[10px] text-slate-400 font-medium">{activeDesignIndex + 1} / {filteredDesigns.length}</span>
                      <button type="button" onClick={handleNext}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all cursor-pointer">
                        Seterusnya<ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Thumbnail strip */}
              {filteredDesigns.length > 1 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-1 px-1">
                  {filteredDesigns.map((item, idx) => (
                    <button key={item.id} type="button" onClick={() => setActiveDesignIndex(idx)}
                      className={`shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer bg-white flex items-center justify-center p-1 ${idx === activeDesignIndex ? 'border-slate-900 shadow-md scale-105' : 'border-transparent hover:border-slate-400 opacity-60 hover:opacity-100'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.thumbnail_url || item.mockup_front_url || '/images/prod_sportswear.jpg'} alt={item.title}
                        onError={(e) => { e.currentTarget.src = '/images/prod_sportswear.jpg'; }}
                        className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* MODAL — Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center shadow-xs">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">{editingDesign ? 'Kemaskini Rekaan' : 'Tambah Rekaan Baharu'}</h3>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Image upload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-800">Gambar Rekaan <span className="text-rose-500">*</span></label>
                  {compressionInfo && (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono font-medium border border-emerald-100">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-500" /><span>{compressionInfo.compressedKb} KB (-{compressionInfo.percentSaved}%)</span>
                    </span>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={handleFileChange} className="hidden" />
                {imageUrl ? (
                  <div className={`relative w-full h-52 rounded-2xl overflow-hidden border border-slate-200 ${checkerBg} group flex items-center justify-center p-3 shadow-inner`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Pratonton" onError={(e) => { e.currentTarget.src = '/images/prod_sportswear.jpg'; }}
                      className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-200 drop-shadow-sm" />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button type="button" onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 rounded-full bg-white text-slate-800 text-xs font-semibold shadow-md flex items-center space-x-1.5 hover:bg-slate-50 cursor-pointer">
                        <RefreshCw className="w-3.5 h-3.5 text-slate-600" /><span>Tukar</span>
                      </button>
                      <button type="button" onClick={() => { setImageUrl(''); setCompressionInfo(null); }}
                        className="px-3.5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-semibold shadow-md flex items-center space-x-1 hover:bg-rose-700 cursor-pointer">
                        <X className="w-3.5 h-3.5" /><span>Padam</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                    onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files?.[0]; if (f) processImageFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full h-44 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 text-center ${isDragging ? 'border-slate-800 bg-slate-100/80' : 'border-slate-200 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'}`}>
                    {isProcessingImage ? (
                      <div className="flex flex-col items-center space-y-2 animate-in fade-in">
                        <RefreshCw className="w-6 h-6 animate-spin text-slate-800" />
                        <span className="text-xs font-semibold text-slate-800">Mengoptimumkan imej...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center space-y-1.5">
                        <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center mb-1 shadow-xs">
                          <UploadCloud className="w-5 h-5 text-slate-600" />
                        </div>
                        <p className="text-xs font-semibold text-slate-800">Pilih fail gambar rekaan</p>
                        <p className="text-[11px] text-slate-400">PNG / JPG / WebP — auto-compressed</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-semibold text-slate-800 block mb-1.5">Tajuk Rekaan <span className="text-rose-500">*</span></label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Jersi Harimau Malaya 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400" />
              </div>

              {/* Category + Print Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">Kategori</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400">
                    {CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-800 block mb-1.5">Teknik Cetakan</label>
                  <select value={printType} onChange={(e) => setPrintType(e.target.value as PrintType)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400">
                    <option value="sublimation">Sublimasi Penuh</option>
                    <option value="dtf">DTF Direct Transfer</option>
                  </select>
                </div>
              </div>

              {/* Featured Toggle (sliding pill) */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Rekaan Pilihan Utama</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Badge bintang emas di katalog</p>
                </div>
                <button type="button" onClick={() => setIsFeatured(!isFeatured)}
                  className={`w-10 h-6 rounded-full transition-all relative cursor-pointer ${isFeatured ? 'bg-amber-500' : 'bg-slate-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isFeatured ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all cursor-pointer">Batal</button>
                <button type="submit" disabled={isSaving || !title.trim() || !imageUrl}
                  className="px-5 py-2 rounded-full bg-slate-900 hover:bg-black disabled:opacity-40 text-white font-medium text-xs shadow-xs transition-all flex items-center space-x-1.5 cursor-pointer">
                  {isSaving ? (<><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Menyimpan...</span></>) : (<span>{editingDesign ? 'Simpan Perubahan' : 'Simpan Rekaan'}</span>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}