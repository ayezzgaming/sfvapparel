'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  Mail,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

function MalaysiaFlagIcon() {
  return (
    <svg className="w-5 h-3.5 rounded-[2px] shrink-0 shadow-2xs" viewBox="0 0 640 320" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 14 Red and White stripes */}
      <rect width="640" height="320" fill="#CC0000" />
      <path d="M0 22.857h640v22.857H0zM0 68.571h640v22.858H0zM0 114.286h640v22.857H0zM0 160h640v22.857H0zM0 205.714h640v22.857H0zM0 251.429h640v22.857H0zM0 297.143h640v22.857H0z" fill="#FFFFFF" />
      {/* Canton Blue field */}
      <rect width="320" height="182.857" fill="#000066" />
      {/* Crescent */}
      <path d="M190 91.429a57.143 57.143 0 1 1-114.286 0 57.143 57.143 0 0 1 114.286 0z" fill="#FFCC00" />
      <path d="M201.429 91.429a51.429 51.429 0 1 1-102.858 0 51.429 51.429 0 0 1 102.858 0z" fill="#000066" />
      {/* 14-point Star */}
      <circle cx="190" cy="91.4" r="32" fill="#FFCC00" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const destination = redirectTo && redirectTo !== '/auth/login' ? redirectTo : '/';
  const { refresh } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp' | 'complete-profile'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [phone, setPhone] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  // OTP fields
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const cleanPhoneInput = (val: string) => {
    // Keep only digits
    let cleaned = val.replace(/\D/g, '');
    // If user pasted 601..., strip the leading 60 because +60 is already in prefix
    if (cleaned.startsWith('60')) {
      cleaned = cleaned.slice(2);
    }
    // If user typed leading 0 (e.g. 012...), strip it
    if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1);
    }
    // Max 10 digits after +60 (e.g. 1112345678)
    return cleaned.slice(0, 10);
  };

  const formatPhoneDisplay = (p: string) => {
    const raw = p.replace(/\D/g, '');
    if (raw.startsWith('60')) {
      const rest = raw.slice(2);
      return `+60 ${rest.slice(0, 2)} ${rest.slice(2, 6)} ${rest.slice(6)}`;
    }
    return p;
  };

  // STEP 1: Send OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const digitsOnly = cleanPhoneInput(phone);
    if (!digitsOnly || digitsOnly.length < 8) {
      setError('Sila masukkan nombor telefon yang sah (cth: 12 345 6789).');
      return;
    }

    setIsLoading(true);

    try {
      const fullPhone = `60${digitsOnly}`;
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Gagal menghantar kod pengesahan.');
        return;
      }

      setNormalizedPhone(data.phone || fullPhone);
      setSuccessMsg(data.message || 'Kod OTP telah dihantar ke WhatsApp anda.');
      setStep('otp');
      setCountdown(60);

      if (data.devOtp && typeof data.devOtp === 'string') {
        const devOtpChars = data.devOtp.split('').slice(0, 6);
        setOtp(devOtpChars);
        setTimeout(() => handleVerifyOtp(data.devOtp, data.phone || fullPhone), 600);
      } else {
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError('Ralat sambungan. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (otpCode: string, targetPhone?: string) => {
    setError('');
    setIsLoading(true);

    try {
      const activePhone = targetPhone || normalizedPhone;
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: activePhone,
          otp: otpCode,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Kod OTP tidak sah.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        return;
      }

      // Check if new customer needing profile completion
      if (data.isNewCustomer) {
        setStep('complete-profile');
        setSuccessMsg('Nombor WhatsApp disahkan! Sila lengkapkan nama anda.');
        return;
      }

      // Existing customer: successfully logged in
      await refresh();
      router.push(destination);
    } catch {
      setError('Ralat sambungan. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Complete Profile for New Customer
  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Sila masukkan nama penuh anda.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: name.trim(),
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Gagal menyimpan maklumat profil.');
        return;
      }

      await refresh();
      router.push(destination);
    } catch {
      setError('Ralat sambungan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d) && value) {
      handleVerifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      handleVerifyOtp(pasted);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    setOtp(['', '', '', '', '', '']);
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizedPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setCountdown(60);
        setSuccessMsg('Kod pengesahan baru telah dihantar.');
        if (data.devOtp && typeof data.devOtp === 'string') {
          const devOtpChars = data.devOtp.split('').slice(0, 6);
          setOtp(devOtpChars);
          setTimeout(() => handleVerifyOtp(data.devOtp, normalizedPhone), 600);
        } else {
          setTimeout(() => otpRefs.current[0]?.focus(), 100);
        }
      } else {
        setError(data.message || 'Gagal menghantar semula kod.');
      }
    } catch {
      setError('Ralat sambungan.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (step === 'otp') {
      setStep('phone');
      setOtp(['', '', '', '', '', '']);
      setError('');
      return;
    }

    if (step === 'complete-profile') {
      // User is verified, navigate to home or destination
      router.push('/');
      return;
    }

    // Always return to home page
    try {
      router.push('/');
    } catch {
      window.location.href = '/';
    }
  };

  return (
    <div className="h-[100dvh] min-h-[100dvh] w-full bg-[#F2F2F7] flex flex-col justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] overflow-y-auto sparkle-scroll font-ios antialiased selection:bg-slate-200">
      
      {/* Top Bar / Back button */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between shrink-0">
        <Link
          href="/"
          onClick={handleBack}
          aria-label="Kembali ke halaman utama"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 active:bg-slate-200/80 active:scale-95 transition-all py-2 px-2.5 -ml-2 rounded-xl cursor-pointer select-none"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Kembali</span>
        </Link>
        <Link
          href="/"
          className="text-xs tracking-tight text-slate-700 leading-none flex items-center hover:opacity-80 transition-opacity p-1.5"
        >
          <span className="font-extrabold text-slate-900">SFV</span>
          <span className="font-light ml-1 text-slate-500">APPAREL</span>
        </Link>
      </div>

      {/* Center Container */}
      <div className="w-full max-w-sm mx-auto my-auto py-6 shrink-0">
        
        {/* Brand Header */}
        <div className="text-center mb-6 space-y-1.5">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100/80 text-[#0052FF] text-[10.5px] font-bold mb-1">
            <ShieldCheck className="w-3 h-3 text-[#0052FF]" />
            <span>Pengesahan WhatsApp Rasmi</span>
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {step === 'phone'
              ? 'Log Masuk / Pendaftaran'
              : step === 'otp'
              ? 'Pengesahan WhatsApp'
              : 'Lengkapkan Profil'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {step === 'phone'
              ? 'Masukkan nombor WhatsApp anda untuk menerima kod pengesahan masuk atau pendaftaran baru.'
              : step === 'otp'
              ? `Kod pengesahan 6-digit telah dihantar ke nombor ${formatPhoneDisplay(normalizedPhone)}`
              : 'Pendaftaran nombor berjaya. Sila masukkan nama anda untuk rekod rasmi tempahan dan invois kilang.'}
          </p>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-white border border-rose-200/80 shadow-xs flex items-start gap-2.5 text-xs text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="mb-4 p-3 rounded-2xl bg-white border border-blue-100 shadow-xs flex items-start gap-2.5 text-xs text-slate-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#0052FF]" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* =========================================================================
            STEP 1: PHONE ONLY INPUT (INDUSTRY STANDARD INPUT GROUP WITH MALAYSIA +60)
           ========================================================================= */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 space-y-2">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Nombor WhatsApp
              </label>

              {/* Input Group with Country Code & Malaysia Flag */}
              <div className="flex items-center rounded-xl bg-slate-50/80 border border-slate-200/80 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                {/* Flag + Country Code */}
                <div className="flex items-center gap-2 shrink-0 select-none pr-3 border-r border-slate-200">
                  <MalaysiaFlagIcon />
                  <span className="text-xs font-bold text-slate-800 font-mono">+60</span>
                </div>

                {/* Main Phone Input */}
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(cleanPhoneInput(e.target.value))}
                  placeholder="12 345 6789"
                  required
                  autoFocus
                  className="w-full pl-3 text-sm font-semibold text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none font-mono tracking-wide"
                />
              </div>

              <p className="text-[10.5px] text-slate-400 leading-normal pl-0.5">
                Pengguna sedia ada akan terus log masuk. Pelanggan baru akan didaftarkan secara automatik.
              </p>
            </div>

            {/* Action Button - SFV Brand Gradient */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading || !phone.trim() || phone.trim().length < 8}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menghantar Kod WhatsApp...</span>
                  </>
                ) : (
                  <>
                    <span>Hantar Kod Pengesahan</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

        {/* =========================================================================
            STEP 2: 6-DIGIT OTP INPUT (APPLE GRADE CLEAN)
           ========================================================================= */}
        {step === 'otp' && (
          <div className="space-y-5">
            
            {/* 6-Digit OTP Box Grid */}
            <div className="flex justify-between gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { otpRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  disabled={isLoading}
                  className={`w-12 h-14 text-center text-xl font-mono font-bold rounded-2xl bg-white border transition-all focus:outline-none shadow-xs ${
                    digit 
                      ? 'border-[#00BDFF] ring-2 ring-sky-100 text-slate-900' 
                      : 'border-slate-200 text-slate-900 focus:border-[#00BDFF] focus:ring-2 focus:ring-sky-100'
                  }`}
                />
              ))}
            </div>

            {/* Resend & Edit Actions */}
            <div className="flex flex-col items-center space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || isLoading}
                className="text-xs font-semibold text-[#0052FF] hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed transition-colors"
              >
                {countdown > 0
                  ? `Hantar semula kod dalam ${countdown}s`
                  : 'Hantar Semula Kod Pengesahan'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('phone');
                  setOtp(['', '', '', '', '', '']);
                  setError('');
                }}
                disabled={isLoading}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
              >
                Tukar Nombor Telefon
              </button>
            </div>

          </div>
        )}

        {/* =========================================================================
            STEP 3: COMPLETE PROFILE (FOR NEW CUSTOMERS ONLY)
           ========================================================================= */}
        {step === 'complete-profile' && (
          <form onSubmit={handleCompleteProfile} className="space-y-4">
            
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
              
              {/* Nama Penuh Input Group */}
              <div className="px-4 py-3.5 space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Nama Penuh
                </label>
                <div className="flex items-center rounded-xl bg-slate-50/80 border border-slate-200/80 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                  <User className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama penuh anda"
                    required
                    autoFocus
                    className="w-full text-xs font-medium text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              {/* Emel Input Group */}
              <div className="px-4 py-3.5 space-y-1">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Emel (Pilihan)
                </label>
                <div className="flex items-center rounded-xl bg-slate-50/80 border border-slate-200/80 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@contoh.com"
                    className="w-full text-xs font-mono text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-slate-400 pt-0.5">
                  Untuk menerima salinan invois digital & resit rasmi tempahan.
                </p>
              </div>

            </div>

            {/* Action Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading || !name.trim()}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Menyimpan Maklumat...</span>
                  </>
                ) : (
                  <>
                    <span>Selesai & Masuk</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>

      {/* Footer System Info */}
      <div className="w-full max-w-md mx-auto pt-4 pb-1 text-center shrink-0">
        <p className="text-[10.5px] text-slate-400 font-medium">
          SFV APPAREL • Sistem Pengesahan Selamat
        </p>
      </div>

    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] min-h-[100dvh] w-full bg-[#F2F2F7] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
