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

export default function CourierLogo({ type, className = 'h-5 w-auto max-w-[80px]' }: CourierLogoProps) {
  const normalizedType = type?.toLowerCase() || '';
  const asset = COURIER_ASSETS[normalizedType];

  if (asset) {
    return (
      <img
        src={asset.src}
        alt={asset.alt}
        className={`${className} object-contain select-none shrink-0`}
        loading="lazy"
      />
    );
  }

  // Pickup or Fallback
  return (
    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs select-none shrink-0 uppercase tracking-wider">
      Ambil Sendiri
    </span>
  );
}



