'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  ChevronLeft,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { refresh } = useAuth();

  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [normalizedPhone, setNormalizedPhone] = useState('');

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

  const formatPhoneDisplay = (p: string) => {
    return p.replace(/(\d{2})(\d{4})(\d+)/, '+$1 $2 $3');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, email: email || undefined }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Gagal menghantar kod pengesahan.');
        return;
      }

      setNormalizedPhone(data.phone);
      setSuccessMsg(data.message);
      setStep('otp');
      setCountdown(60);

      if (data.devOtp && typeof data.devOtp === 'string') {
        const devOtpChars = data.devOtp.split('').slice(0, 6);
        setOtp(devOtpChars);
        setTimeout(() => handleVerifyOtp(data.devOtp), 600);
      } else {
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError('Ralat sambungan. Sila cuba lagi.');
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

  const handleVerifyOtp = async (otpCode: string) => {
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          phone: normalizedPhone,
          otp: otpCode,
          name,
          email: email || undefined,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.message || 'Kod OTP tidak sah.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        return;
      }

      await refresh();
      router.push(redirectTo);
    } catch {
      setError('Ralat sambungan. Sila cuba lagi.');
    } finally {
      setIsLoading(false);
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
        body: JSON.stringify({ phone, name, email: email || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setCountdown(60);
        setSuccessMsg('Kod pengesahan baru telah dihantar.');
        if (data.devOtp && typeof data.devOtp === 'string') {
          const devOtpChars = data.devOtp.split('').slice(0, 6);
          setOtp(devOtpChars);
          setTimeout(() => handleVerifyOtp(data.devOtp), 600);
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

  return (
    <div className="h-[100dvh] min-h-[100dvh] w-full bg-[#F2F2F7] flex flex-col justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] overflow-y-auto sparkle-scroll font-ios antialiased selection:bg-slate-200">
      {/* Top Bar / Back button */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between shrink-0">
        <Link
          href={redirectTo}
          className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 active:opacity-60 transition-opacity py-1 px-2 rounded-lg"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Link>
        <span className="text-[11px] font-medium text-slate-400">SFV APPAREL</span>
      </div>

      {/* Center Container */}
      <div className="w-full max-w-sm mx-auto my-auto py-6 shrink-0">
        
        {/* Brand Header (Apple Monochromatic Minimalist) */}
        <div className="text-center mb-7 space-y-1.5">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {step === 'form' ? 'Akaun Pelanggan' : 'Pengesahan WhatsApp'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            {step === 'form'
              ? 'Sila masukkan nombor WhatsApp dan nama anda untuk log masuk atau pendaftaran.'
              : `Kod pengesahan 6 digit telah dihantar ke nombor ${formatPhoneDisplay(normalizedPhone)}`}
          </p>
        </div>

        {/* Error / Success Notifications (Subtle Monochrome Alert) */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-white border border-rose-200/80 shadow-xs flex items-start gap-2.5 text-xs text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div className="mb-4 p-3 rounded-xl bg-white border border-slate-200 shadow-xs flex items-start gap-2.5 text-xs text-slate-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-slate-900" />
            <span className="leading-snug">{successMsg}</span>
          </div>
        )}

        {/* STEP 1: FORM INPUT */}
        {step === 'form' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            
            {/* Inset Group Inputs (iOS Style) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
              
              {/* WhatsApp Number */}
              <div className="px-4 py-3">
                <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                  Nombor WhatsApp
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="012 345 6789"
                  required
                  autoFocus
                  className="w-full text-sm text-slate-900 placeholder-slate-300 bg-transparent focus:outline-none font-mono"
                />
              </div>

              {/* Full Name */}
              <div className="px-4 py-3">
                <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                  Nama Penuh
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama anda"
                  required
                  className="w-full text-sm text-slate-900 placeholder-slate-300 bg-transparent focus:outline-none"
                />
              </div>

              {/* Optional Email */}
              <div className="px-4 py-3">
                <label className="block text-[11px] font-medium text-slate-400 mb-0.5">
                  Emel (Pilihan)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@contoh.com"
                  className="w-full text-sm text-slate-900 placeholder-slate-300 bg-transparent focus:outline-none font-mono"
                />
              </div>

            </div>

            {/* Apple Light Action Button (No dark button) */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !phone.trim() || !name.trim()}
                className="w-full py-3.5 px-4 rounded-xl bg-white border border-slate-300/80 text-slate-900 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-xs tracking-tight shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                    <span>Menghantar Kod...</span>
                  </>
                ) : (
                  <span>Teruskan Pengesahan</span>
                )}
              </button>
            </div>

          </form>
        )}

        {/* STEP 2: OTP INPUT */}
        {step === 'otp' && (
          <div className="space-y-5">
            
            {/* 6-Digit OTP Box Grid (Apple Monochromatic Style) */}
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
                  className={`w-12 h-14 text-center text-lg font-mono font-medium rounded-xl bg-white border transition-all focus:outline-none shadow-xs ${
                    digit 
                      ? 'border-slate-400 text-slate-900' 
                      : 'border-slate-200/80 text-slate-900 focus:border-slate-400'
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
                className="text-xs font-medium text-slate-600 hover:text-slate-900 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {countdown > 0
                  ? `Hantar semula kod dalam ${countdown}s`
                  : 'Hantar Semula Kod Pengesahan'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('form');
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

      </div>

      {/* Footer System Info */}
      <div className="w-full max-w-md mx-auto pt-4 pb-1 text-center shrink-0">
        <p className="text-[10px] text-slate-400 font-medium">
          SFV Apparel • Sistem Pengesahan Selamat
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
