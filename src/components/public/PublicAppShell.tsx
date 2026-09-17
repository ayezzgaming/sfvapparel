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
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';

interface PublicAppShellProps {
  children: React.ReactNode;
}

export default function PublicAppShell({ children }: PublicAppShellProps) {
  const pathname = usePathname();
  const { orders, favorites, designs, deleteOrder, toggleFavorite } = useAppStore();
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

  // Filter full design objects that are favorited
  const favoriteDesigns = designs.filter((d) => favorites.includes(d.id));

  return (
    <App theme="ios" safeAreas={true} className="!bg-transparent min-h-screen font-ios antialiased selection:bg-[#0052FF] selection:text-white">
      {/* 1. LAYAR MONITOR (Background luar aplikasi jika dibuka di desktop) */}
      <div className="min-h-screen bg-gray-100 flex justify-center w-full">

        {/* 2. MASTER CONTAINER APLIKASI (Dynamic 100dvh for iOS Safari safe area) */}
        <div className="w-full max-w-md mx-auto relative h-[100dvh] max-h-[100dvh] bg-white shadow-2xl flex flex-col overflow-hidden">
          
          {/* Header / Navbar */}
          <header className="sticky top-0 z-40 bg-white px-5 py-3.5 pt-[calc(env(safe-area-inset-top,0px)+0.85rem)] flex items-center justify-between border-b border-black/[0.04] shrink-0">
            {/* Brand Logo with Animated Text */}
            <Link href="/" className="inline-flex items-center gap-2.5 select-none active:opacity-80 transition-opacity">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.svg"
                alt="SFV Apparel Logo"
                className="h-7 w-7 object-contain shrink-0"
              />
              <div className="flex items-baseline">
                <span className="font-black text-[21px] sm:text-[22px] tracking-tight brand-sfv-text leading-none">
                  SFV
                </span>
                <span className="font-bold text-[14.5px] sm:text-[15px] tracking-[0.22em] ml-2 uppercase brand-apparel-text leading-none">
                  APPAREL
                </span>
              </div>
            </Link>

            {/* Header Action Icons (Standard Industry Minimal Outline with Red Counter Badges) */}
            <div className="flex items-center space-x-1">
              <button
                type="button"
                onClick={() => setIsFavoritesOpen(true)}
                aria-label="Senarai Pilihan Kegemaran"
                className="p-2 text-slate-700 hover:text-slate-900 relative transition-colors active:scale-90 flex items-center justify-center rounded-full hover:bg-slate-50"
              >
                <Heart className="w-5 h-5 stroke-[1.75]" />
                {favoritesCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#FF3B30] text-white text-[9.5px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs leading-none pointer-events-none">
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsBagOpen(true)}
                aria-label="Bakul Pesanan Aktif"
                className="p-2 text-slate-700 hover:text-slate-900 relative transition-colors active:scale-90 flex items-center justify-center rounded-full hover:bg-slate-50"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.75]" />
                {activeOrdersCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#FF3B30] text-white text-[9.5px] font-bold flex items-center justify-center ring-2 ring-white shadow-xs leading-none pointer-events-none">
                    {activeOrdersCount > 99 ? '99+' : activeOrdersCount}
                  </span>
                )}
              </button>
            </div>
          </header>

          {/* Scrollable Main Content with Full-Height Seamless iOS Background */}
          <main className="flex-1 w-full overflow-y-auto sparkle-scroll bg-[#F2F2F7]">
            {children}
          </main>

          {/* Pixel-Perfect iOS Bottom Tab Bar with Standard Refined Icons */}
          <nav className={`sticky bottom-0 left-0 right-0 w-full z-40 bg-white/95 backdrop-blur-xl border-t border-black/[0.06] px-3 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.65rem)] flex items-center justify-between shadow-[0_-2px_12px_rgba(0,0,0,0.03)] shrink-0 transition-all duration-300 ease-in-out transform ${
            shouldHideBottomNav
              ? 'translate-y-full opacity-0 pointer-events-none'
              : 'translate-y-0 opacity-100'
          }`}>
            
            {/* Tab 1: Utama */}
            <Link
              href="/"
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 outline-none select-none ${
                isHome ? 'text-[#0052FF]' : 'text-[#8E8E93] hover:text-slate-600'
              }`}
            >
              <div className="flex items-center justify-center h-6 w-6">
                {isHome ? (
                  <IoHome className="w-5.5 h-5.5 transition-transform duration-200 scale-105" />
                ) : (
                  <IoHomeOutline className="w-5.5 h-5.5" />
                )}
              </div>
              <span className={`text-[10.5px] tracking-tight mt-0.5 ${isHome ? 'font-bold text-[#0052FF]' : 'font-medium text-[#8E8E93]'}`}>
                Utama
              </span>
            </Link>

            {/* Tab 2: Katalog */}
            <Link
              href="/catalog"
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 outline-none select-none ${
                isCatalog ? 'text-[#0052FF]' : 'text-[#8E8E93] hover:text-slate-600'
              }`}
            >
              <div className="flex items-center justify-center h-6 w-6">
                {isCatalog ? (
                  <IoGrid className="w-5.5 h-5.5 transition-transform duration-200 scale-105" />
                ) : (
                  <IoGridOutline className="w-5.5 h-5.5" />
                )}
              </div>
              <span className={`text-[10.5px] tracking-tight mt-0.5 ${isCatalog ? 'font-bold text-[#0052FF]' : 'font-medium text-[#8E8E93]'}`}>
                Katalog
              </span>
            </Link>

            {/* Tab 3: Pesanan */}
            <Link
              href="/history"
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 outline-none select-none relative ${
                isHistory ? 'text-[#0052FF]' : 'text-[#8E8E93] hover:text-slate-600'
              }`}
            >
              <div className="flex items-center justify-center h-6 w-6 relative">
                {isHistory ? (
                  <IoTime className="w-5.5 h-5.5 transition-transform duration-200 scale-105" />
                ) : (
                  <IoTimeOutline className="w-5.5 h-5.5" />
                )}
                {activeOrdersCount > 0 && !isHistory && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#FF3B30] ring-2 ring-white" />
                )}
              </div>
              <span className={`text-[10.5px] tracking-tight mt-0.5 ${isHistory ? 'font-bold text-[#0052FF]' : 'font-medium text-[#8E8E93]'}`}>
                Pesanan
              </span>
            </Link>

            {/* Tab 4: Profil */}
            <Link
              href="/profile"
              className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all active:scale-95 outline-none select-none ${
                isProfile ? 'text-[#0052FF]' : 'text-[#8E8E93] hover:text-slate-600'
              }`}
            >
              <div className="flex items-center justify-center h-6 w-6">
                {isProfile ? (
                  <IoPerson className="w-5.5 h-5.5 transition-transform duration-200 scale-105" />
                ) : (
                  <IoPersonOutline className="w-5.5 h-5.5" />
                )}
              </div>
              <span className={`text-[10.5px] tracking-tight mt-0.5 ${isProfile ? 'font-bold text-[#0052FF]' : 'font-medium text-[#8E8E93]'}`}>
                Profil
              </span>
            </Link>
          </nav>

          {/* Standard Circular Floating WhatsApp Action Button (Standard 48px FAB) */}
          <a
            href="https://wa.me/60148599138?text=Hai%20SFV%20Apparel,%20saya%20ingin%20bertanya%20tentang%20tempahan%20custom."
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hubungi Kilang di WhatsApp"
            className={`absolute bottom-[calc(env(safe-area-inset-bottom,0px)+5rem)] right-4 z-30 w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-[0_8px_20px_rgba(37,211,102,0.4)] active:scale-90 hover:scale-105 transition-all duration-300 ease-in-out select-none transform ${
              shouldHideBottomNav
                ? 'translate-y-24 opacity-0 pointer-events-none scale-75'
                : 'translate-y-0 opacity-100 scale-100'
            }`}
          >
            <FaWhatsapp className="w-6 h-6 text-white" />
          </a>

          {/* =========================================================================
              QUICK ACTIVE ORDERS / BAG MODAL SHEET (SWIPEABLE iOS DRAWER)
             ========================================================================= */}
          <SwipeableBottomSheet
            isOpen={isBagOpen}
            onClose={() => setIsBagOpen(false)}
            maxHeight="max-h-[85vh]"
            title={
              <div className="flex items-center gap-2">
                <span className="bg-blue-50 text-[#0052FF] text-[10.5px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
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
                className="w-full bg-[#0052FF] text-white font-semibold py-3.5 rounded-xl text-center active:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 text-xs"
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
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052FF] border border-blue-100 uppercase">
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
                    <span className="font-bold text-slate-900">RM{(order.total_amount / 100).toFixed(2)}</span>
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
                className="w-full bg-[#0052FF] text-white font-semibold py-3.5 rounded-xl text-center active:bg-blue-700 transition-colors flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 text-xs"
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
                      className="px-3 py-1.5 rounded-xl bg-[#0052FF] text-white text-xs font-semibold active:bg-blue-700 transition-colors shadow-2xs"
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

        </div>
      </div>
    </App>
  );
}
