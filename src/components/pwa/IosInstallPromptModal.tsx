'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Share, PlusSquare, CheckSquare, X } from 'lucide-react';

const STORAGE_KEY = 'sfv_ios_pwa_prompt_v5';

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

      // 6. AUTO-CLOSE TIMER: Auto-close smoothly after 6.5s if user doesn't close manually
      autoCloseTimerRef.current = setTimeout(() => {
        handleDismiss();
      }, 6500);
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
      className={`fixed bottom-[5.2rem] right-3 sm:right-6 w-[280px] z-50 pointer-events-auto select-none font-ios transition-all duration-300 ${
        isClosing 
          ? 'animate-out fade-out slide-out-to-bottom-4 duration-300 opacity-0 translate-y-4' 
          : 'animate-in fade-in slide-in-from-bottom-4 duration-300 opacity-100 translate-y-0'
      }`}
    >
      {/* Apple Light Frosted Glass Square Card (No Logo, Monochrome Grey Icons Only) */}
      <div className="relative bg-white/95 backdrop-blur-2xl text-slate-900 rounded-3xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.15)] border border-slate-200/90 flex flex-col items-center text-center space-y-3">
        {/* Minimalist Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup"
          className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-90 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Header Title */}
        <div className="pt-0.5">
          <h3 className="text-xs font-bold text-slate-900 tracking-tight">
            Pasang Aplikasi SFV
          </h3>
          <p className="text-[10.5px] text-slate-500 mt-0.5 font-medium">
            3 langkah pantas ke Skrin Utama
          </p>
        </div>

        {/* 3 Step Grey Icons Row (Apple Monochrome Style) */}
        <div className="grid grid-cols-3 gap-2 w-full pt-0.5">
          {/* Step 1 */}
          <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="w-8 h-8 rounded-xl bg-slate-200/70 text-slate-600 flex items-center justify-center">
              <Share className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-[9.5px] font-bold text-slate-800 leading-none">1. Ketuk</span>
            <span className="text-[8.5px] text-slate-400 font-medium leading-tight">Kongsi/•••</span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="w-8 h-8 rounded-xl bg-slate-200/70 text-slate-600 flex items-center justify-center">
              <PlusSquare className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-[9.5px] font-bold text-slate-800 leading-none">2. Pilih</span>
            <span className="text-[8.5px] text-slate-400 font-medium leading-tight">Ke Utama</span>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center p-2 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
            <div className="w-8 h-8 rounded-xl bg-slate-200/70 text-slate-600 flex items-center justify-center">
              <CheckSquare className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="text-[9.5px] font-bold text-slate-800 leading-none">3. Ketuk</span>
            <span className="text-[8.5px] text-slate-400 font-medium leading-tight">Tambah</span>
          </div>
        </div>

        {/* Animated Bouncing Pointer Arrow (Positioned at BOTTOM RIGHT pointing to bottom right menu '...') */}
        <div className="absolute -bottom-2.5 right-6 flex flex-col items-center animate-bounce">
          <div className="w-3.5 h-3.5 bg-white border-r border-b border-slate-200/90 rotate-45 shadow-2xs" />
        </div>
      </div>
    </aside>
  );
}
