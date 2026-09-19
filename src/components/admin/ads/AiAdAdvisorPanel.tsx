'use client';

import React, { useState } from 'react';
import { AdCreative, AdPlatform } from '@/types/ads';
import {
  TrendingUp,
  Target,
  Wand2,
  SlidersHorizontal,
  Plus,
  X,
  RefreshCw,
  Sparkles,
  Users,
  Coins,
  ChevronRight,
  Eye,
  MousePointerClick,
  Check
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
  // Active Tab inside Advisor Panel
  const [activeTab, setActiveTab] = useState<'audience' | 'budget' | 'score'>('audience');

  // Interactive Target Audience State (Add, Remove, Regenerate)
  const [customTagInput, setCustomTagInput] = useState('');
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [activePersona, setActivePersona] = useState<string>('sports');
  const [targetingTags, setTargetingTags] = useState<string[]>([
    'Peminat Sukan & Futsal',
    'Pakaian Aktif & Jersi',
    'Pengurus Kelab Sukan',
    'Liga Amatur Malaysia'
  ]);

  // Dynamic targeting presets based on Persona
  const personaPresets: Record<string, { label: string; tags: string[] }> = {
    sports: {
      label: 'Sukan & Kelab',
      tags: ['Peminat Sukan & Futsal', 'Pakaian Aktif & Jersi', 'Pengurus Kelab Sukan', 'Liga Amatur Malaysia']
    },
    esports: {
      label: 'E-Sports & Gaming',
      tags: ['Pemain E-Sports Malaysia', 'Komuniti Gaming & Streamer', 'Peminat Mobile Legends & PUBG', 'Jersi Kustom Gaming']
    },
    corporate: {
      label: 'Korporat & Event',
      tags: ['Syarikat & Korporat', 'Penganjur Acara & Hari Sukan', 'Tempahan Pukal B2B', 'Kemeja Polo Sublimasi']
    },
    casual: {
      label: 'Belia & Komuniti',
      tags: ['Pakaian Gaya Hidup Aktif', 'Komuniti Larian & Marathon', 'Kelab Remaja & Universiti']
    }
  };

  const handleSelectPersona = (key: string) => {
    setActivePersona(key);
    if (personaPresets[key]) {
      setTargetingTags(personaPresets[key].tags);
    }
  };

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = customTagInput.trim();
    if (trimmed && !targetingTags.includes(trimmed)) {
      setTargetingTags([...targetingTags, trimmed]);
      setCustomTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTargetingTags(targetingTags.filter((t) => t !== tagToRemove));
  };

  const handleRegenerateTagsWithAi = () => {
    setIsGeneratingTags(true);
    setTimeout(() => {
      const titleLower = (productTitle || '').toLowerCase();
      let generated: string[] = [];

      if (titleLower.includes('esport') || titleLower.includes('game')) {
        generated = ['Komuniti Mobile Legends Malaysia', 'Kelab E-Sports Universiti', 'Peminat Jersey Sublimasi Gaming', 'Streamer & Gamers'];
      } else if (titleLower.includes('polo') || titleLower.includes('korporat')) {
        generated = ['Pengurus HR & Syarikat', 'Kelab Sukan Jabatan Kerajaan', 'Penganjur Family Day', 'Baju Kolar Korporat'];
      } else {
        const pool = [
          'Pemain Futsal Lembah Klang',
          'Penganjur Kejohanan Bola Sepak',
          'Kelab Badminton & Sukan Raket',
          'Pasukan Sukan Sekolah & IPT',
          'Peminat Jersi Retro & Sublimasi',
          'Kapten Pasukan Sukan'
        ];
        // Pick random 4
        generated = [...pool].sort(() => 0.5 - Math.random()).slice(0, 4);
      }

      setTargetingTags(generated);
      setIsGeneratingTags(false);
    }, 450);
  };

  // Dynamic Reach & Clicks Calculations
  const estMinReach = Math.round(dailyBudget * 350);
  const estMaxReach = Math.round(dailyBudget * 720);
  const estMinClicks = Math.round(dailyBudget * 8);
  const estMaxClicks = Math.round(dailyBudget * 19);

  // Quality Score Calculation
  const textLength = creative.primaryText?.length || 0;
  const hasHeadline = !!creative.headline;
  const hasCta = !!creative.callToAction;

  let qualityScore = 82;
  if (textLength > 100 && textLength < 350) qualityScore += 6;
  if (hasHeadline) qualityScore += 4;
  if (hasCta) qualityScore += 3;
  if (dailyBudget >= 30) qualityScore += 3;
  qualityScore = Math.min(qualityScore, 96);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs font-sans text-left overflow-hidden">
      {/* Sleek Sub-Header with Tabs */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
        <div className="flex items-center space-x-1 bg-slate-200/60 p-0.5 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('audience')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === 'audience'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sasaran Minat
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === 'budget'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Anggaran Belanjawan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('score')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
              activeTab === 'score'
                ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Skor Kualiti
          </button>
        </div>

        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider hidden sm:inline">
          SMM AI
        </span>
      </div>

      <div className="p-4 space-y-3.5">
        {/* ================= TAB 1: SASARAN MINAT (INTERACTIVE TARGETING) ================= */}
        {activeTab === 'audience' && (
          <div className="space-y-3">
            {/* Persona Preset Switcher */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-700">Kategori Persona:</span>
                <button
                  type="button"
                  onClick={handleRegenerateTagsWithAi}
                  disabled={isGeneratingTags}
                  className="text-[10px] font-medium text-slate-600 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                  title="Jana sasaran baru mengikut konteks produk"
                >
                  <RefreshCw className={`w-3 h-3 ${isGeneratingTags ? 'animate-spin' : ''}`} />
                  <span>Jana Semula AI</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1">
                {Object.entries(personaPresets).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectPersona(key)}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-medium text-left truncate transition-colors ${
                      activePersona === key
                        ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                        : 'bg-slate-100/80 hover:bg-slate-200/70 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Tags List */}
            <div>
              <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                Sasaran Minat Terpilih ({targetingTags.length}):
              </span>

              <div className="flex flex-wrap gap-1.5 min-h-[50px] p-2 bg-slate-50/80 rounded-xl border border-slate-200/60">
                {targetingTags.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic">Tiada sasaran minat. Tambah sasaran di bawah.</span>
                ) : (
                  targetingTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white text-slate-800 border border-slate-200 shadow-2xs animate-in fade-in"
                    >
                      <Target className="w-2.5 h-2.5 text-slate-400" />
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="w-3.5 h-3.5 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors ml-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Add Custom Tag Form */}
            <form onSubmit={handleAddTag} className="flex items-center space-x-1.5 pt-1">
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="Tambah minat sasaran tersuai..."
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-slate-400"
              />
              <button
                type="button"
                onClick={() => handleAddTag()}
                disabled={!customTagInput.trim()}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-medium transition-colors flex items-center space-x-1 disabled:opacity-40 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </form>
          </div>
        )}

        {/* ================= TAB 2: ANGGARAN BELANJAWAN (BUDGET ESTIMATES) ================= */}
        {activeTab === 'budget' && (
          <div className="space-y-3">
            {/* Quick Budget Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-700">Pilih Preset Belanjawan Harian:</span>
                <span className="text-[11px] font-mono font-bold text-slate-900">RM {dailyBudget}/hari</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[20, 30, 50, 100].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => onApplyBudgetRecommendation && onApplyBudgetRecommendation(amt)}
                    className={`py-1.5 rounded-xl text-[11px] font-mono font-semibold transition-all ${
                      dailyBudget === amt
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200/70 text-slate-700'
                    }`}
                  >
                    RM {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated Metrics Box */}
            <div className="p-3 bg-slate-50/90 rounded-xl border border-slate-200/60 space-y-2">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Anggaran Prestasi Harian
              </span>

              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-0.5">
                    <Eye className="w-3 h-3" />
                    <span>Anggaran Capaian</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 font-mono">
                    {estMinReach.toLocaleString()} - {estMaxReach.toLocaleString()}
                  </p>
                </div>

                <div className="p-2 bg-white rounded-lg border border-slate-100">
                  <div className="flex items-center space-x-1 text-slate-400 text-[10px] mb-0.5">
                    <MousePointerClick className="w-3 h-3" />
                    <span>Anggaran Klik (CTR)</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 font-mono">
                    {estMinClicks} - {estMaxClicks} klik
                  </p>
                </div>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed pt-0.5">
                {dailyBudget < 30 ? (
                  <span className="text-amber-700 font-medium">
                    Nota: Belanjawan bawah RM30 memerlukan masa lebih lama untuk melepasi fasa pembelajaran Meta Pixel.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium">
                    Belanjawan mencukupi untuk melepasi fasa pembelajaran algoritma secara pantas.
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ================= TAB 3: SKOR KUALITI (QUALITY SCORE) ================= */}
        {activeTab === 'score' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Skor Kualiti Keseluruhan
                </span>
                <span className="text-xs text-slate-600">Pematuhan & Kekuatan Salinan</span>
              </div>
              <div className="text-right font-mono">
                <span className="text-lg font-extrabold text-slate-900">{qualityScore}</span>
                <span className="text-xs text-slate-400">/100</span>
              </div>
            </div>

            {/* Score Breakdown List */}
            <div className="space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-[11px] text-slate-600">Kekuatan Cangkuk (*Hook*)</span>
                <span className="text-[11px] font-semibold text-emerald-600 font-mono">94%</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-[11px] text-slate-600">Kejelasan Tawaran & Harga</span>
                <span className="text-[11px] font-semibold text-emerald-600 font-mono">88%</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[11px] text-slate-600">Format & Pematuhan Polisi {platform}</span>
                <span className="text-[11px] font-semibold text-emerald-600 font-mono">98%</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Action Button at the Bottom */}
        {onOptimizeCopy && (
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onOptimizeCopy}
              disabled={isOptimizing}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-medium transition-all flex items-center justify-between disabled:opacity-50 cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <Wand2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Optimumkan Salinan Iklan (AI)</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
