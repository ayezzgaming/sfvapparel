'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store/app-store';
import { buildWhatsAppInquiryUrl } from '@/lib/whatsapp/dynamic-link';
import { lookupMalaysiaPostcode } from '@/lib/malaysia-postcode';
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
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit3
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';

export default function ProfilePage() {
  const router = useRouter();
  const { customer, isAuthenticated, isLoading, logout, updateProfile, updateAddress } = useAuth();
  const { companySettings } = useAppStore();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Profile Form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTeam, setEditTeam] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Address Form state
  const [addrLine, setAddrLine] = useState('');
  const [addrPostcode, setAddrPostcode] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressMsg, setAddressMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync customer data to form states when modal opens
  useEffect(() => {
    if (customer) {
      setEditName(customer.full_name || '');
      setEditEmail(customer.email || '');
      setEditTeam(customer.company_or_team || '');
      setAddrLine(customer.address || '');
      setAddrPostcode(customer.postal_code || '');
      setAddrCity(customer.city || '');
    }
  }, [customer]);

  // Malaysia Postcode auto-lookup (0ms Instant Realtime Synchronous Lookup)
  const handlePostcodeChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 5);
    setAddrPostcode(cleaned);

    if (cleaned.length >= 2) {
      const match = lookupMalaysiaPostcode(cleaned);
      if (match) {
        setAddrCity(`${match.city}, ${match.state}`);
      }
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsSavingProfile(true);
    setProfileMsg(null);

    const res = await updateProfile({
      full_name: editName.trim(),
      email: editEmail.trim() || undefined,
      company_or_team: editTeam.trim() || undefined,
    });

    setIsSavingProfile(false);
    if (res.success) {
      setProfileMsg({ type: 'success', text: 'Maklumat profil berjaya dikemaskini.' });
      setTimeout(() => {
        setIsEditProfileOpen(false);
        setProfileMsg(null);
      }, 1200);
    } else {
      setProfileMsg({ type: 'error', text: res.message || 'Gagal mengemaskini profil.' });
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrLine.trim()) return;
    setIsSavingAddress(true);
    setAddressMsg(null);

    const res = await updateAddress({
      address: addrLine.trim(),
      postal_code: addrPostcode.trim() || undefined,
      city: addrCity.trim() || undefined,
    });

    setIsSavingAddress(false);
    if (res.success) {
      setAddressMsg({ type: 'success', text: 'Alamat penghantaran berjaya disimpan di pangkalan data.' });
      setTimeout(() => {
        setIsAddressModalOpen(false);
        setAddressMsg(null);
      }, 1200);
    } else {
      setAddressMsg({ type: 'error', text: res.message || 'Gagal menyimpan alamat.' });
    }
  };

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

            {customer.company_or_team && (
              <p className="text-[11px] font-medium text-slate-600">
                {customer.company_or_team}
              </p>
            )}

            {customer.email && (
              <p className="text-[11px] text-slate-400 font-mono">
                {customer.email}
              </p>
            )}

            <div className="pt-1.5">
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200/80 text-[11px] font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
              >
                <Edit3 className="w-3 h-3" />
                <span>Kemaskini Profil</span>
              </button>
            </div>
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
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#0052FF] to-[#00BDFF] text-white text-xs font-bold active:scale-95 transition-all shadow-md shadow-blue-500/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log Masuk / Daftar</span>
            </Link>
          </div>
        </div>
      )}

      {/* 2. Inset Group 1: MAKLUMAT PENGHANTARAN & TEMPAHAN */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 px-3 block">
          Maklumat Tempahan & Alamat
        </span>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xs border border-slate-200/60 divide-y divide-slate-100">
          
          {/* Buku Alamat Penghantaran */}
          <div 
            onClick={() => {
              if (!isAuthenticated) {
                router.push('/auth/login?redirect=/profile');
                return;
              }
              setIsAddressModalOpen(true);
            }}
            className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 stroke-[1.75]" />
              </div>
              <div>
                <span className="text-[13.5px] font-medium text-slate-900 block">
                  Alamat Penghantaran
                </span>
                {isAuthenticated && customer?.address && (
                  <span className="text-[11px] text-slate-400 truncate max-w-[200px] block mt-0.5">
                    {customer.address}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-slate-400 shrink-0">
              <span className="text-xs text-slate-400 truncate max-w-[120px]">
                {isAuthenticated 
                  ? (customer?.city || (customer?.address ? 'Disimpan' : 'Tambah Alamat'))
                  : 'Log Masuk'}
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

      {/* 5. Inset Group 4: LOG KELUAR */}
      {isAuthenticated && (
        <div className="pt-2">
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full py-3.5 px-4 rounded-2xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 active:bg-rose-100 font-semibold text-xs tracking-tight shadow-xs transition-all flex items-center justify-center gap-2"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                <span>Mendaftar Keluar...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>Log Keluar Akaun ({formatPhone(customer?.whatsapp)})</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Footer Info */}
      <div className="pt-4 pb-8 text-center space-y-1">
        <p className="text-[11px] font-medium text-slate-400">
          SFV APPAREL • SF Ventures Marketing
        </p>
        <p className="text-[10px] text-slate-300">
          Versi 2.4.0 (PWA Live Build)
        </p>
      </div>

      {/* =========================================================================
          MODAL KEMASKINI PROFIL (NAMA & EMEL)
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Kemaskini Profil"
        subtitle="Maklumat rasmi invois dan resit tempahan"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
          {profileMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              profileMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            {/* Nama */}
            <div className="px-4 py-3">
              <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                Nama Penuh
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Nama anda"
                required
                className="w-full text-xs text-slate-900 placeholder-slate-300 bg-transparent focus:outline-none"
              />
            </div>

            {/* Emel */}
            <div className="px-4 py-3">
              <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                Alamat Emel (Untuk Salinan Invois)
              </label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="nama@contoh.com"
                className="w-full text-xs text-slate-900 placeholder-slate-300 bg-transparent focus:outline-none font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingProfile || !editName.trim()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {isSavingProfile ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menyimpan ke Pangkalan Data...</span>
              </>
            ) : (
              <span>Simpan Profil</span>
            )}
          </button>
        </form>
      </SwipeableBottomSheet>

      {/* =========================================================================
          MODAL ALAMAT PENGHANTARAN DENGAN API POSKOD MALAYSIA
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        maxHeight="max-h-[85vh]"
        title="Alamat Penghantaran Malaysia"
        subtitle="Alamat penghantaran tersimpan di pangkalan data"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4 pt-1">
          {addressMsg && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              addressMsg.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              {addressMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{addressMsg.text}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
            
            {/* Poskod (Auto Detect City & State) */}
            <div className="px-4 py-3">
              <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                Poskod Malaysia (5 Digit)
              </label>
              <input
                type="text"
                value={addrPostcode}
                onChange={(e) => handlePostcodeChange(e.target.value)}
                placeholder="Contoh: 50450 atau 40000"
                maxLength={5}
                className="w-full text-xs text-slate-900 placeholder-slate-300 bg-transparent focus:outline-none font-mono font-medium"
              />
            </div>

            {/* Bandar & Negeri (Auto-populated from API) */}
            <div className="px-4 py-3 bg-slate-50/50">
              <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                Bandar & Negeri (Auto Pengecaman)
              </label>
              <input
                type="text"
                value={addrCity}
                onChange={(e) => setAddrCity(e.target.value)}
                placeholder="Diisi automatik selepas poskod dimasukkan"
                className="w-full text-xs text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
              />
            </div>

            {/* Alamat Baris (No Rumah, Jalan, Taman) */}
            <div className="px-4 py-3">
              <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                Alamat Baris (No Rumah / Bangunan / Jalan)
              </label>
              <textarea
                rows={2}
                value={addrLine}
                onChange={(e) => setAddrLine(e.target.value)}
                placeholder="No 12, Jalan Hang Tuah, Seksyen 3"
                required
                className="w-full text-xs text-slate-900 placeholder-slate-300 bg-transparent focus:outline-none resize-none leading-relaxed"
              />
            </div>

          </div>

          <button
            type="submit"
            disabled={isSavingAddress || !addrLine.trim()}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
          >
            {isSavingAddress ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Menyimpan ke Pangkalan Data...</span>
              </>
            ) : (
              <span>Simpan Alamat Penghantaran</span>
            )}
          </button>
        </form>
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
            className="w-full bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold py-3.5 rounded-2xl text-center active:scale-[0.98] transition-all shadow-md shadow-blue-500/20 text-xs tracking-wide"
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
