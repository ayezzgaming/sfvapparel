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

export default function CourierLogo({ type, className = 'w-[72px] h-6' }: CourierLogoProps) {
  const normalizedType = type?.toLowerCase() || '';
  const asset = COURIER_ASSETS[normalizedType];

  if (asset) {
    return (
      <div className={`${className} shrink-0 flex items-center justify-start select-none`}>
        <img
          src={asset.src}
          alt={asset.alt}
          className="max-h-full max-w-full object-contain object-left"
          loading="lazy"
        />
      </div>
    );
  }

  // Pickup or Fallback
  return (
    <div className={`${className} shrink-0 flex items-center justify-start select-none`}>
      <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-xs select-none uppercase tracking-wider leading-none">
        Ambil Sendiri
      </span>
    </div>
  );
}




