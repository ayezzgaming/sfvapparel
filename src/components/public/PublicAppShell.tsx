'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { App } from 'konsta/react';
import { 
  IoHomeOutline, 
  IoHome, 
  IoGridOutline, 
  IoGrid, 
  IoTimeOutline, 
  IoTime, 
  IoPersonOutline, 
  IoPerson 
} from 'react-icons/io5';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { useAppStore } from '@/lib/store/app-store';
import { useUI } from '@/lib/store/ui-context';
import { formatCurrency } from '@/lib/pricing-calculator';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import IosInstallPromptModal from '@/components/pwa/IosInstallPromptModal';

interface PublicAppShellProps {
  children: React.ReactNode;
}

export default function PublicAppShell({ children }: PublicAppShellProps) {
  const pathname = usePathname();
  const { orders, favorites, designs, deleteOrder, toggleFavorite, companySettings, themeSettings } = useAppStore();
  const { isBottomSheetOpen } = useUI();
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

  const isHome = pathname === '/' || pathname === '';
  const isCatalog = pathname.startsWith('/catalog') || pathname.startsWith('/customize');
  const isHistory = pathname.startsWith('/history');
  const isProfile = pathname.startsWith('/profile');

  const activeOrders = orders.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled');
  const activeOrdersCount = activeOrders.length;
  const favoritesCount = favorites.length;
  const shouldHideBottomNav = isBottomSheetOpen;

  // Theme computations
  const headerBg = themeSettings?.header_bg || '#FFFFFF';
  const isHeaderSolidBlue = themeSettings?.header_style === 'solid_blue';
  const logoMode = themeSettings?.header_logo_mode || (isHeaderSolidBlue ? 'inverted_white' : 'original_blue');
  const isHeaderWhite = themeSettings?.header_style === 'frosted_white' || headerBg === '#FFFFFF' || !isHeaderSolidBlue;
  
  const bottomNavBg = themeSettings?.bottom_nav_bg || 'rgba(255, 255, 255, 0.95)';
  const isBottomNavDark = themeSettings?.bottom_nav_style === 'solid_blue' || bottomNavBg === '#00BDFF' || bottomNavBg === '#0052FF';
  const bottomActiveColor = themeSettings?.bottom_nav_active_color || (isBottomNavDark ? '#FFFFFF' : '#00BDFF');
  const bottomInactiveColor = themeSettings?.bottom_nav_inactive_color || (isBottomNavDark ? '#93C5FD' : '#94A3B8');
  const whatsappFabBg = themeSettings?.whatsapp_fab_bg || '#25D366';

  // Filter full design objects that are favorited
  const favoriteDesigns = designs.filter((d) => favorites.includes(d.id));

  return (
    <App theme="ios" safeAreas={true} className="!bg-transparent h-full font-ios antialiased selection:bg-[#00BDFF] selection:text-white overscroll-none">
      {/* 1. FIXED FULL-SCREEN FRAME (Locks directly to physical viewport, zero window scrolling) */}
      <div className="fixed inset-0 w-full h-full bg-gray-100 flex justify-center overflow-hidden overscroll-none">

        {/* 2. MASTER CONTAINER APLIKASI (Fixed 100% height of the pinned frame) */}
        <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col overflow-hidden relative overscroll-none touch-pan-y select-none">
          
          {/* Header / Navbar (Clean White Apple-Grade Polish) */}
          <header 
            className="shrink-0 z-40 px-4 py-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] flex items-center justify-between border-b border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] select-none touch-none transition-colors"
            style={{ touchAction: 'none' }}
          >
            {/* Brand Logo */}
            <Link href="/" draggable={false} className="inline-flex items-center select-none active:opacity-75 transition-opacity group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo/SVFapparel-logo.svg"
                alt="SVF Apparel"
                className="h-7 sm:h-8 w-auto object-contain shrink-0 pointer-events-none group-active:scale-95 transition-transform"
              />
            </Link>

            {/* Header Action Icons (Sleek, Clean & No Heavy Base Circles) */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setIsFavoritesOpen(true)}
                aria-label="Senarai Pilihan Kegemaran"
                className="w-8 h-8 relative transition-all active:scale-90 flex items-center justify-center text-slate-700 hover:text-[#00BDFF] cursor-pointer touch-manipulation"
              >
                <Heart className="w-4.5 h-4.5 stroke-[2]" />
                {favoritesCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-[15px] h-[15px] px-1 rounded-full bg-[#FF3B30] text-white text-[8.5px] font-bold flex items-center justify-center shadow-xs ring-1.5 ring-white leading-none pointer-events-none animate-in zoom-in-75">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsBagOpen(true)}
                aria-label="Bakul Pesanan Aktif"
                className="w-8 h-8 relative transition-all active:scale-90 flex items-center justify-center text-slate-700 hover:text-[#00BDFF] cursor-pointer touch-manipulation"
              >
                <ShoppingBag className="w-4.5 h-4.5 stroke-[2]" />
                {activeOrdersCount > 0 && (
                  <span className="absolute top-0 right-0 min-w-[15px] h-[15px] px-1 rounded-full bg-[#FF3B30] text-white text-[8.5px] font-bold flex items-center justify-center shadow-xs ring-1.5 ring-white leading-none pointer-events-none animate-in zoom-in-75">
                    {activeOrdersCount > 99 ? '99+' : activeOrdersCount}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Scrollable Main Content (Locked when bottom sheet is open) */}
          <main className={`flex-1 w-full sparkle-scroll bg-[#F2F2F7] ${
            shouldHideBottomNav ? 'overflow-hidden pointer-events-none' : 'overflow-y-auto overscroll-y-contain'
          }`}>
            {children}
          </main>

          {/* iOS Bottom Tab Bar (With Modern Center Raised Circular Button) */}
          <nav 
            className={`shrink-0 z-40 w-full border-t px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.65rem)] flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)] select-none touch-none overscroll-none transition-all duration-300 ease-in-out transform ${
              isBottomNavDark ? 'border-blue-600/40' : 'border-slate-200/80 backdrop-blur-xl'
            } ${
              shouldHideBottomNav
                ? 'translate-y-full opacity-0 pointer-events-none'
                : 'translate-y-0 opacity-100'
            }`}
            style={{ 
              backgroundColor: bottomNavBg,
              touchAction: 'none' 
            }}
          >
            {/* Tab 1: Utama */}
            <Link
              href="/"
              draggable={false}
              className="flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 outline-none select-none touch-manipulation relative group"
              style={{ color: isHome ? bottomActiveColor : bottomInactiveColor }}
            >
              <div className="flex items-center justify-center h-6 w-6">
                {isHome ? (
                  <IoHome className="w-5.5 h-5.5 transition-transform duration-200 scale-110" style={{ color: bottomActiveColor }} />
                ) : (
                  <IoHomeOutline className="w-5.5 h-5.5 transition-colors" style={{ color: bottomInactiveColor }} />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 transition-colors ${isHome ? 'font-bold' : 'font-medium'}`} style={{ color: isHome ? bottomActiveColor : bottomInactiveColor }}>
                Utama
              </span>
            </Link>

            {/* Tab 2: Katalog */}
            <Link
              href="/catalog"
              draggable={false}
              className="flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 outline-none select-none touch-manipulation relative group"
              style={{ color: isCatalog ? bottomActiveColor : bottomInactiveColor }}
            >
              <div className="flex items-center justify-center h-6 w-6">
                {isCatalog ? (
                  <IoGrid className="w-5.5 h-5.5 transition-transform duration-200 scale-110" style={{ color: bottomActiveColor }} />
                ) : (
                  <IoGridOutline className="w-5.5 h-5.5 transition-colors" style={{ color: bottomInactiveColor }} />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 transition-colors ${isCatalog ? 'font-bold' : 'font-medium'}`} style={{ color: isCatalog ? bottomActiveColor : bottomInactiveColor }}>
                Katalog
              </span>
            </Link>

            {/* Tab 3 (Center): Raised Circular WhatsApp Action */}
            <div className="flex flex-col items-center justify-center flex-1 -mt-5 relative z-10">
              <a
                href={`https://wa.me/${companySettings?.whatsapp_number || '60148599138'}?text=${encodeURIComponent(companySettings?.whatsapp_default_message || 'Hai SFV Apparel, saya ingin bertanya tentang tempahan custom.')}`}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                aria-label="Hubungi Kilang di WhatsApp"
                style={{ backgroundColor: whatsappFabBg || '#25D366' }}
                className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-[0_4px_14px_rgba(37,211,102,0.4)] ring-4 ring-white active:scale-90 hover:scale-105 transition-all select-none touch-manipulation cursor-pointer group"
              >
                <FaWhatsapp className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </a>
              <span className="text-[10px] tracking-tight mt-0.5 font-semibold text-slate-500">
                WhatsApp
              </span>
            </div>

            {/* Tab 4: Pesanan */}
            <Link
              href="/history"
              draggable={false}
              className="flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 outline-none select-none touch-manipulation relative group"
              style={{ color: isHistory ? bottomActiveColor : bottomInactiveColor }}
            >
              <div className="flex items-center justify-center h-6 w-6 relative">
                {isHistory ? (
                  <IoTime className="w-5.5 h-5.5 transition-transform duration-200 scale-110" style={{ color: bottomActiveColor }} />
                ) : (
                  <IoTimeOutline className="w-5.5 h-5.5 transition-colors" style={{ color: bottomInactiveColor }} />
                )}
                {activeOrdersCount > 0 && !isHistory && (
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#FF3B30] ring-2 ring-white" />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 transition-colors ${isHistory ? 'font-bold' : 'font-medium'}`} style={{ color: isHistory ? bottomActiveColor : bottomInactiveColor }}>
                Pesanan
              </span>
            </Link>

            {/* Tab 5: Profil */}
            <Link
              href="/profile"
              draggable={false}
              className="flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 outline-none select-none touch-manipulation relative group"
              style={{ color: isProfile ? bottomActiveColor : bottomInactiveColor }}
            >
              <div className="flex items-center justify-center h-6 w-6">
                {isProfile ? (
                  <IoPerson className="w-5.5 h-5.5 transition-transform duration-200 scale-110" style={{ color: bottomActiveColor }} />
                ) : (
                  <IoPersonOutline className="w-5.5 h-5.5 transition-colors" style={{ color: bottomInactiveColor }} />
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 transition-colors ${isProfile ? 'font-bold' : 'font-medium'}`} style={{ color: isProfile ? bottomActiveColor : bottomInactiveColor }}>
                Profil
              </span>
            </Link>
          </nav>

          {/* =========================================================================
              QUICK ACTIVE ORDERS / BAG MODAL SHEET (SWIPEABLE iOS DRAWER)
             ========================================================================= */}
          <SwipeableBottomSheet
            isOpen={isBagOpen}
            onClose={() => setIsBagOpen(false)}
            maxHeight="max-h-[85vh]"
            title={
              <div className="flex items-center gap-2">
                <span className="bg-sky-50 text-[#00BDFF] text-[10.5px] font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-sky-100">
                  Bakul Pesanan
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({activeOrdersCount} aktif)
                </span>
              </div>
            }
            footer={
              <Link
                href="/history"
                onClick={() => setIsBagOpen(false)}
                className="w-full bg-[#00BDFF] text-white font-semibold py-3.5 rounded-xl text-center active:bg-sky-600 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-sky-400/20 text-xs"
              >
                <span>Buka Pengurusan Pesanan Penuh →</span>
              </Link>
            }
          >
            {activeOrders.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Tiada Pesanan Aktif</h3>
                  <p className="text-xs text-slate-500 mt-1">Anda belum mempunyai tempahan yang sedang diproses di kilang.</p>
                </div>
              </div>
            ) : (
              activeOrders.map((order) => (
                <div 
                  key={order.id}
                  className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 space-y-2.5 relative group"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {order.order_number}
                      </span>
                      <h4 className="text-[13.5px] font-semibold text-slate-800 leading-snug mt-0.5">
                        {order.design_title}
                      </h4>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-[#00BDFF] border border-sky-100 uppercase">
                        {order.status.replace('_', ' ')}
                      </span>
                      
                      {/* Tombol Hapus Pesanan */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Padam pesanan ${order.order_number} dari bakul?`)) {
                            deleteOrder(order.id);
                          }
                        }}
                        aria-label="Padam pesanan"
                        title="Padam dari bakul"
                        className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 active:scale-90 transition-all shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/50">
                    <span className="text-slate-500">{order.total_quantity} helai pakaian</span>
                    <span className="font-bold text-slate-900">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              ))
            )}
          </SwipeableBottomSheet>

          {/* =========================================================================
              FAVORITES / SENARAI KEGEMARAN MODAL SHEET (SWIPEABLE iOS DRAWER)
             ========================================================================= */}
          <SwipeableBottomSheet
            isOpen={isFavoritesOpen}
            onClose={() => setIsFavoritesOpen(false)}
            maxHeight="max-h-[85vh]"
            title={
              <div className="flex items-center gap-2">
                <span className="bg-rose-50 text-[#FF2D55] text-[10.5px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Pilihan Kegemaran
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({favoritesCount} disimpan)
                </span>
              </div>
            }
            footer={
              <Link
                href="/catalog"
                onClick={() => setIsFavoritesOpen(false)}
                className="w-full bg-[#00BDFF] text-white font-semibold py-3.5 rounded-xl text-center active:bg-sky-600 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-sky-400/20 text-xs"
              >
                <span>Terokai Lebih Banyak di Katalog →</span>
              </Link>
            }
          >
            {favoriteDesigns.length === 0 ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Tiada Rekaan Kegemaran</h3>
                  <p className="text-xs text-slate-500 mt-1">Tekan ikon hati pada mana-mana templat di katalog untuk menyimpannya di sini.</p>
                </div>
              </div>
            ) : (
              favoriteDesigns.map((design) => (
                <div 
                  key={design.id}
                  className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-200/70 flex items-center gap-3.5 justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={design.thumbnail_url || design.mockup_front_url}
                        alt={design.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {design.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 capitalize truncate">
                        {design.category} • {design.print_type === 'sublimation' ? 'Sublimasi' : 'DTF'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/customize/${design.id}`}
                      onClick={() => setIsFavoritesOpen(false)}
                      className="px-3 py-1.5 rounded-xl bg-[#00BDFF] text-white text-xs font-semibold active:bg-sky-600 transition-colors shadow-2xs"
                    >
                      Tempah
                    </Link>

                    <button
                      type="button"
                      onClick={() => toggleFavorite(design.id)}
                      aria-label="Buang dari kegemaran"
                      className="p-2 rounded-xl bg-white border border-slate-200/60 text-[#FF2D55] hover:bg-rose-50 active:scale-90 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </SwipeableBottomSheet>

          {/* iOS Safari "Add to Home Screen" Guidance Modal */}
          <IosInstallPromptModal />

        </div>
      </div>
    </App>
  );
}
