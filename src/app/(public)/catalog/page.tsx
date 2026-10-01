'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
  Search, 
  X, 
  Heart, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store/app-store';
import { useAuth } from '@/hooks/useAuth';
import { buildWhatsAppInquiryUrl } from '@/lib/whatsapp/dynamic-link';
import { Design } from '@/types/database';

const SwipeableBottomSheet = dynamic(() => import('@/components/ui/SwipeableBottomSheet'), {
  ssr: false,
});

const CATEGORY_PILLS = [
  { id: 'all', label: 'Semua' },
  { id: 'sublimation', label: 'Sublimasi' },
  { id: 'dtf', label: 'DTF' },
  { id: 'merchandise', label: 'Cenderamata' },
  { id: 'embroidery', label: 'Sulaman' },
];

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get('type') || 'all';

  const { isAuthenticated } = useAuth();
  const { designs, favorites, toggleFavorite, companySettings, isLoadingDesigns, isSyncing } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>(initialType);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(designs[0] || null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
    <div className="w-full min-h-full pt-3 pb-16 space-y-4 select-none font-ios bg-[#F2F2F7]">


      {/* 1. iOS Search Bar (Spacious & Clean Capsule) */}
      <div className="px-5 pt-1">
        <div className="relative flex items-center bg-white rounded-full border border-slate-200/80 shadow-xs focus-within:border-[#00BDFF] focus-within:ring-2 focus-within:ring-[#00BDFF]/15 transition-all">
          <Search className="absolute left-4 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari jersi, kemeja, t-shirt..."
            className="w-full pl-11 pr-10 py-2.5 bg-transparent rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
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

      {/* 3. Category Filter Pills (Generous Breathing Room with End Spacer) */}
      <div className="px-5">
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none no-scrollbar -mr-5 pr-5">
          {CATEGORY_PILLS.map((pill) => {
            const isActive = selectedCategory === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setSelectedCategory(pill.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-semibold tracking-tight transition-all active:scale-95 ${
                  isActive
                    ? 'bg-[#00BDFF] text-white shadow-sm shadow-sky-400/20 font-bold'
                    : 'bg-white text-slate-600 border border-slate-200/60 hover:bg-slate-50'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
          <div className="w-2 shrink-0" />
        </div>
      </div>

      {/* 4. Product Gallery Grid (Clean Cards without Text Pollution) */}
      <div className="px-5 pt-1">
        {(isLoadingDesigns || isSyncing) && designs.length === 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl overflow-hidden shadow-xs border border-slate-200/60 p-3 space-y-2.5 animate-pulse"
              >
                <div className="w-full aspect-[4/4.5] bg-slate-200 rounded-xl" />
                <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                <div className="h-2.5 bg-slate-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredDesigns.length === 0 ? (
          <div className="bg-white rounded-3xl p-10 text-center shadow-xs space-y-2.5 border border-slate-200/60 my-4">
            <Layers className="w-9 h-9 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-800">Tiada templat dijumpai</p>
            <p className="text-[11px] text-slate-400">Cuba tukar kata kunci carian atau pilih kategori lain.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredDesigns.map((design, index) => {
              const isFav = favorites.includes(design.id);
              const isPriority = index < 4;

              return (
                <div
                  key={design.id}
                  onClick={() => handleOpenDesign(design)}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-md hover:border-[#00BDFF]/40 flex flex-col justify-between cursor-pointer active:scale-[0.98] transition-all group"
                >
                  {/* Studio Product Backdrop Container - Full Area Image */}
                  <div className="relative w-full aspect-[4/4.5] overflow-hidden bg-slate-50 border-b border-slate-100/90 flex items-center justify-center">
                    <Image
                      src={design.thumbnail_url || design.mockup_front_url}
                      alt={design.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 250px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      priority={isPriority}
                      loading={isPriority ? 'eager' : 'lazy'}
                      decoding="async"
                      quality={90}
                    />

                    {/* Clean Floating Glass Circle Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAuthenticated) {
                          router.push(`/auth/login?redirect=${encodeURIComponent('/catalog')}`);
                          return;
                        }
                        toggleFavorite(design.id);
                      }}
                      aria-label="Kegemaran"
                      className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-200 z-10 active:scale-90 shadow-xs ${
                        isFav
                          ? 'bg-rose-50/95 border border-rose-200/90 text-rose-500 hover:bg-rose-100 shadow-rose-500/10'
                          : 'bg-white/90 hover:bg-white border border-slate-200/80 text-slate-400 hover:text-slate-600 shadow-slate-900/5 hover:scale-105'
                      }`}
                    >
                      <Heart 
                        className={`w-3.5 h-3.5 transition-transform duration-200 stroke-[2.2] ${
                          isFav ? 'fill-rose-500 text-rose-500 scale-105' : 'text-slate-400'
                        }`} 
                      />
                    </button>
                  </div>

                  {/* Clean Minimal Typography (No Badges, No Clutter) */}
                  <div className="p-3 bg-white">
                    <h3 className="text-xs font-bold text-slate-900 tracking-tight truncate group-hover:text-[#00BDFF] transition-colors">
                      {design.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 capitalize truncate">
                      {design.print_type === 'sublimation' ? 'Sublimasi Penuh' : design.print_type === 'dtf' ? 'Cetakan DTF' : design.category}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          SWIPEABLE iOS BOTTOM SHEET FOR DESIGN DETAIL
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        maxHeight="max-h-[88vh]"
        title={
          selectedDesign ? (
            <div className="flex items-center gap-2">
              <span className="bg-sky-50 text-[#00BDFF] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-sky-100">
                {selectedDesign.category}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase">
                {selectedDesign.print_type === 'sublimation' ? 'Sublimasi' : 'DTF'}
              </span>
            </div>
          ) : undefined
        }
        footer={
          selectedDesign ? (
            <div className="flex items-center gap-2.5 w-full">
              {/* WhatsApp Discussion Button */}
              <a
                href={buildWhatsAppInquiryUrl({
                  phone: companySettings?.whatsapp_number,
                  type: 'catalog',
                  designTitle: selectedDesign.title,
                  designId: selectedDesign.id,
                  category: selectedDesign.category,
                })}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Diskusi Produk di WhatsApp"
                className="h-12 px-4 rounded-full bg-emerald-50 border border-emerald-200/80 text-[#25D366] hover:bg-emerald-100 flex items-center justify-center gap-1.5 shrink-0 active:scale-95 transition-all shadow-xs"
                title="Diskusi di WhatsApp"
              >
                <FaWhatsapp className="w-5 h-5" />
                <span className="text-xs font-bold text-emerald-700 hidden sm:inline">Diskusi</span>
              </a>

              {/* Primary Tempah Action Button - Redirect to dedicated Order Form page */}
              <Link
                href={`/customize/${selectedDesign.id}`}
                onClick={() => setIsSheetOpen(false)}
                className="flex-1 h-12 bg-[#00BDFF] hover:bg-sky-500 text-white font-bold rounded-full text-center active:scale-[0.98] transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-sky-400/20 text-xs"
              >
                <span>Isi Borang Tempahan</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : undefined
        }
      >
        {selectedDesign && (
          <div className="space-y-4">
            {/* Mockup Preview Photo (1:1 Ratio) */}
            <div className="relative w-full aspect-square rounded-2xl bg-gradient-to-b from-white via-slate-50 to-slate-100/80 overflow-hidden shadow-xs border border-slate-200/80 p-4 flex items-center justify-center">
              <Image
                src={selectedDesign.mockup_front_url || selectedDesign.thumbnail_url}
                alt={selectedDesign.title}
                fill
                sizes="(max-width: 640px) 90vw, 400px"
                className="object-contain p-2 drop-shadow-sm"
                priority
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
        )}
      </SwipeableBottomSheet>
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
