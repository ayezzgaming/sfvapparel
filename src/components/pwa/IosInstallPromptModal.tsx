'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'sfv_ios_pwa_prompt_v3';

export default function IosInstallPromptModal() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

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

    // 5. Polite delay for genuine iOS Safari visitors
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Auto-save so it only appears once ever per device
      try {
        localStorage.setItem(STORAGE_KEY, 'seen');
      } catch {}
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      localStorage.setItem(STORAGE_KEY, 'dismissed');
    } catch {}
  };

  if (!mounted || !isVisible) return null;

  return (
    <aside 
      aria-label="Panduan Pasang ke Skrin Utama"
      className="fixed bottom-[4.8rem] inset-x-3 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-bottom-3 duration-300 pointer-events-auto select-none font-ios"
    >
      {/* Apple Frosted Glass Floating Capsule */}
      <div className="relative bg-[#1C1C1E]/95 backdrop-blur-2xl text-white rounded-2xl p-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] border border-white/10 flex items-center gap-3">
        {/* App Icon */}
        <div className="w-10 h-10 rounded-xl bg-black/40 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-xs">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src="/logo/svf-icon.svg" 
            alt="SFV Apparel" 
            className="w-full h-full object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.src = '/logo/svf-icon-01.svg';
            }}
          />
        </div>

        {/* Concise Apple Instruction */}
        <div className="flex-1 min-w-0 pr-1">
          <p className="text-[12px] font-semibold text-white tracking-tight leading-tight">
            Pasang SFV Apparel
          </p>
          <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
            Ketuk{' '}
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="w-3.5 h-3.5 inline-block -mt-0.5 text-[#00BDFF]"
              aria-label="Ikon Kongsi iOS"
            >
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            {' '}lalu pilih <span className="font-semibold text-white">&ldquo;Add to Home Screen&rdquo;</span>
          </p>
        </div>

        {/* Minimalist Close Button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Tutup"
          className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 text-zinc-400 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Downward Pointer indicator towards Safari Share Button */}
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1C1C1E] border-r border-b border-white/10 rotate-45" />
      </div>
    </aside>
  );
}
