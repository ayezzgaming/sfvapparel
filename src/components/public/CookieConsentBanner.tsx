'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, X } from 'lucide-react';

const COOKIE_STORAGE_KEY = 'sfv_cookie_consent';

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show if user has not yet made a decision
    try {
      const consent = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!consent) {
        // Small delay for smooth entry animation after page load
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // Storage unavailable (private mode)
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, 'accepted');
    } catch {
      // Ignore
    }
    setIsVisible(false);
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, 'dismissed');
    } catch {
      // Ignore
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 inset-x-0 z-50 px-4 max-w-md mx-auto pointer-events-none animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="pointer-events-auto bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl p-4 sm:p-5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] space-y-3.5 select-none font-ios">
        
        {/* Header with Icon & Close */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-sky-50 text-[#00BDFF] border border-sky-100 flex items-center justify-center shrink-0 shadow-2xs">
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                Privasi &amp; Kuki Pelawat
              </h4>
              <p className="text-[10px] text-slate-400 font-medium">
                Piawaian Keselamatan SFV APPAREL
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup notis kuki"
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center active:scale-90 transition-all cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Text Message */}
        <p className="text-[11.5px] text-slate-600 leading-relaxed font-normal">
          Kami menggunakan kuki dan storan peranti untuk mengingati pilihan pakaian, menyegerakkan troli tempahan, dan memastikan pengalaman penjejakan pesanan anda berjalan lancar dan selamat.
        </p>

        {/* Action Buttons (Strict Capsule Pills) */}
        <div className="flex items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="flex-1 py-2.5 px-4 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white font-bold text-xs tracking-normal shadow-md shadow-sky-400/20 active:scale-[0.98] transition-all text-center cursor-pointer"
          >
            Terima Semua Kuki
          </button>

          <Link
            href="/privacypolicy"
            onClick={() => setIsVisible(false)}
            className="py-2.5 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs active:scale-[0.98] transition-all text-center whitespace-nowrap"
          >
            Dasar Privasi
          </Link>
        </div>

      </div>
    </div>
  );
}
