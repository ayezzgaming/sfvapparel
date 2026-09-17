'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';
import { useUI } from '@/lib/store/ui-context';
import { 
  CreditCard,
  MapPin,
  Share2,
  Bell,
  Ruler, 
  SlidersHorizontal,
  RotateCcw,
  ChevronRight,
  BookOpen,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  X
} from 'lucide-react';

export default function ProfilePage() {
  const { customers, orders, resetToSeedData } = useAppStore();
  const { setBottomSheetOpen } = useUI();
  const activeCustomer = customers[0] || {
    full_name: 'Muhammad Farhan',
    email: 'farhan.harimau@gmail.com',
    phone: '+60 12-345 6789',
    company_or_team: 'Kelab Esports Harimau MY',
    address: 'No 15, Jalan Ampang, 50450 Kuala Lumpur',
  };

  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Sync with global UIContext so Bottom Nav & WhatsApp FAB automatically hide when sheet is open
  React.useEffect(() => {
    setBottomSheetOpen(isSizeChartOpen);
    return () => setBottomSheetOpen(false);
  }, [isSizeChartOpen, setBottomSheetOpen]);

  const handleReset = () => {
    if (confirm('Set semula data kedai kepada asal?')) {
      resetToSeedData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2000);
    }
  };

  return (
    <div className="w-full min-h-full pt-4 pb-12 px-4 space-y-5 select-none font-ios bg-[#F2F2F7]">
      
      {/* 1. Page Title Header */}
      <div className="px-1">
        <h1 className="text-xl sm:text-[22px] font-bold text-slate-900 tracking-tight">
          Profil & Tetapan
        </h1>
        <p className="text-xs text-slate-500 font-normal tracking-wide mt-0.5">
          Urus maklumat akaun, alamat penghantaran & panduan saiz
        </p>
      </div>

      {/* 2. User Card (Clean iOS Style) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/70 flex items-center space-x-3.5">
        <div className="w-12 h-12 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs">
          {activeCustomer.full_name.charAt(0)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2 className="text-[14.5px] font-bold text-slate-900 tracking-tight truncate">
              {activeCustomer.full_name}
            </h2>
            <span className="text-[9.5px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full uppercase tracking-wider">
              VIP Team
            </span>
          </div>
          <p className="text-[11.5px] text-slate-500 truncate mt-0.5">
            {activeCustomer.email}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">
            {activeCustomer.company_or_team || 'Pelanggan Rasmi SFV'}
          </p>
        </div>
      </div>

      {/* 3. Inset Grouped Section 1: AKAUN & TEMPAHAN */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
          Akaun & Tempahan
        </span>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/70 divide-y divide-slate-100">
          {/* Buku Alamat */}
          <div className="flex items-center justify-between p-3.5 pl-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3.5 min-w-0 pr-2">
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-slate-900 block leading-tight">
                  Buku Alamat
                </span>
                <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                  {activeCustomer.address}
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </div>

          {/* Kaedah Pembayaran */}
          <div className="flex items-center justify-between p-3.5 pl-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer">
            <div className="flex items-center space-x-3.5 min-w-0 pr-2">
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-slate-900 block leading-tight">
                  Kaedah Pembayaran
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  FPX Online Banking, DuitNow QR & Kad Bank
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </div>

          {/* Jadual Ukuran Saiz */}
          <div 
            onClick={() => setIsSizeChartOpen(true)}
            className="flex items-center justify-between p-3.5 pl-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3.5 min-w-0 pr-2">
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Ruler className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-slate-900 block leading-tight">
                  Jadual Ukuran Saiz Jersi
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Panduan carta saiz regular fit Asia (XS - 7XL)
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </div>

          {/* Hubungi Pereka Khas */}
          <a
            href="https://wa.me/60148599138?text=Hai%20SFV%20Apparel,%20saya%20ingin%20tanya%20tentang%20tempahan%20jersi%20pasukan"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 pl-4 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer block"
          >
            <div className="flex items-center space-x-3.5 min-w-0 pr-2">
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Share2 className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-slate-900 block leading-tight">
                  Hubungi Pereka Khas (WhatsApp)
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Rundingan rekaan percuma bersama pereka SFV
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </a>
        </div>
      </div>

      {/* 4. Inset Grouped Section 2: PENTADBIRAN & TETAPAN */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 block">
          Tetapan Aplikasi
        </span>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200/70 divide-y divide-slate-100">
          {/* Notifikasi Pesanan */}
          <div className="flex items-center justify-between p-3.5 pl-4">
            <div className="flex items-center space-x-3.5 min-w-0 pr-2">
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-slate-900 block leading-tight">
                  Notifikasi Status Pesanan
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Kemas kini proses cetakan & penghantaran pos
                </span>
              </div>
            </div>

            {/* Native Smooth iOS Switch */}
            <button
              type="button"
              onClick={() => setPushEnabled(!pushEnabled)}
              aria-label="Toggle Notifikasi"
              className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 flex items-center shrink-0 ${
                pushEnabled ? 'bg-[#0052FF]' : 'bg-slate-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-full bg-white shadow-sm block transform transition-transform duration-200 ${
                pushEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Panel Kawalan Admin */}
          <Link
            href="/admin"
            className="flex items-center justify-between p-3.5 pl-4 hover:bg-slate-50 active:bg-slate-100 transition-colors block"
          >
            <div className="flex items-center space-x-3.5 min-w-0 pr-2">
              <div className="w-8.5 h-8.5 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <SlidersHorizontal className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div className="min-w-0">
                <span className="text-[13px] font-semibold text-slate-900 block leading-tight">
                  Panel Kawalan Admin
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Urus pesanan kilang, inventori kain & harga
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </Link>
        </div>
      </div>

      {/* Set Semula Data Contoh */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-600 active:scale-95 transition-all p-2"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{resetSuccess ? 'Selesai Set Semula Data' : 'Set Semula Data Contoh Kedai'}</span>
        </button>
      </div>

      {/* =========================================================================
          MODAL JADUAL UKURAN SAIZ (NATIVE iOS BOTTOM SHEET ARCHITECTURE)
         ========================================================================= */}
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isSizeChartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsSizeChartOpen(false)}
      />

      {/* Sheet Container */}
      <div 
        className={`fixed inset-x-0 bottom-0 z-50 w-full max-w-md mx-auto bg-white rounded-t-[32px] rounded-b-none mb-0 shadow-2xl transform transition-transform duration-300 ease-out flex flex-col max-h-[88vh] ${
          isSizeChartOpen ? 'translate-y-0 pointer-events-auto' : 'translate-y-full pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="pt-3 pb-2.5 px-6 shrink-0 border-b border-black/[0.04]">
          <div className="flex justify-center pb-2.5">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>
          <div className="flex justify-between items-center pb-1">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Jadual Saiz Standard SFV</h3>
              <p className="text-[11px] text-slate-400">Ukuran jersi sukan & baju DTF (Inci / cm)</p>
            </div>
            <button
              type="button"
              onClick={() => setIsSizeChartOpen(false)}
              aria-label="Tutup"
              className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 active:scale-95 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto sparkle-scroll space-y-4 flex-1">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 uppercase text-[10px] tracking-wider">
                  <th className="py-2 font-bold">Saiz</th>
                  <th className="py-2 font-bold">Dada (Inci)</th>
                  <th className="py-2 font-bold">Labuh (Inci)</th>
                  <th className="py-2 font-bold">Bahu (Inci)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {[
                  { sz: 'XS', chest: '36"', length: '26"', shoulder: '16"' },
                  { sz: 'S', chest: '38"', length: '27"', shoulder: '17"' },
                  { sz: 'M', chest: '40"', length: '28"', shoulder: '18"' },
                  { sz: 'L', chest: '42"', length: '29"', shoulder: '19"' },
                  { sz: 'XL', chest: '44"', length: '30"', shoulder: '20"' },
                  { sz: '2XL', chest: '46"', length: '31"', shoulder: '21"' },
                  { sz: '3XL', chest: '48"', length: '32"', shoulder: '22"' },
                  { sz: '4XL', chest: '50"', length: '33"', shoulder: '23"' },
                  { sz: '5XL', chest: '52"', length: '34"', shoulder: '24"' },
                ].map((row) => (
                  <tr key={row.sz} className="hover:bg-slate-50">
                    <td className="py-2.5 font-bold text-slate-900">{row.sz}</td>
                    <td className="py-2.5 text-slate-600">{row.chest}</td>
                    <td className="py-2.5 text-slate-600">{row.length}</td>
                    <td className="py-2.5 text-slate-600">{row.shoulder}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px] text-slate-500 leading-relaxed">
            💡 <strong>Nota Kilang:</strong> Toleransi ukuran jersi adalah ±0.5 inci disebabkan regangan fabrik drifit mikro ketika proses jahitan.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 px-6 bg-white/95 backdrop-blur-md border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={() => setIsSizeChartOpen(false)}
            className="w-full bg-slate-900 text-white font-semibold py-3 rounded-xl text-center active:bg-slate-800 transition-colors text-xs"
          >
            Faham & Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
