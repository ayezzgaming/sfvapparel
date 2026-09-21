'use client';

import React from 'react';

interface CourierLogoProps {
  type: 'jnt' | 'poslaju' | 'ninjavan' | 'flash' | 'lalamove' | 'dhl' | 'citylink' | 'pickup' | string;
  className?: string;
}

const COURIER_ASSETS: Record<string, { src: string; alt: string }> = {
  jnt: {
    src: '/images/couriers/jnt.svg',
    alt: 'J&T Express'
  },
  poslaju: {
    src: '/images/couriers/poslaju.svg',
    alt: 'Pos Laju'
  },
  ninjavan: {
    src: '/images/couriers/ninjavan.svg',
    alt: 'Ninja Van'
  },
  flash: {
    src: '/images/couriers/flash.svg',
    alt: 'Flash Express'
  },
  lalamove: {
    src: '/images/couriers/lalamove.svg',
    alt: 'Lalamove'
  },
  dhl: {
    src: '/images/couriers/dhl.svg',
    alt: 'DHL Express'
  }
};

export default function CourierLogo({ type, className = 'h-7 w-20' }: CourierLogoProps) {
  const normalizedType = type?.toLowerCase() || '';
  const asset = COURIER_ASSETS[normalizedType];

  if (asset) {
    return (
      <div
        className={`${className} bg-white rounded-lg border border-slate-200/90 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center select-none shrink-0 px-2 py-1 overflow-hidden`}
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
      className={`${className} rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center select-none shrink-0 px-2 py-1 gap-1`}
    >
      <svg className="w-3.5 h-3.5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21h18M3 7v14M21 7v14M6 11h3M15 11h3M6 15h3M15 15h3M9 3h6l3 4H6l3-4z" />
      </svg>
      <span className="text-[9px] font-bold text-slate-700 uppercase tracking-wide leading-none">Ambil</span>
    </div>
  );
}


