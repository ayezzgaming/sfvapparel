'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Share, 
  PlusSquare, 
  Sparkles, 
  CheckCircle2, 
  Smartphone,
  ChevronRight
} from 'lucide-react';

const STORAGE_KEY = 'sfv_ios_install_prompt_dismissed_v1';

export default function IosInstallPromptModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // 1. Check if running in browser
    if (typeof window === 'undefined') return;

    // 2. Check if already installed as standalone PWA
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) return;

    // 3. Check if user previously dismissed
    try {
      const isDismissed = localStorage.getItem(STORAGE_KEY);
      if (isDismissed) return;
    } catch {
      // Ignore localStorage error
    }

    // 4. Detect iOS device or Safari environment
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios|android/.test(userAgent);

    // If on iOS or mobile browser, schedule polite presentation
    if (isIos || isSafari) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = (permanent: boolean = false) => {
    setIsOpen(false);
    if (permanent) {
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {
        // Ignore
      }
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      {/* Backdrop click to dismiss */}
      <div 
        className="absolute inset-0" 
        onClick={() => handleDismiss(false)} 
        aria-hidden="true"
      />

      {/* Sheet / Modal Container */}
      <div 
        className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-slate-200/80 dark:border-zinc-800 p-6 space-y-5 animate-in slide-in-from-bottom-6 duration-400 select-none font-ios"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pwa-install-title"
      >
        {/* Top Handle on Mobile */}
        <div className="flex justify-center -mt-2 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-slate-300 dark:bg-zinc-700 rounded-full" />
        </div>

        {/* Header: App Icon & Name */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3.5">
            <div className="w-14 h-14 rounded-2xl bg-white p-1.5 shadow-md border border-slate-200/80 dark:border-zinc-700 shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/logo/svf-icon.svg" 
                alt="SFV Apparel" 
                className="w-full h-full object-contain rounded-xl"
                onError={(e) => {
                  e.currentTarget.src = '/logo/svf-icon-01.svg';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="pwa-install-title" className="text-base font-bold text-slate-900 dark:text-zinc-100 leading-tight">
                  SFV Apparel
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00BDFF]/10 text-[#00BDFF] border border-[#00BDFF]/20">
                  PWA Web App
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Pasang ke Skrin Utama untuk akses pantas skrin penuh
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleDismiss(false)}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
            aria-label="Tutup panduan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step-by-step Apple Guidance Box */}
        <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-2xl p-4 border border-slate-200/70 dark:border-zinc-700 space-y-3.5">
          {/* Step 1 */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 text-[#00BDFF] shadow-xs border border-slate-200/80 dark:border-zinc-600 flex items-center justify-center shrink-0">
              <Share className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                1. Ketuk butang Kongsi (Share)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-normal">
                Terletak di bahagian bar menu bawah pelayar Safari iPhone anda.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 text-indigo-600 shadow-xs border border-slate-200/80 dark:border-zinc-600 flex items-center justify-center shrink-0">
              <PlusSquare className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                2. Pilih &ldquo;Tambah ke Skrin Utama&rdquo;
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-normal">
                Tatal ke bawah menu pilihan dan ketuk <span className="font-semibold text-slate-700 dark:text-zinc-300">&ldquo;Add to Home Screen&rdquo;</span>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-zinc-700 text-emerald-600 shadow-xs border border-slate-200/80 dark:border-zinc-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-xs font-bold text-slate-900 dark:text-zinc-100 leading-snug">
                3. Ketuk &ldquo;Tambah&rdquo; (Add)
              </p>
              <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-normal">
                Ikon aplikasi akan muncul di skrin utama iPhone anda seperti aplikasi native.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => handleDismiss(true)}
            className="w-full py-3 px-4 rounded-full bg-[#00BDFF] hover:bg-sky-500 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-sky-400/20 transition-all cursor-pointer flex items-center justify-center space-x-1.5"
          >
            <span>Faham & Pasang Nanti</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => handleDismiss(true)}
              className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 font-medium transition-colors cursor-pointer"
            >
              Jangan tunjukkan lagi pada peranti ini
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
