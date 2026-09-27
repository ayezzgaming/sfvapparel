'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Info,
  CheckCircle2
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
      setError('Ralat sambungan pelayan. Sila cuba lagi.');
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[100dvh] min-h-[100dvh] w-full bg-[#F2F2F7] flex flex-col justify-between px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.25rem)] overflow-y-auto font-sans antialiased selection:bg-slate-200">
      
      {/* Top Bar / Back button */}
      <div className="w-full max-w-md mx-auto flex items-center justify-between shrink-0">
        <Link
          href="/"
          aria-label="Kembali ke laman awam"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 active:bg-slate-200/80 active:scale-95 transition-all py-2 px-2.5 -ml-2 rounded-xl cursor-pointer select-none"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          <span>Laman Awam</span>
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-[#0052FF] text-[11px] font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0052FF]" />
            <span>Portal Rasmi Pentadbir</span>
          </div>

          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Log Masuk Pentadbir
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Sistem pengurusan tempahan kilang, katalog, dan pentadbiran SFV APPAREL.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-white border border-rose-200/80 shadow-xs flex items-start gap-2.5 text-xs text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3.5">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Emel Pentadbir
              </label>
              <div className="flex items-center rounded-xl bg-slate-50/80 border border-slate-200/80 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                <Mail className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sfvapparel.com"
                  required
                  autoFocus
                  className="w-full text-xs font-semibold text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Kata Laluan
              </label>
              <div className="flex items-center rounded-xl bg-slate-50/80 border border-slate-200/80 px-3 py-2.5 focus-within:bg-white focus-within:border-[#00BDFF] focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                <Lock className="w-4 h-4 text-slate-400 shrink-0 mr-2.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full text-xs font-semibold text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-700 transition-colors ml-2 focus:outline-none cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan kata laluan' : 'Tunjukkan kata laluan'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#0052FF] focus:ring-sky-400"
                />
                <span className="text-[11.5px] font-medium text-slate-600">Ingat sesi pada peranti ini</span>
              </label>
            </div>

          </div>

          {/* Action Button - SFV Brand Gradient */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !email.trim() || !password}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
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

          {/* Quick Default Setup Hint */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-2xs flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Info className="w-4 h-4 text-[#0052FF] shrink-0" />
              <div className="text-[11px] text-slate-600 truncate">
                <span>Akaun: </span>
                <span className="font-mono font-semibold text-slate-900">admin@sfvapparel.com</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleQuickFillDefault}
              className="text-[11px] font-bold text-[#0052FF] hover:underline shrink-0 cursor-pointer"
            >
              Isi Pantas
            </button>
          </div>

        </form>

      </div>

      {/* Footer System Info */}
      <div className="w-full max-w-md mx-auto pt-4 pb-1 text-center shrink-0">
        <p className="text-[10.5px] text-slate-400 font-medium">
          SFV APPAREL • Sistem Pentadbir Selamat
        </p>
      </div>

    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] min-h-[100dvh] w-full bg-[#F2F2F7] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
