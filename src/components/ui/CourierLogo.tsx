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
        <div className={`${className} rounded-xl bg-[#E30613] text-white flex items-center justify-center font-black tracking-tighter text-[11px] select-none shadow-2xs shrink-0 p-1`}>
          <span className="leading-none text-center">J&amp;T</span>
        </div>
      );

    case 'poslaju':
      return (
        <div className={`${className} rounded-xl bg-[#ED1C24] text-white flex flex-col items-center justify-center font-black select-none shadow-2xs shrink-0 p-0.5 border border-red-400`}>
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5v-3h3v-2h-3v-3h-2v3H8v2h3v3h2z" />
          </svg>
          <span className="text-[7.5px] font-black tracking-tighter uppercase leading-tight -mt-0.5">PosLaju</span>
        </div>
      );

    case 'ninjavan':
      return (
        <div className={`${className} rounded-xl bg-[#C41230] text-white flex flex-col items-center justify-center font-bold select-none shadow-2xs shrink-0 p-1`}>
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="11" r="1.5" />
            <circle cx="15" cy="11" r="1.5" />
            <path d="M12 2C6.48 2 2 6.48 2 12c0 2.8 1.15 5.33 3 7.15V22l3.5-1.5c1.1.32 2.27.5 3.5.5 5.52 0 10-4.48 10-10S17.52 2 12 2zm5 11h-2v-1h2v1zm-8 0H7v-1h2v1z" />
          </svg>
          <span className="text-[7px] font-black uppercase tracking-tighter -mt-0.5">NINJA</span>
        </div>
      );

    case 'flash':
      return (
        <div className={`${className} rounded-xl bg-[#F6D000] text-slate-900 flex flex-col items-center justify-center font-black select-none shadow-2xs shrink-0 p-0.5 border border-amber-300`}>
          <svg className="w-5 h-5 text-slate-900" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 2v11h3v9l7-12h-4l4-8z" />
          </svg>
          <span className="text-[7.5px] font-black uppercase tracking-tighter -mt-0.5">FLASH</span>
        </div>
      );

    case 'lalamove':
      return (
        <div className={`${className} rounded-xl bg-[#FF6600] text-white flex flex-col items-center justify-center font-black select-none shadow-2xs shrink-0 p-1`}>
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
          </svg>
          <span className="text-[7px] font-bold uppercase tracking-tighter leading-tight -mt-0.5">LALAMOVE</span>
        </div>
      );

    case 'dhl':
      return (
        <div className={`${className} rounded-xl bg-[#FFCC00] text-[#D40511] flex items-center justify-center font-black tracking-tighter text-[11px] select-none shadow-2xs shrink-0 p-1 border border-amber-400`}>
          <span>DHL</span>
        </div>
      );

    case 'pickup':
    default:
      return (
        <div className={`${className} rounded-xl bg-slate-800 text-white flex flex-col items-center justify-center select-none shadow-2xs shrink-0 p-1`}>
          <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 21h18M3 7v14M21 7v14M6 11h3M15 11h3M6 15h3M15 15h3M9 3h6l3 4H6l3-4z" />
          </svg>
          <span className="text-[6.5px] font-bold uppercase tracking-tighter mt-0.5">PICKUP</span>
        </div>
      );
  }
}
