'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  X, 
  Heart, 
  Layers
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useAppStore } from '@/lib/store/app-store';
import { useUI } from '@/lib/store/ui-context';
import { Design } from '@/types/database';

const CATEGORY_PILLS = [
  { id: 'all', label: 'Semua' },
  { id: 'sublimation', label: 'Sublimasi Penuh' },
  { id: 'dtf', label: 'Cetakan DTF' },
  { id: 'merchandise', label: 'Cenderamata' },
  { id: 'embroidery', label: 'Sulaman Khas' },
];

function CatalogContent() {
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const { designs } = useAppStore();
  const { setBottomSheetOpen } = useUI();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(designs[0] || null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Sync with global UIContext so Bottom Nav & WhatsApp FAB automatically hide when sheet is open
  useEffect(() => {
    setBottomSheetOpen(isSheetOpen);
    return () => setBottomSheetOpen(false);
  }, [isSheetOpen, setBottomSheetOpen]);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('svf_favorite_designs');
      if (saved) setFavorites(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  const toggleFavorite = (designId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(designId)
        ? prev.filter((id) => id !== designId)
        : [...prev, designId];
      try {
        localStorage.setItem('svf_favorite_designs', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleOpenDesign = (design: Design) => {
    setSelectedDesign(design);
    setIsSheetOpen(true);
  };

  // Filter designs based on search and category
  const filteredDesigns = useMemo(() => {
    return designs.filter((d) => {
      const matchCat =
        selectedCategory === 'all' ||
        d.print_type === selectedCategory ||
        d.category.toLowerCase().includes(selectedCategory);

      const matchSearch =
        !searchQuery.trim() ||
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.description ? d.description.toLowerCase().includes(searchQuery.toLowerCase()) : false) ||
        (d.tags ? d.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())) : false);

      return matchCat && matchSearch;
    });
  }, [designs, selectedCategory, searchQuery]);

  return (
    <div className="w-full min-h-full pt-4 pb-12 space-y-4.5 select-none font-ios bg-[#F2F2F7]">
      {/* Page Title Header */}
      <div className="px-5">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052FF] text-[10.5px] font-bold uppercase tracking-wider mb-1.5">
          <span>Galeri & Templat</span>
        </div>
        <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
          Katalog Pilihan
        </h1>
        <p className="text-xs text-slate-500 font-normal tracking-wide mt-0.5">
          Pilih templat sedia ada atau mula tempahan kustom dengan pereka
        </p>
      </div>

      {/* iOS Search Bar */}
      <div className="px-5">
        <div className="relative flex items-center bg-white rounded-2xl border border-slate-200/80 shadow-xs focus-within:border-[#0052FF] focus-within:ring-2 focus-within:ring-[#0052FF]/10 transition-all">
          <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jersi esport, raglan, baju DTF..."
            className="w-full pl-10 pr-9 py-2.5 bg-transparent rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 rounded-full bg-[#F2F2F7] text-slate-400 hover:text-slate-600 active:scale-90 transition-transform"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (Clean Container Scroller without edge clipping) */}
      <div className="px-5">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none no-scrollbar">
          {CATEGORY_PILLS.map((pill) => {
            const isActive = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setSelectedCategory(pill.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-tight transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[#0052FF] text-white shadow-sm shadow-blue-500/25'
                    : 'bg-white text-slate-600 shadow-2xs border border-slate-200/70 hover:bg-slate-50'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Template Grid (Strict Equal Height & Alignment) */}
      <div className="px-5 pt-0.5">
        {filteredDesigns.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm space-y-2 border border-slate-200/70">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Tiada templat dijumpai</p>
            <p className="text-[11.5px] text-slate-500">Cuba tukar kata kunci atau pilih kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 items-stretch">
            {filteredDesigns.map((design) => {
              const isFav = favorites.includes(design.id);
              const waUrl = `https://wa.me/60148599138?text=Hai%20SFV%20Apparel,%20saya%20berminat%20dengan%20templat%20rekaan%20*${encodeURIComponent(design.title)}*%20(${encodeURIComponent(design.category)}).%20Boleh%20kita%20bincang%20tempahan%20ini?`;

              return (
                <div
                  key={design.id}
                  onClick={() => handleOpenDesign(design)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/70 hover:border-blue-200 hover:shadow-md flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-all group relative h-full"
                >
                  {/* Top Image Canvas (Uniform Height Across All Cards) */}
                  <div className="relative w-full h-36 overflow-hidden bg-slate-100 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={design.thumbnail_url || design.mockup_front_url}
                      alt={design.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />

                    {/* Technique Badge */}
                    <span className="absolute top-2.5 left-2.5 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/90 backdrop-blur-md border border-white/70 text-[#0052FF] shadow-2xs uppercase">
                      {design.print_type === 'sublimation' ? 'Sublimasi' : design.print_type === 'dtf' ? 'DTF' : 'Khas'}
                    </span>

                    {/* Favorite Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(design.id);
                      }}
                      aria-label="Kegemaran"
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xs active:scale-75 hover:scale-105 transition-all z-10"
                    >
                      <Heart 
                        className={`w-3.5 h-3.5 transition-colors ${
                          isFav ? 'fill-[#FF2D55] text-[#FF2D55]' : 'text-slate-500 hover:text-slate-800'
                        }`} 
                      />
                    </button>
                  </div>

                  {/* Template Meta & WhatsApp Direct Action */}
                  <div className="p-3 flex flex-col justify-between flex-1">
                    <div className="space-y-0.5">
                      <h3 className="text-[12.5px] font-bold text-slate-900 tracking-tight h-8.5 line-clamp-2 leading-snug group-hover:text-[#0052FF] transition-colors">
                        {design.title}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-normal truncate">
                        {design.category}
                      </p>
                    </div>

                    {/* Footer: Tags & Clean Grey-to-Green WhatsApp Action Icon */}
                    <div className="mt-2.5 pt-2 flex items-center justify-between border-t border-slate-100">
                      <span className="text-[10px] font-medium text-slate-400 truncate">
                        Templat Kilang
                      </span>

                      {/* Clean WhatsApp Icon Button (Grey by default, Green on hover/active) */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Bincang di WhatsApp untuk ${design.title}`}
                        className="p-1 text-slate-400 hover:text-[#25D366] active:text-[#25D366] active:scale-85 transition-all shrink-0 flex items-center justify-center"
                        title="Bincang di WhatsApp"
                      >
                        <FaWhatsapp className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          NATIVE iOS BOTTOM SHEET FOR DESIGN DETAIL
         ========================================================================= */}
      {/* 1. BACKDROP (Latar Gelap) */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSheetOpen(false)}
      />

      {/* 2. KOTAK SHEET (STICKY HEADER & FOOTER DOCK) */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-50 w-full max-w-md mx-auto bg-white rounded-t-[32px] rounded-b-none mb-0 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col max-h-[88vh] ${
          isSheetOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
        }`}
      >
        {selectedDesign && (
          <>
            {/* iOS Drag Handle & Sticky Header */}
            <div className="pt-3 pb-2 px-6 shrink-0 border-b border-black/[0.04]">
              <div className="flex justify-center pb-2.5">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
              <div className="flex justify-between items-center pb-1">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-50 text-[#0052FF] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {selectedDesign.category}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">
                    {selectedDesign.print_type === 'sublimation' ? 'Sublimasi' : 'DTF'}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => toggleFavorite(selectedDesign.id)}
                    aria-label="Kegemaran"
                    className="p-2 rounded-full bg-slate-100 text-slate-600 active:scale-90 transition-transform"
                  >
                    <Heart 
                      className={`w-4 h-4 ${
                        favorites.includes(selectedDesign.id) ? 'fill-[#FF2D55] text-[#FF2D55]' : 'text-slate-600'
                      }`} 
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSheetOpen(false)}
                    aria-label="Tutup"
                    className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 active:scale-95 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Content Body */}
            <div className="px-6 py-4 overflow-y-auto sparkle-scroll space-y-4 flex-1">
              {/* Mockup Preview Photo */}
              <div className="relative w-full h-52 rounded-2xl bg-slate-100 overflow-hidden shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedDesign.mockup_front_url || selectedDesign.thumbnail_url}
                  alt={selectedDesign.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900 leading-snug">
                  {selectedDesign.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  {selectedDesign.description}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedDesign.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10.5px] font-semibold text-slate-600 bg-gray-100 px-3 py-1 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Sticky Bottom Action Dock: Tempah + WhatsApp Discussion Action */}
            <div className="p-4 px-6 bg-white/95 backdrop-blur-md border-t border-slate-100 shrink-0 flex items-center gap-2.5">
              {/* WhatsApp Discussion Button */}
              <a
                href={`https://wa.me/60148599138?text=Hai%20SFV%20Apparel,%20saya%20ingin%20berbincang%20mengenai%20templat%20rekaan%20*${encodeURIComponent(selectedDesign.title)}*%20(ID:%20${selectedDesign.id})`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Diskusi Produk di WhatsApp"
                className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-200/80 text-[#25D366] hover:bg-emerald-100 flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-xs"
                title="Diskusi di WhatsApp"
              >
                <FaWhatsapp className="w-6 h-6" />
              </a>

              {/* Primary Tempah Action Button */}
              <a
                href={`https://wa.me/60148599138?text=Hai%20SFV%20Apparel,%20saya%20ingin%20membuat%20tempahan%20untuk%20templat%20*${encodeURIComponent(selectedDesign.title)}*%20(Kategori:%20${encodeURIComponent(selectedDesign.category)})`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-12 bg-[#0052FF] hover:bg-blue-700 text-white font-semibold rounded-xl text-center active:bg-blue-800 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-blue-500/25 text-xs"
              >
                <span>Tempah Rekaan Ini →</span>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <React.Suspense fallback={
      <div className="w-full min-h-full flex items-center justify-center p-12 text-slate-400 font-ios text-xs">
        Memuatkan katalog...
      </div>
    }>
      <CatalogContent />
    </React.Suspense>
  );
}

