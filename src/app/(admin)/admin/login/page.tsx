'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  KeyRound,
  ArrowLeft,
  Sparkles,
  Info
} from 'lucide-react';

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAdminAuth();

  const redirectTo = searchParams.get('redirect') || '/admin';
  const destination = redirectTo.startsWith('/admin') ? redirectTo : '/admin';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace(destination);
    }
  }, [authLoading, isAuthenticated, router, destination]);

  const handleQuickFillDefault = () => {
    setEmail('admin@sfvapparel.com');
    setPassword('Admin@123456');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError('');

    if (!email.trim() || !password) {
      setError('Sila masukkan emel dan kata laluan pentadbir.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(email.trim(), password, rememberMe);
      if (res.success) {
        window.location.href = destination;
      } else {
        setError(res.message || 'Log masuk gagal. Sila periksa maklumat anda.');
        setIsLoading(false);
      }
    } catch {
      setError('Ralat sambungan pelayan. Sila cuba sebentar lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 flex flex-col justify-between px-4 py-8 relative overflow-hidden font-sans select-none antialiased">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors py-2 px-3 rounded-xl hover:bg-white/5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Laman Awam</span>
        </Link>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sky-400 text-[11px] font-semibold backdrop-blur-md">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00BDFF]" />
          <span>Portal Pentadbir</span>
        </div>
      </div>

      {/* Card Form */}
      <div className="w-full max-w-md mx-auto my-auto py-4 z-10">
        <div className="bg-white/[0.04] border border-white/10 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/50 space-y-6">
          
          {/* Logo & Heading */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0052FF] to-[#00BDFF] text-white shadow-lg shadow-blue-500/30 mb-2 ring-4 ring-white/10">
              <KeyRound className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Log Masuk Pentadbir
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Sistem Pengurusan Kilang & Tempahan Sublimasi / DTF SFV APPAREL
            </p>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 backdrop-blur-sm animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Emel Pentadbir
              </label>
              <div className="flex items-center rounded-2xl bg-white/5 border border-white/10 px-3.5 py-3 focus-within:border-[#00BDFF] focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:bg-white/10 transition-all">
                <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sfvapparel.com"
                  required
                  autoFocus
                  className="w-full text-sm font-medium text-white placeholder-slate-500 bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Kata Laluan
                </label>
              </div>
              <div className="flex items-center rounded-2xl bg-white/5 border border-white/10 px-3.5 py-3 focus-within:border-[#00BDFF] focus-within:ring-2 focus-within:ring-sky-500/20 focus-within:bg-white/10 transition-all">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full text-sm font-medium text-white placeholder-slate-500 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-white transition-colors ml-2 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-white/10 text-[#0052FF] focus:ring-sky-400 focus:ring-offset-0 focus:ring-1"
                />
                <span className="text-xs text-slate-300">Ingat sesi pada peranti ini</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading || !email.trim() || !password}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-sm tracking-wide shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Mengesahkan Maklumat...</span>
                  </>
                ) : (
                  <>
                    <span>Log Masuk Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Quick Default Setup Pill */}
          <div className="pt-3 border-t border-white/10">
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-slate-300 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#00BDFF] shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="text-slate-400">Akaun Utama: </span>
                  <span className="font-mono text-sky-300 font-semibold">admin@sfvapparel.com</span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickFillDefault}
                className="text-[11px] font-bold text-[#00BDFF] hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Isi Pantas</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto text-center z-10">
        <p className="text-[11px] text-slate-500">
          SFV APPAREL • Kawalan Keselamatan Pentadbir Berperingkat
        </p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
