'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Share, PlusSquare, ArrowDown, X } from 'lucide-react';

const STORAGE_KEY = 'sfv_ios_pwa_prompt_v7';

export default function IosInstallPromptModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleDismiss = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      try {
        localStorage.setItem(STORAGE_KEY, 'dismissed');
      } catch {}
    }, 300);
  };

  useEffect(() => {
    setMounted(true);

    if (typeof window === 'undefined') return;

    const ua = (window.navigator.userAgent || window.navigator.vendor || '').toLowerCase();

    // 1. STRICT EXCLUSION: If Android, Windows, Linux, or non-iOS, NEVER show this iOS banner!
    if (/android|windows|linux|cros|crkey|tizen|webos/.test(ua)) {
      return;
    }

    // 2. STRICT iOS IDENTIFICATION: Only genuine iPhone, iPad, or iPod
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isIpadOs = 
      window.navigator.platform === 'MacIntel' && 
      window.navigator.maxTouchPoints > 1 && 
      !ua.includes('android');

    if (!isIos && !isIpadOs) {
      return;
    }

    // 3. Standalone mode check (Already installed as PWA)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      try {
        localStorage.setItem(STORAGE_KEY, 'installed');
      } catch {}
      return;
    }

    // 4. Persistence check: Has the user already seen or dismissed this?
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen) return;
    } catch {
      return;
    }

    // 5. Delay before showing modal
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      try {
        localStorage.setItem(STORAGE_KEY, 'seen');
      } catch {}

      // 6. AUTO-CLOSE TIMER: Auto-close smoothly after 8s if user doesn't close manually
      autoCloseTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 8000);
    }, 2000);

    return () => {
      clearTimeout(showTimer);
      if (autoCloseTimerRef.current) clearTimeout(autoCloseTimerRef.current);
    };
  }, []);

  if (!mounted || !isVisible) return null;

  return (
    <aside 
      aria-label="Panduan Pasang PWA iOS"
      className={`fixed bottom-[calc(env(safe-area-inset-bottom,0px)+3.75rem)] right-3 sm:right-6 w-[275px] sm:w-[290px] z-50 pointer-events-auto select-none font-ios transition-all duration-300 ${
        isClosing 
          ? 'animate-out fade-out slide-out-to-bottom-4 duration-300 opacity-0 translate-y-4' 
          : 'animate-in fade-in slide-in-from-bottom-4 duration-300 opacity-100 translate-y-0'
      }`}
    >
      {/* Apple Frosted Glass Card (Ultra Concise & Minimalist) */}
      <div className="relative bg-white/95 backdrop-blur-2xl text-slate-900 rounded-2xl p-3.5 shadow-[0_12px_36px_rgba(0,0,0,0.14)] border border-slate-200/90 flex flex-col space-y-2.5">
        {/* Minimalist Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup"
          className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all cursor-pointer z-10"
        >
          <X className="w-3 h-3" />
        </button>

        {/* Header Title */}
        <div className="pr-6">
          <h3 className="text-xs font-semibold text-slate-900 tracking-tight">
            Pasang Aplikasi SFV
          </h3>
        </div>

        {/* Clean 2-Step Rows (Zero Pollution) */}
        <div className="flex flex-col gap-1.5 w-full">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5 p-2 px-2.5 rounded-xl bg-slate-50/90 border border-slate-100/90 text-left">
            <div className="w-6 h-6 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center shrink-0">
              <Share className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-medium text-slate-800 leading-snug">
              1. Ketuk ikon <strong className="font-semibold text-slate-900">Kongsi</strong>
            </span>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-2.5 p-2 px-2.5 rounded-xl bg-slate-50/90 border border-slate-100/90 text-left">
            <div className="w-6 h-6 rounded-lg bg-slate-200/70 text-slate-700 flex items-center justify-center shrink-0">
              <PlusSquare className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <span className="text-[11px] font-medium text-slate-800 leading-snug">
              2. Pilih <strong className="font-semibold text-slate-900">Tambah ke Skrin Utama</strong>
            </span>
          </div>
        </div>

        {/* Clean Animated Pointer Arrow Icon (Lucide Icon instead of raw shape) */}
        <div className="absolute -bottom-8 right-6 flex items-center justify-center animate-bounce z-20 pointer-events-none">
          <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center shadow-md">
            <ArrowDown className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>
    </aside>
  );
}
