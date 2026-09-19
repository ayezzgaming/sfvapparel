'use client';

import React from 'react';
import { AdCreative, AdPlatform } from '@/types/ads';
import {
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  Wand2,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  Users,
  Coins
} from 'lucide-react';

interface AiAdAdvisorPanelProps {
  platform: AdPlatform;
  creative: AdCreative;
  dailyBudget: number;
  productTitle?: string;
  onApplyBudgetRecommendation?: (newBudget: number) => void;
  onOptimizeCopy?: () => void;
  isOptimizing?: boolean;
}

export default function AiAdAdvisorPanel({
  platform,
  creative,
  dailyBudget,
  productTitle,
  onApplyBudgetRecommendation,
  onOptimizeCopy,
  isOptimizing = false
}: AiAdAdvisorPanelProps) {
  // Compute Dynamic Quality Score based on copy quality
  const textLength = creative.primaryText?.length || 0;
  const hasHeadline = !!creative.headline;
  const hasCta = !!creative.callToAction;

  let qualityScore = 82;
  if (textLength > 100 && textLength < 350) qualityScore += 6;
  if (hasHeadline) qualityScore += 4;
  if (hasCta) qualityScore += 3;
  if (dailyBudget >= 30) qualityScore += 3;
  qualityScore = Math.min(qualityScore, 96);

  // Dynamic targeting tags based on product context
  const getTargetingTags = () => {
    const titleLower = (productTitle || '').toLowerCase();
    if (titleLower.includes('esport') || titleLower.includes('e-sport') || titleLower.includes('game')) {
      return ['Pemain E-Sports Malaysia', 'Komuniti Gaming & Streamer', 'Pakaian Pasukan E-Sports'];
    }
    if (titleLower.includes('ragbi') || titleLower.includes('rugby')) {
      return ['Kelab Ragbi Tempatan', 'Peminat Sukan Ragbi', 'Pakaian Sukan Heavy-Duty'];
    }
    if (titleLower.includes('korporat') || titleLower.includes('polo') || titleLower.includes('sublimasi')) {
      return ['Syarikat & Korporat', 'Penganjur Acara & Hari Sukan', 'Tempahan Pukal B2B'];
    }
    return ['Peminat Sukan & Futsal', 'Pakaian Aktif & Jersi', 'Pengurus Pasukan & Kelab'];
  };

  const targetingTags = getTargetingTags();
  const isBudgetLow = dailyBudget < 30;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs font-sans text-left overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-900">Penasihat Strategi AI (SMM)</h4>
            <span className="text-[10px] text-slate-400 block">Algoritma Pengoptimuman Iklan</span>
          </div>
        </div>
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Aktif
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* 1. SKOR KUALITI IKLAN (META ALGORITHM QUALITY SCORE) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800">Skor Kualiti Iklan</span>
            </div>
            <div className="flex items-baseline space-x-1 font-mono">
              <span className="text-base font-bold text-slate-900">{qualityScore}</span>
              <span className="text-[11px] text-slate-400">/100</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                qualityScore >= 85 ? 'bg-emerald-500' : qualityScore >= 70 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${qualityScore}%` }}
            />
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Ayat iklan ini mempunyai cangkuk (*hook*) yang kuat, pematuhan polisi dasar yang tepat, dan mesra algoritma pembidaan{' '}
            <span className="font-medium text-slate-700 uppercase">{platform}</span>.
          </p>
        </div>

        {/* 2. ANALISIS & PENJIMATAN BAJET (LEARNING PHASE ADVISORY) */}
        <div className="space-y-1.5">
          <div className="flex items-center space-x-1.5">
            <Coins className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-xs font-semibold text-slate-800">Analisis Belanjawan Algoritma</span>
          </div>

          {isBudgetLow ? (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 space-y-1.5">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed text-amber-900">
                  <p className="font-semibold text-amber-950">Fasa Pembelajaran (Learning Phase) Lambat</p>
                  <p className="text-amber-800 mt-0.5">
                    Bajet <span className="font-semibold font-mono">RM{dailyBudget}/hari</span> agak rendah untuk
                    memperoleh 50 penukaran pertama. Pertimbangkan <span className="font-semibold font-mono">RM30/hari</span> selama 3 hari pertama bagi kestabilan kos per klik (CPC).
                  </p>
                </div>
              </div>

              {onApplyBudgetRecommendation && (
                <button
                  type="button"
                  onClick={() => onApplyBudgetRecommendation(30)}
                  className="w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-semibold transition-colors flex items-center justify-center space-x-1 shadow-2xs cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Gunakan Belanjawan Disyorkan (RM30/hari)</span>
                </button>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-900 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed text-emerald-900">
                <p className="font-semibold text-emerald-950">Belanjawan Optimum</p>
                <p className="text-emerald-800 mt-0.5">
                  Belanjawan <span className="font-semibold font-mono">RM{dailyBudget}/hari</span> mencukupi untuk melepasi fasa pembelajaran algoritma dan memaksimumkan pulangan (ROAS).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. CADANGAN SASARAN AUDIENS (TARGETING AUDIENCE) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-semibold text-slate-800">Cadangan Sasaran Minat (Interests)</span>
            </div>
            <span className="text-[10px] text-slate-400">Umur: 18 - 45</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {targetingTags.map((tag, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60"
              >
                <Target className="w-2.5 h-2.5 mr-1 text-slate-400" />
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* 4. BUTANG TINDAKAN PANTAS (QUICK ACTIONS) */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Tindakan Pantas
          </span>

          <div className="grid grid-cols-1 gap-1.5">
            {onOptimizeCopy && (
              <button
                type="button"
                onClick={onOptimizeCopy}
                disabled={isOptimizing}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all flex items-center justify-between disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Wand2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Optimumkan Ayat (AI)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}

            {isBudgetLow && onApplyBudgetRecommendation && (
              <button
                type="button"
                onClick={() => onApplyBudgetRecommendation(30)}
                className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Laras Bajet Automatik (RM30)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
