'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Share, PlusSquare, CheckSquare, X } from 'lucide-react';

const STORAGE_KEY = 'sfv_ios_pwa_prompt_v6';

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

      // 6. AUTO-CLOSE TIMER: Auto-close smoothly after 7.5s if user doesn't close manually
      autoCloseTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 7500);
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
      className={`fixed bottom-[5.5rem] right-3 sm:right-6 w-[310px] sm:w-[330px] z-50 pointer-events-auto select-none font-ios transition-all duration-300 ${
        isClosing 
          ? 'animate-out fade-out slide-out-to-bottom-4 duration-300 opacity-0 translate-y-4' 
          : 'animate-in fade-in slide-in-from-bottom-4 duration-300 opacity-100 translate-y-0'
      }`}
    >
      {/* Apple Light Frosted Glass Card (Clean, Spacious & Elegant) */}
      <div className="relative bg-white/95 backdrop-blur-2xl text-slate-900 rounded-3xl p-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)] border border-slate-200/90 flex flex-col space-y-3">
        {/* Minimalist Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup"
          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header Title */}
        <div className="pr-6">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            Pasang Aplikasi SFV Apparel
          </h3>
          <p className="text-[10.5px] text-slate-500 mt-0.5 font-medium">
            3 langkah pantas untuk akses terus dari Skrin Utama
          </p>
        </div>

        {/* 3 Step Vertical Rows (Spacious & No Text Squeezing) */}
        <div className="flex flex-col gap-2 w-full pt-1">
          {/* Step 1 */}
          <div className="flex items-center gap-2.5 p-2 px-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-left">
            <div className="w-7 h-7 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
              <Share className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                1. Ketuk ikon Kongsi / •••
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium block leading-snug mt-0.5">
                Di bar bawah kanan pelayar Safari/Chrome
              </span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-center gap-2.5 p-2 px-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-left">
            <div className="w-7 h-7 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
              <PlusSquare className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <span className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                2. Pilih &apos;Tambah ke Skrin Utama&apos;
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium block leading-snug mt-0.5">
                Skrol menu ke bawah lalu ketuk pilihan ini
              </span>
            </span>
          </div>

          {/* Step 3 */}
          <div className="flex items-center gap-2.5 p-2 px-2.5 rounded-2xl bg-slate-50/80 border border-slate-100 text-left">
            <div className="w-7 h-7 rounded-xl bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
              <CheckSquare className="w-3.5 h-3.5 stroke-[2]" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-slate-900 block leading-tight">
                3. Ketuk &apos;Tambah&apos;
              </span>
              <span className="text-[9.5px] text-slate-500 font-medium block leading-snug mt-0.5">
                Di sudut kanan atas skrin iPhone anda
              </span>
            </div>
          </div>
        </div>

        {/* Animated Bouncing Pointer Arrow Stem (Extended down past tab bar straight to Safari menu button) */}
        <div className="absolute -bottom-11 right-6 flex flex-col items-center animate-bounce z-20 pointer-events-none">
          <div className="w-1 h-7 bg-slate-800 rounded-full shadow-xs" />
          <div className="w-3.5 h-3.5 bg-slate-800 rotate-45 -mt-2.5 rounded-xs shadow-md" />
        </div>
      </div>
    </aside>
  );
}
