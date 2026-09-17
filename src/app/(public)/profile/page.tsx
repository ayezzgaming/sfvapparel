'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore } from '@/lib/store/app-store';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import { 
  MapPin,
  CreditCard,
  Ruler, 
  MessageCircle,
  Bell,
  ShieldCheck,
  ChevronRight,
  RotateCcw,
  Check,
  FileText
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';

export default function ProfilePage() {
  const { customers, resetToSeedData } = useAppStore();
  const activeCustomer = customers[0] || {
    full_name: 'Muhammad Farhan',
    email: 'farhan.harimau@gmail.com',
    phone: '+60 12-345 6789',
    company_or_team: 'Kelab Esports Harimau MY',
    address: 'No 15, Jalan Ampang, 50450 Kuala Lumpur',
  };

  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  const handleReset = () => {
    if (confirm('Set semula semua data tempahan dan pilihan kepada asal?')) {
      resetToSeedData();
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 2500);
    }
  };

  return (
    <div className="w-full min-h-full pt-2 pb-16 px-4 space-y-6 select-none font-ios bg-[#F2F2F7]">
      
      {/* 1. Page Header (Clean & Minimal) */}
      <div className="px-1 pt-2">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Akaun
        </h1>
      </div>

      {/* 2. User Profile Card (iOS Modern Inset Card) */}
      <div className="bg-white rounded-2xl p-4 shadow-2xs border border-slate-200/60 flex items-center gap-3.5">
        <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-slate-900 to-slate-700 text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs ring-4 ring-slate-100">
          {activeCustomer.full_name.charAt(0)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight truncate">
              {activeCustomer.full_name}
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-normal truncate mt-0.5">
            {activeCustomer.email}
          </p>
          <p className="text-[11px] font-medium text-blue-600 mt-0.5 truncate">
            {activeCustomer.company_or_team || 'Pelanggan Individu'}
          </p>
        </div>
      </div>

      {/* 3. Inset Group 1: AKTIKITI & PENGURUSAN */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 block">
          Maklumat Tempahan
        </span>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xs border border-slate-200/60 divide-y divide-slate-100">
          
          {/* Buku Alamat */}
          <div 
            onClick={() => setIsAddressModalOpen(true)}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0052FF] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-[13.5px] font-medium text-slate-900">
                Alamat Penghantaran
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-xs text-slate-400 truncate max-w-[120px]">Kuala Lumpur</span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
          </div>

          {/* Jadual Ukuran Saiz */}
          <div 
            onClick={() => setIsSizeChartOpen(true)}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Ruler className="w-4 h-4" />
              </div>
              <span className="text-[13.5px] font-medium text-slate-900">
                Panduan Saiz Jersi & DTF
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-xs text-slate-400">XS - 7XL</span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
          </div>

          {/* Kaedah Pembayaran */}
          <div className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 active:bg-slate-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-[13.5px] font-medium text-slate-900">
                Kaedah Pembayaran
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-xs text-slate-400">FPX / DuitNow</span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
          </div>

        </div>
      </div>

      {/* 4. Inset Group 2: BANTUAN & SOKONGAN */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 block">
          Bantuan & Sokongan
        </span>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xs border border-slate-200/60 divide-y divide-slate-100">
          
          {/* WhatsApp Support */}
          <a
            href="https://wa.me/60148599138?text=Hai%20SFV%20Apparel,%20saya%20memerlukan%20bantuan%20mengenai%20tempahan%20saya"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 active:bg-slate-100 transition-colors block"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#25D366] flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4" />
              </div>
              <span className="text-[13.5px] font-medium text-slate-900">
                Hubungi Khidmat Pelanggan
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-emerald-600 font-medium">WhatsApp</span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
          </a>

          {/* Terma & Polisi */}
          <Link
            href="/#polisi"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 active:bg-slate-100 transition-colors block"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-[13.5px] font-medium text-slate-900">
                Polisi & Jaminan Kualiti
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </Link>

        </div>
      </div>

      {/* 5. Inset Group 3: TETAPAN & SISTEM */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 block">
          Tetapan
        </span>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xs border border-slate-200/60 divide-y divide-slate-100">
          
          {/* Notifikasi Pesanan */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <span className="text-[13.5px] font-medium text-slate-900">
                Notifikasi Status Kilang
              </span>
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
            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 active:bg-slate-100 transition-colors block"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="text-[13.5px] font-medium text-slate-900">
                Panel Pentadbir Kilang (Admin)
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </Link>

        </div>
      </div>

      {/* 6. Footer & Reset Action */}
      <div className="pt-2 text-center space-y-2">
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 active:scale-95 transition-all p-1.5"
        >
          {resetSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 font-medium">Data berjaya diset semula</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Set Semula Data Contoh</span>
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-400 font-medium tracking-tight">
          SFV Apparel App v1.2.0 • Beroperasi di Malaysia 🇲🇾
        </p>
      </div>

      {/* =========================================================================
          MODAL ALAMAT PENGHANTARAN
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        maxHeight="max-h-[80vh]"
        title="Alamat Penghantaran"
        subtitle="Alamat penghantaran utama untuk pesanan anda"
        footer={
          <button
            type="button"
            onClick={() => setIsAddressModalOpen(false)}
            className="w-full bg-[#0052FF] text-white font-semibold py-3.5 rounded-xl text-center active:bg-blue-700 transition-colors text-xs"
          >
            Simpan Alamat
          </button>
        }
      >
        <div className="space-y-3 pt-1">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1 text-xs">
            <span className="font-bold text-slate-900 block">{activeCustomer.full_name}</span>
            <p className="text-slate-600 leading-relaxed">{activeCustomer.address}</p>
            <p className="text-slate-500 font-mono text-[11px] pt-1">{activeCustomer.phone}</p>
          </div>
          <p className="text-[11px] text-slate-400">
            Penghantaran dilakukan melalui kurier J&T Express, Ninja Van atau Pos Laju ke seluruh Malaysia.
          </p>
        </div>
      </SwipeableBottomSheet>

      {/* =========================================================================
          MODAL JADUAL UKURAN SAIZ (SWIPEABLE iOS BOTTOM SHEET)
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isSizeChartOpen}
        onClose={() => setIsSizeChartOpen(false)}
        maxHeight="max-h-[85vh]"
        title="Jadual Ukuran Saiz Standard"
        subtitle="Ukuran jersi sukan & baju DTF Asia Fit (Inci)"
        footer={
          <button
            type="button"
            onClick={() => setIsSizeChartOpen(false)}
            className="w-full bg-[#0052FF] text-white font-semibold py-3.5 rounded-xl text-center active:bg-blue-700 transition-colors text-xs"
          >
            Tutup Panduan Saiz
          </button>
        }
      >
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 font-bold">Saiz</th>
                <th className="py-2.5 font-bold">Dada (Inci)</th>
                <th className="py-2.5 font-bold">Labuh (Inci)</th>
                <th className="py-2.5 font-bold">Bahu (Inci)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11.5px]">
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

        <div className="mt-3 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
          💡 <strong>Nota Kilang:</strong> Toleransi ukuran jersi adalah ±0.5 inci disebabkan elastisiti fabrik semasa proses jahitan kemas.
        </div>
      </SwipeableBottomSheet>
    </div>
  );
}
