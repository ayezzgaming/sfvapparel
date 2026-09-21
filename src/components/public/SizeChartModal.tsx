'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Ruler } from 'lucide-react';

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADULT_SIZES = [
  { size: 'XS', chest: '36', length: '26', shoulder: '16.5' },
  { size: 'S', chest: '38', length: '27', shoulder: '17.5' },
  { size: 'M', chest: '40', length: '28', shoulder: '18.5' },
  { size: 'L', chest: '42', length: '29', shoulder: '19.5' },
  { size: 'XL', chest: '44', length: '30', shoulder: '20.5' },
  { size: '2XL', chest: '46', length: '31', shoulder: '21.5' },
  { size: '3XL', chest: '48', length: '32', shoulder: '22.5' },
  { size: '4XL', chest: '50', length: '33', shoulder: '23.5' },
];

const KID_SIZES = [
  { size: '24 (3-4 thn)', chest: '26', length: '18', shoulder: '11.5' },
  { size: '26 (5-6 thn)', chest: '28', length: '20', shoulder: '12.5' },
  { size: '28 (7-8 thn)', chest: '30', length: '22', shoulder: '13.5' },
  { size: '30 (9-10 thn)', chest: '32', length: '24', shoulder: '14.5' },
  { size: '32 (11-12 thn)', chest: '34', length: '25', shoulder: '15.5' },
];

export default function SizeChartModal({ isOpen, onClose }: SizeChartModalProps) {
  const [activeTab, setActiveTab] = useState<'adult' | 'kid'>('adult');
  const [unit, setUnit] = useState<'inch' | 'cm'>('inch');

  if (!isOpen || typeof window === 'undefined') return null;

  const currentSizes = activeTab === 'adult' ? ADULT_SIZES : KID_SIZES;

  const formatValue = (inchStr: string) => {
    if (unit === 'inch') return `${inchStr}"`;
    const num = parseFloat(inchStr);
    return `${(num * 2.54).toFixed(1)} cm`;
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 font-ios select-none"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">
                Carta Saiz Standard Kilang
              </h3>
              <p className="text-[11px] text-slate-400">Ukuran jersi potong kustom SFV</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Dewasa / Kanak-kanak & Unit Switcher */}
        <div className="flex items-center justify-between gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center flex-1">
            <button
              type="button"
              onClick={() => setActiveTab('adult')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'adult'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Dewasa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('kid')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'kid'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Kanak-Kanak
            </button>
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setUnit('inch')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                unit === 'inch'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Inci (&quot;)
            </button>
            <button
              type="button"
              onClick={() => setUnit('cm')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                unit === 'cm'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              CM
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold text-[11px]">
              <tr>
                <th className="py-2.5 px-3">Saiz</th>
                <th className="py-2.5 px-3">Dada (Chest)</th>
                <th className="py-2.5 px-3">Labuh (Length)</th>
                <th className="py-2.5 px-3">Bahu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {currentSizes.map((row) => (
                <tr key={row.size} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-bold text-slate-900">{row.size}</td>
                  <td className="py-2 px-3 font-mono">{formatValue(row.chest)}</td>
                  <td className="py-2 px-3 font-mono">{formatValue(row.length)}</td>
                  <td className="py-2 px-3 font-mono">{formatValue(row.shoulder)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10.5px] text-slate-400 text-center leading-normal">
          * Toleransi jahitan standard kilang adalah &plusmn;0.5 inci.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs tracking-wide shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer"
        >
          Faham & Tutup
        </button>
      </div>
    </div>,
    document.body
  );
}
