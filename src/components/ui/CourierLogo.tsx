'use client';

import React from 'react';

interface CourierLogoProps {
  type: 'jnt' | 'poslaju' | 'ninjavan' | 'flash' | 'lalamove' | 'dhl' | 'citylink' | 'pickup' | string;
  className?: string;
}

export default function CourierLogo({ type, className = 'w-10 h-10' }: CourierLogoProps) {
  switch (type) {
    case 'jnt':
      return (
        <div className={`${className} rounded-xl bg-[#E30613] flex items-center justify-center select-none shrink-0 overflow-hidden`}>
          <svg viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[72%] h-auto">
            <text x="4" y="24" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="26" fill="white" letterSpacing="-1">J&amp;T</text>
          </svg>
        </div>
      );

    case 'poslaju':
      return (
        <div className={`${className} rounded-xl bg-white border border-slate-200 flex items-center justify-center select-none shrink-0 overflow-hidden p-1`}>
          <svg viewBox="0 0 120 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            {/* Red bar top */}
            <rect x="0" y="0" width="120" height="14" rx="2" fill="#ED1C24"/>
            {/* Blue bottom */}
            <rect x="0" y="14" width="120" height="34" rx="2" fill="#003087"/>
            {/* POS text */}
            <text x="6" y="42" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="22" fill="#FFD100" letterSpacing="0.5">POS</text>
            {/* LAJU text */}
            <text x="56" y="42" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="22" fill="white" letterSpacing="0.5">LAJU</text>
          </svg>
        </div>
      );

    case 'ninjavan':
      return (
        <div className={`${className} rounded-xl bg-[#C41230] flex items-center justify-center select-none shrink-0 overflow-hidden p-1`}>
          <svg viewBox="0 0 100 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            {/* Ninja van mask shape */}
            <polygon points="10,8 18,2 22,8 18,14" fill="white" opacity="0.9"/>
            <polygon points="18,2 26,8 22,14 18,8" fill="white" opacity="0.7"/>
            <text x="32" y="30" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="16" fill="white" letterSpacing="-0.5">NINJA</text>
            <text x="32" y="43" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="11" fill="white" opacity="0.85" letterSpacing="1">VAN</text>
          </svg>
        </div>
      );

    case 'flash':
      return (
        <div className={`${className} rounded-xl bg-[#F6D000] flex items-center justify-center select-none shrink-0 overflow-hidden p-1`}>
          <svg viewBox="0 0 80 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            {/* Lightning bolt */}
            <polygon points="20,2 12,22 18,22 10,42 30,18 22,18 32,2" fill="#1A1A1A"/>
            <text x="34" y="30" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="18" fill="#1A1A1A" letterSpacing="-0.5">FLASH</text>
          </svg>
        </div>
      );

    case 'lalamove':
      return (
        <div className={`${className} rounded-xl bg-[#FF6600] flex items-center justify-center select-none shrink-0 overflow-hidden p-1`}>
          <svg viewBox="0 0 90 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            {/* Simple van silhouette */}
            <rect x="4" y="18" width="36" height="18" rx="2" fill="white" opacity="0.95"/>
            <rect x="8" y="12" width="22" height="8" rx="1" fill="white" opacity="0.8"/>
            <circle cx="12" cy="38" r="4" fill="#FF6600" stroke="white" strokeWidth="2"/>
            <circle cx="30" cy="38" r="4" fill="#FF6600" stroke="white" strokeWidth="2"/>
            <text x="44" y="32" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="13" fill="white" letterSpacing="-0.5">LALA</text>
            <text x="44" y="44" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="13" fill="white" letterSpacing="-0.5">MOVE</text>
          </svg>
        </div>
      );

    case 'dhl':
      return (
        <div className={`${className} rounded-xl bg-[#FFCC00] flex items-center justify-center select-none shrink-0 overflow-hidden`}>
          <svg viewBox="0 0 80 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-[80%] h-auto">
            <text x="4" y="26" fontFamily="Arial Black, Arial" fontWeight="900" fontSize="28" fill="#D40511" letterSpacing="-1">DHL</text>
          </svg>
        </div>
      );

    case 'pickup':
    default:
      return (
        <div className={`${className} rounded-xl bg-slate-700 flex flex-col items-center justify-center select-none shrink-0 p-1 gap-0.5`}>
          <svg className="w-[45%] h-auto" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M3 21h18M3 7v14M21 7v14M6 11h3M15 11h3M6 15h3M15 15h3M9 3h6l3 4H6l3-4z"/>
          </svg>
          <span className="text-[6px] font-bold text-white uppercase tracking-widest leading-none">Pickup</span>
        </div>
      );
  }
}
