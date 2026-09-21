'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import {
  Phone, User, Mail, ArrowRight, ShieldCheck, RefreshCw,
  ChevronLeft, MessageSquare, Loader2, CheckCircle2, AlertCircle
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

  // Format phone display
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
        setError(data.message || 'Gagal menghantar OTP.');
        return;
      }

      setNormalizedPhone(data.phone);
      setSuccessMsg(data.message);
      setStep('otp');
      setCountdown(60);
      if (data.devOtp && typeof data.devOtp === 'string') {
        const devOtpChars = data.devOtp.split('').slice(0, 6);
        setOtp(devOtpChars);
        // Auto verify after a brief pause
        setTimeout(() => handleVerifyOtp(data.devOtp), 600);
      } else {
        // Focus first OTP input
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

    // Auto-submit when all filled
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
        setError(data.message || 'OTP tidak sah.');
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 50);
        return;
      }

      // Success!
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
        setSuccessMsg('OTP baru telah dihantar!');
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(data.message || 'Gagal menghantar semula OTP.');
      }
    } catch {
      setError('Ralat sambungan.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl shadow-lg shadow-sky-500/30 mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">SFV Apparel</h1>
          <p className="text-slate-400 text-sm mt-1">Portal Tempahan Kustom</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {step === 'form' ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">Log Masuk / Daftar</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Masukkan nombor WhatsApp anda. Kami akan hantar kod pengesahan.
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                    Nama Penuh <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Nama anda"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400/60 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>

                {/* WhatsApp */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1">
                    Nombor WhatsApp <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 font-mono">🇲🇾</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="01X-XXXX XXXX"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm font-mono focus:outline-none focus:border-sky-400/60 focus:bg-white/8 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 ml-1">Contoh: 0123456789</p>
                </div>

                {/* Email (optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 ml-1 flex items-center gap-1">
                    Email <span className="text-slate-500 font-normal">(pilihan)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-sky-400/60 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !name || !phone}
                  className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Menghantar OTP...</>
                  ) : (
                    <><MessageSquare className="w-4 h-4" /> Hantar Kod ke WhatsApp <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              {/* WhatsApp info */}
              <div className="mt-4 flex items-start gap-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                <div className="text-emerald-400 text-base mt-0.5">💬</div>
                <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                  Kod OTP akan dihantar ke WhatsApp anda dalam masa beberapa saat. Pastikan WhatsApp anda aktif dan nombor adalah betul.
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Back button */}
              <button
                onClick={() => { setStep('form'); setError(''); setOtp(['', '', '', '', '', '']); }}
                className="flex items-center gap-1 text-slate-400 hover:text-white text-xs mb-5 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Kembali
              </button>

              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl mb-3">
                  <MessageSquare className="w-6 h-6 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Semak WhatsApp Anda</h2>
                <p className="text-slate-400 text-sm mt-1">
                  Kami hantar kod 6-digit ke
                </p>
                <p className="text-sky-400 font-mono text-sm font-semibold">
                  {formatPhoneDisplay(normalizedPhone)}
                </p>
              </div>

              {/* OTP Input */}
              <div className="flex gap-2 justify-center mb-4" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    disabled={isLoading}
                    className={`w-11 h-14 text-center text-xl font-bold rounded-xl border transition-all focus:outline-none ${
                      digit
                        ? 'bg-sky-500/20 border-sky-400/60 text-white'
                        : 'bg-white/5 border-white/10 text-white'
                    } focus:border-sky-400/80 focus:bg-sky-500/15 disabled:opacity-50`}
                  />
                ))}
              </div>

              {isLoading && (
                <div className="flex items-center justify-center gap-2 text-sky-400 text-sm mb-3">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Mengesahkan...</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2.5 mb-3">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {error}
                </div>
              )}

              {successMsg && !error && (
                <div className="flex items-center gap-2 text-emerald-400 text-xs bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5 mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  {successMsg}
                </div>
              )}

              {/* Manual verify button */}
              <button
                onClick={() => handleVerifyOtp(otp.join(''))}
                disabled={otp.some((d) => !d) || isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Mengesahkan...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Sahkan & Masuk</>
                )}
              </button>

              {/* Resend */}
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-slate-500 text-xs">
                    Hantar semula dalam <span className="text-slate-300 font-mono">{countdown}s</span>
                  </p>
                ) : (
                  <button
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1 mx-auto transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" /> Hantar Semula OTP
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-600 text-[11px] mt-6">
          Dengan mendaftar, anda bersetuju dengan dasar privasi SFV Apparel.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
