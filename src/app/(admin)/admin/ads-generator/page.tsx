'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { AdPlatform, AdObjective, AdCreative, AdCampaign, AdPlatformConnection } from '@/types/ads';
import {
  INITIAL_PLATFORMS,
  INITIAL_CAMPAIGNS,
  HEADLINE_PRESETS,
  PRIMARY_TEXT_PRESETS
} from '@/lib/ads/ad-templates';
import PlatformConnectCard from '@/components/admin/ads/PlatformConnectCard';
import AdPreviewCard from '@/components/admin/ads/AdPreviewCard';
import { formatCurrency } from '@/lib/pricing-calculator';
import {
  Sparkles,
  Link2,
  Copy,
  Check,
  Rocket,
  Play,
  Pause,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  SlidersHorizontal,
  Info
} from 'lucide-react';

export default function AdminAdsGeneratorPage() {
  const { designs } = useAppStore();

  // Tab State
  const [activeTab, setActiveTab] = useState<'create' | 'connections' | 'campaigns'>('create');

  // Platforms State
  const [platforms, setPlatforms] = useState<AdPlatformConnection[]>(INITIAL_PLATFORMS);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(INITIAL_CAMPAIGNS);

  // Creative Generator Form State
  const [selectedPlatform, setSelectedPlatform] = useState<AdPlatform>('meta');
  const [selectedObjective, setSelectedObjective] = useState<AdObjective>('whatsapp_leads');
  const [selectedDesignId, setSelectedDesignId] = useState<string>(designs[0]?.id || '');
  const [headline, setHeadline] = useState('Kilang Cetak Jersi Sublimasi & DTF No. 1 Malaysia');
  const [secondaryHeadline, setSecondaryHeadline] = useState('Tempah Terus Dari Kilang | Siap Pantas');
  const [primaryText, setPrimaryText] = useState(
    'Mencari kilang jersi sublimasi yang pantas dan berkualiti? SVF Apparel menyediakan cetakan berkualiti tinggi, warna tajam tak luntur, dan kain Drifit Milano yang sejuk dipakai. Dapatkan sebut harga segera!'
  );
  const [callToAction, setCallToAction] = useState('Dapatkan Sebut Harga');
  const [dailyBudget, setDailyBudget] = useState<number>(30);
  const [whatsappMessage, setWhatsappMessage] = useState(
    'Salam SVF Apparel, saya berminat untuk membuat tempahan jersi kustom.'
  );

  // Status feedback states
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Current creative object
  const activeDesign = designs.find((d) => d.id === selectedDesignId) || designs[0];
  const creative: AdCreative = {
    id: 'draft',
    productName: activeDesign?.title || 'Jersi Kustom Sublimasi',
    imageUrl: activeDesign?.thumbnail_url || activeDesign?.mockup_front_url || '/images/prod_sportswear.jpg',
    headline,
    secondaryHeadline,
    primaryText,
    callToAction,
    targetUrl: 'https://svfapparel.my',
    whatsappMessage,
    tags: activeDesign?.tags || ['jersi', 'sublimasi'],
  };

  const handleToggleConnect = (platformId: string) => {
    setPlatforms((prev) =>
      prev.map((p) => {
        if (p.id === platformId) {
          return {
            ...p,
            isConnected: !p.isConnected,
            accountId: !p.isConnected ? `ACT-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
            accountName: !p.isConnected ? 'SVF Apparel Ad Account' : undefined,
            lastSynced: !p.isConnected ? 'Baru sahaja' : undefined,
            balance: !p.isConnected ? 500.0 : undefined,
          };
        }
        return p;
      })
    );
  };

  const handleCopyContent = () => {
    const textToCopy = `TAJUK IKLAN:
${headline}
${secondaryHeadline ? `\nSUB-TAJUK: ${secondaryHeadline}` : ''}

TEKS UTAMA / KASYEN:
${primaryText}

PANGGILAN TINDAKAN (CTA):
${callToAction}

MESEJ WHATSAPP:
${whatsappMessage}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublishCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setIsPublishing(true);

    setTimeout(() => {
      const newCamp: AdCampaign = {
        id: `camp-${Date.now()}`,
        name: `${selectedPlatform.toUpperCase()} - ${creative.productName}`,
        platform: selectedPlatform,
        objective: selectedObjective,
        status: 'active',
        dailyBudget,
        spent: 0,
        clicks: 0,
        impressions: 0,
        leadsOrConversions: 0,
        cpc: 0,
        createdAt: new Date().toISOString().split('T')[0],
        creative,
      };

      setCampaigns([newCamp, ...campaigns]);
      setIsPublishing(false);
      setPublishSuccess(true);
      setTimeout(() => {
        setPublishSuccess(false);
        setActiveTab('campaigns');
      }, 1200);
    }, 1500);
  };

  const handleToggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c))
    );
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-slate-800 tracking-normal">
            Ads Generator
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pusat penjanaan kandungan kempen iklan & integrasi API Google, Meta, TikTok, dan WhatsApp.
          </p>
        </div>

        {/* Tab Navigation Pill Switcher */}
        <div className="bg-slate-100 p-1 rounded-full border border-slate-200 flex items-center self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Jana Iklan Baharu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'connections'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sambungan API ({platforms.filter((p) => p.isConnected).length}/{platforms.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeTab === 'campaigns'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kempen Aktif ({campaigns.length})
          </button>
        </div>
      </div>

      {/* ======================= TAB 1: JANA IKLAN BAHARU ======================= */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form: Configuration & Copywriting */}
          <div className="lg:col-span-7 space-y-5">
            <form onSubmit={handlePublishCampaign} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
              {/* Platform Selector */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-2">
                  1. Pilih Platform Iklan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['google', 'meta', 'tiktok', 'whatsapp'] as AdPlatform[]).map((p) => {
                    const isSelected = selectedPlatform === p;
                    const platInfo = platforms.find((pl) => pl.id === p);
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setSelectedPlatform(p)}
                        className={`p-3 rounded-2xl border text-center text-xs font-medium transition-all flex flex-col items-center space-y-1 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span className="capitalize">{p === 'meta' ? 'Meta (FB/IG)' : p}</span>
                        {platInfo?.isConnected ? (
                          <span className={`text-[10px] ${isSelected ? 'text-emerald-300' : 'text-emerald-600'}`}>
                            ● Tersambung
                          </span>
                        ) : (
                          <span className={`text-[10px] ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                            ○ Manual
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Product Design Selector */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-2">
                  2. Pilih Produk / Templat Rekaan
                </label>
                <select
                  value={selectedDesignId}
                  onChange={(e) => setSelectedDesignId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                >
                  {designs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title} ({d.category} - {d.print_type.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Objective & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Objektif Kempen
                  </label>
                  <select
                    value={selectedObjective}
                    onChange={(e) => setSelectedObjective(e.target.value as AdObjective)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                  >
                    <option value="whatsapp_leads">WhatsApp Leads (Disyorkan)</option>
                    <option value="catalog_sales">Jualan Katalog (E-Commerce)</option>
                    <option value="brand_awareness">Kesesuaian Jenama (Awareness)</option>
                    <option value="traffic">Trafik Laman Web</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1.5">
                    Cadangan Belanjawan Harian (RM)
                  </label>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                  />
                </div>
              </div>

              {/* Copywriting Generator Area */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">
                    3. Salinan Iklan (Copywriting Pintar)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const randomHeadline = HEADLINE_PRESETS[Math.floor(Math.random() * HEADLINE_PRESETS.length)];
                      const randomText = PRIMARY_TEXT_PRESETS[Math.floor(Math.random() * PRIMARY_TEXT_PRESETS.length)];
                      setHeadline(randomHeadline);
                      setPrimaryText(randomText);
                    }}
                    className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center space-x-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-slate-700" />
                    <span>Jana Semula AI</span>
                  </button>
                </div>

                {/* Headline Input */}
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Tajuk Utama (Headline)</span>
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium"
                  />
                </div>

                {/* Secondary Headline (for Google Search) */}
                {selectedPlatform === 'google' && (
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Sub-Tajuk (Google Search Only)</span>
                    <input
                      type="text"
                      value={secondaryHeadline}
                      onChange={(e) => setSecondaryHeadline(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                    />
                  </div>
                )}

                {/* Primary Text */}
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Teks Utama / Kapsyen</span>
                  <textarea
                    rows={3}
                    required
                    value={primaryText}
                    onChange={(e) => setPrimaryText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 leading-relaxed"
                  />
                </div>

                {/* WhatsApp Message Preset */}
                {selectedObjective === 'whatsapp_leads' && (
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">Mesej Sambutan WhatsApp Autogrip</span>
                    <input
                      type="text"
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono text-[11px]"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleCopyContent}
                  className="px-4 py-2.5 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all flex items-center justify-center space-x-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tersalin ke Papan Keratan!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Semua Teks</span>
                    </>
                  )}
                </button>

                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium shadow-xs transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menolak ke API {selectedPlatform.toUpperCase()}...</span>
                    </>
                  ) : publishSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Kempen Berjaya Diterbitkan!</span>
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3.5 h-3.5" />
                      <span>Lancar Kempen Terus via API</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Panel: Live Visual Ad Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-50 rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 text-center">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-medium text-slate-700 uppercase tracking-wider">
                  Pratonton Langsung ({selectedPlatform.toUpperCase()})
                </h3>
                <span className="text-[11px] text-slate-400">Format Iklan Sebenar</span>
              </div>

              <AdPreviewCard platform={selectedPlatform} creative={creative} />

              <div className="text-left text-[11px] text-slate-500 bg-white p-3 rounded-2xl border border-slate-200/80 space-y-1">
                <div className="flex items-center space-x-1.5 font-medium text-slate-700">
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tips Prestasi Iklan:</span>
                </div>
                <p>
                  Iklan dengan gambar mockup sukan beresolusi tinggi dan butang WhatsApp mempunyai kadar penukaran (*conversion rate*) 2.8x lebih tinggi untuk pasaran Malaysia.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: SAMBUNGAN AKAUN API ======================= */}
      {activeTab === 'connections' && (
        <div className="space-y-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">Status Gerbang Integrasi API</p>
              <p className="text-slate-500 mt-0.5">
                Sambungkan akaun pengiklanan rasmi anda untuk membolehkan sistem melancarkan kempen secara terus.
              </p>
            </div>
            <div className="text-right">
              <span className="font-medium text-slate-900">
                {platforms.filter((p) => p.isConnected).length} daripada {platforms.length}
              </span>{' '}
              platform aktif
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {platforms.map((platform) => (
              <PlatformConnectCard
                key={platform.id}
                platform={platform}
                onToggleConnect={handleToggleConnect}
              />
            ))}
          </div>
        </div>
      )}

      {/* ======================= TAB 3: SENARAI KEMPEN AKTIF ======================= */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-slate-500 text-xs font-medium border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Nama Kempen & Platform</th>
                  <th className="py-3.5 px-4">Objektif</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Belanjawan / Hari</th>
                  <th className="py-3.5 px-4">Prestasi (Klik / Capaian)</th>
                  <th className="py-3.5 px-4">Jumlah Dibelanjakan</th>
                  <th className="py-3.5 px-4 text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {campaigns.map((camp) => (
                  <tr key={camp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={camp.creative.imageUrl}
                            alt={camp.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-medium text-slate-800 block text-sm">{camp.name}</span>
                          <span className="text-[11px] text-slate-400 uppercase font-mono">
                            {camp.platform} · {camp.createdAt}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium">
                        {camp.objective.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {camp.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          ● Berjalan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                          Jeda (Paused)
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-800 text-xs">
                      {formatCurrency(camp.dailyBudget)} / hari
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-xs">
                        <span className="font-medium text-slate-800 font-mono">{camp.clicks} klik</span>
                        <span className="text-slate-400 text-[11px] block">
                          {camp.impressions.toLocaleString()} paparan (CPC: {formatCurrency(camp.cpc)})
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-medium text-slate-900 text-xs">
                      {formatCurrency(camp.spent)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleCampaignStatus(camp.id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                          camp.status === 'active'
                            ? 'text-slate-600 hover:bg-slate-100 border-slate-200'
                            : 'text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-300'
                        }`}
                      >
                        {camp.status === 'active' ? 'Jeda' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
