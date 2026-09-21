'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store/app-store';
import { buildWhatsAppInquiryUrl } from '@/lib/whatsapp/dynamic-link';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import { 
  MapPin,
  CreditCard,
  Ruler, 
  Bell,
  ChevronRight,
  LogOut,
  LogIn,
  FileText,
  User,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';

export default function ProfilePage() {
  const router = useRouter();
  const { customer, isAuthenticated, isLoading, logout } = useAuth();
  const { companySettings } = useAppStore();

  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (confirm('Adakah anda pasti untuk log keluar dari akaun ini?')) {
      setIsLoggingOut(true);
      await logout();
      setIsLoggingOut(false);
      router.refresh();
    }
  };

  const formatPhone = (p?: string | null) => {
    if (!p) return '-';
    return p.replace(/(\d{2})(\d{4})(\d+)/, '+$1 $2 $3');
  };

  return (
    <div className="w-full min-h-full pt-4 pb-16 px-4 space-y-6 select-none font-ios bg-[#F2F2F7]">
      
      {/* 1. Centered Apple iOS Profile Card */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center text-center py-8 space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <span className="text-xs text-slate-400">Memuatkan maklumat akaun...</span>
        </div>
      ) : isAuthenticated && customer ? (
        <div className="flex flex-col items-center justify-center text-center pt-2 pb-1 space-y-2.5">
          <div className="w-20 h-20 rounded-full bg-slate-900 text-white flex items-center justify-center font-semibold text-2xl ring-4 ring-white shadow-xs">
            {customer.full_name ? customer.full_name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-lg font-semibold text-slate-900 tracking-tight">
                {customer.full_name}
              </h1>
              {customer.phone_verified && (
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
              )}
            </div>

            <p className="text-xs text-slate-500 font-mono">
              {formatPhone(customer.whatsapp || customer.email)}
            </p>

            {customer.email && !customer.email.includes('@whatsapp.noreply') && (
              <p className="text-[11px] text-slate-400">
                {customer.email}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* Guest / Not logged in State (Apple Monochromatic Style) */
        <div className="pt-2 pb-1 text-center space-y-3">
          <div className="w-20 h-20 rounded-full bg-slate-200/80 text-slate-500 flex items-center justify-center mx-auto ring-4 ring-white shadow-xs">
            <User className="w-9 h-9 stroke-[1.5]" />
          </div>

          <div className="space-y-1 max-w-xs mx-auto">
            <h1 className="text-base font-semibold text-slate-900 tracking-tight">
              Akaun Pengguna
            </h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Log masuk atau daftar dengan nombor WhatsApp untuk menyegerakkan tempahan, alamat dan senarai pilihan anda.
            </p>
          </div>

          <div className="pt-1">
            <Link
              href="/auth/login?redirect=/profile"
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white text-xs font-medium active:scale-95 transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log Masuk / Daftar</span>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Inset Group 1: MAKLUMAT TEMPAHAN */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 px-3 block">
          Maklumat Tempahan
        </span>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xs border border-slate-200/60 divide-y divide-slate-100">
          
          {/* Buku Alamat */}
          <div 
            onClick={() => setIsAddressModalOpen(true)}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 stroke-[1.75]" />
              </div>
              <span className="text-[13.5px] font-medium text-slate-900">
                Alamat Penghantaran
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-slate-400">
              <span className="text-xs text-slate-400 truncate max-w-[120px]">
                {isAuthenticated ? 'Malaysia' : 'Belum ditetapkan'}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </div>
          </div>

          {/* Jadual Ukuran Saiz */}
          <div 
            onClick={() => setIsSizeChartOpen(true)}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Ruler className="w-4 h-4 stroke-[1.75]" />
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
          <div className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <CreditCard className="w-4 h-4 stroke-[1.75]" />
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

      {/* 3. Inset Group 2: BANTUAN & SOKONGAN */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 px-3 block">
          Bantuan & Sokongan
        </span>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xs border border-slate-200/60 divide-y divide-slate-100">
          
          {/* WhatsApp Support */}
          <a
            href={buildWhatsAppInquiryUrl({
              phone: companySettings?.whatsapp_number,
              type: 'general',
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors block"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <FaWhatsapp className="w-4.5 h-4.5" />
              </div>
              <span className="text-[13.5px] font-medium text-slate-900">
                Khidmat Pelanggan WhatsApp
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </a>

          {/* Terma & Polisi */}
          <Link
            href="/#polisi"
            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors block"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 stroke-[1.75]" />
              </div>
              <span className="text-[13.5px] font-medium text-slate-900">
                Polisi & Jaminan Kualiti
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </Link>

        </div>
      </div>

      {/* 4. Inset Group 3: TETAPAN */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 px-3 block">
          Tetapan
        </span>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xs border border-slate-200/60">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 stroke-[1.75]" />
              </div>
              <span className="text-[13.5px] font-medium text-slate-900">
                Notifikasi Status Kilang
              </span>
            </div>

            {/* Apple iOS Switch */}
            <button
              type="button"
              onClick={() => setPushEnabled(!pushEnabled)}
              aria-label="Toggle Notifikasi"
              className={`w-11 h-6 rounded-full transition-colors duration-200 p-0.5 flex items-center shrink-0 ${
                pushEnabled ? 'bg-slate-900' : 'bg-slate-300'
              }`}
            >
              <span className={`w-5 h-5 rounded-full bg-white shadow-xs block transform transition-transform duration-200 ${
                pushEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* 5. Inset Group 4: LOG KELUAR (When Authenticated) */}
      {isAuthenticated && (
        <div className="space-y-1.5">
          <div className="bg-white rounded-2xl overflow-hidden shadow-2xs border border-slate-200/60">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-between px-4 py-3.5 text-rose-600 hover:bg-rose-50/50 active:bg-rose-100/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4 stroke-[1.75]" />
                </div>
                <span className="text-[13.5px] font-medium">
                  {isLoggingOut ? 'Sedang Log Keluar...' : 'Log Keluar Akaun'}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-300 shrink-0" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Footer Info */}
      <div className="pt-2 text-center">
        <p className="text-[10px] text-slate-400 font-medium tracking-tight">
          SFV Apparel App v1.2.0 • Beroperasi di Malaysia
        </p>
      </div>

      {/* MODAL ALAMAT PENGHANTARAN */}
      <SwipeableBottomSheet
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        maxHeight="max-h-[80vh]"
        title="Alamat Penghantaran"
        subtitle="Alamat penghantaran pesanan anda"
        footer={
          <button
            type="button"
            onClick={() => setIsAddressModalOpen(false)}
            className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl text-center active:bg-slate-800 transition-colors text-xs"
          >
            Tutup
          </button>
        }
      >
        <div className="space-y-3 pt-1 text-xs">
          {isAuthenticated && customer ? (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1.5">
              <span className="font-semibold text-slate-900 block">{customer.full_name}</span>
              <p className="text-slate-500 font-mono text-[11px]">{formatPhone(customer.whatsapp)}</p>
              <p className="text-slate-500 text-[11px] pt-1">
                Alamat pengesahan akan dimasukkan semasa langkah pengesahan pesanan akhir.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-center space-y-2">
              <p className="text-slate-600">Sila log masuk untuk menguruskan alamat penghantaran anda.</p>
              <Link
                href="/auth/login?redirect=/profile"
                onClick={() => setIsAddressModalOpen(false)}
                className="inline-block text-xs font-medium text-blue-600 hover:underline"
              >
                Log Masuk Sekarang →
              </Link>
            </div>
          )}
          <p className="text-[11px] text-slate-400">
            Penghantaran kurier disokong ke seluruh Semenanjung, Sabah & Sarawak.
          </p>
        </div>
      </SwipeableBottomSheet>

      {/* MODAL JADUAL UKURAN SAIZ */}
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
            className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl text-center active:bg-slate-800 transition-colors text-xs"
          >
            Tutup Panduan Saiz
          </button>
        }
      >
        <div className="overflow-x-auto pt-1">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-400 uppercase text-[10px] tracking-wider">
                <th className="py-2.5 font-semibold">Saiz</th>
                <th className="py-2.5 font-semibold">Dada (Inci)</th>
                <th className="py-2.5 font-semibold">Labuh (Inci)</th>
                <th className="py-2.5 font-semibold">Bahu (Inci)</th>
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
                  <td className="py-2.5 font-semibold text-slate-900">{row.sz}</td>
                  <td className="py-2.5 text-slate-600">{row.chest}</td>
                  <td className="py-2.5 text-slate-600">{row.length}</td>
                  <td className="py-2.5 text-slate-600">{row.shoulder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 p-3 rounded-xl bg-slate-100 text-[11px] text-slate-700 leading-relaxed">
          <strong>Nota:</strong> Toleransi ukuran jersi adalah ±0.5 inci disebabkan elastisiti fabrik semasa proses jahitan kemas.
        </div>
      </SwipeableBottomSheet>
    </div>
  );
}
