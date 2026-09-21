'use client';

import React from 'react';
import Image from 'next/image';

interface CourierLogoProps {
  type: 'jnt' | 'poslaju' | 'ninjavan' | 'flash' | 'lalamove' | 'dhl' | 'citylink' | 'pickup' | string;
  className?: string;
}

const COURIER_ASSETS: Record<string, { src: string; alt: string; bg?: string; pad?: string }> = {
  jnt: {
    src: '/images/couriers/jnt.svg',
    alt: 'J&T Express',
    bg: 'bg-white',
    pad: 'p-1.5'
  },
  poslaju: {
    src: '/images/couriers/poslaju.svg',
    alt: 'Pos Laju / Pos Malaysia',
    bg: 'bg-white',
    pad: 'p-1.5'
  },
  ninjavan: {
    src: '/images/couriers/ninjavan.svg',
    alt: 'Ninja Van',
    bg: 'bg-white',
    pad: 'p-1.5'
  },
  flash: {
    src: '/images/couriers/flash.svg',
    alt: 'Flash Express',
    bg: 'bg-white',
    pad: 'p-1.5'
  },
  lalamove: {
    src: '/images/couriers/lalamove.svg',
    alt: 'Lalamove',
    bg: 'bg-white',
    pad: 'p-1.5'
  },
  dhl: {
    src: '/images/couriers/dhl.svg',
    alt: 'DHL Express',
    bg: 'bg-white',
    pad: 'p-1'
  }
};

export default function CourierLogo({ type, className = 'w-11 h-11' }: CourierLogoProps) {
  const normalizedType = type?.toLowerCase() || '';
  const asset = COURIER_ASSETS[normalizedType];

  if (asset) {
    return (
      <div
        className={`${className} ${asset.bg || 'bg-white'} ${asset.pad || 'p-1.5'} rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex items-center justify-center select-none shrink-0 overflow-hidden relative`}
      >
        <img
          src={asset.src}
          alt={asset.alt}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  // Pickup or Fallback
  return (
    <div
      className={`${className} rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col items-center justify-center select-none shrink-0 p-1 gap-0.5`}
    >
      <svg className="w-5 h-5 text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M3 7v14M21 7v14M6 11h3M15 11h3M6 15h3M15 15h3M9 3h6l3 4H6l3-4z" />
      </svg>
      <span className="text-[7px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider leading-none">Ambil</span>
    </div>
  );
}

