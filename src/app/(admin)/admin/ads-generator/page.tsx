'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { AdPlatform, AdObjective, AdCreative, AdCampaign, AdPlatformConnection } from '@/types/ads';
import { INITIAL_PLATFORMS, INITIAL_CAMPAIGNS } from '@/lib/ads/ad-templates';
import PlatformConnectCard from '@/components/admin/ads/PlatformConnectCard';
import AdPreviewCard from '@/components/admin/ads/AdPreviewCard';
import {
  GoogleAdsLogo,
  FacebookLogo,
  InstagramLogo,
  TikTokLogo,
  WhatsAppLogo
} from '@/components/admin/ads/PlatformLogos';
import { formatCurrency } from '@/lib/pricing-calculator';
import {
  Sparkles,
  Copy,
  Check,
  Rocket,
  RefreshCw,
  Info,
  Wand2,
  CheckCircle2,
  Key,
  Bot,
  X,
  ArrowLeft,
  SlidersHorizontal,
  Plus,
  Image as ImageIcon,
  FolderArchive,
  Upload,
  Trash2,
  ChevronRight,
  ChevronDown,
  SendHorizontal,
  Eye,
  EyeOff
} from 'lucide-react';

interface AiVariation {
  id: string;
  angleName: string;
  tagline: string;
  headline: string;
  secondaryHeadline: string;
  primaryText: string;
  callToAction: string;
  whatsappMessage: string;
}

export default function AdminAdsGeneratorPage() {
  const { designs } = useAppStore();

  // Navigation Tabs & Generation Workflow Steps
  const [activeTab, setActiveTab] = useState<'create' | 'connections' | 'campaigns'>('create');
  const [studioStep, setStudioStep] = useState<'prompt' | 'result'>('prompt');

  // Platforms & Campaigns Data
  const [platforms, setPlatforms] = useState<AdPlatformConnection[]>(INITIAL_PLATFORMS);
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(INITIAL_CAMPAIGNS);

  // AI Generator States
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<AdPlatform>('facebook');
  const [selectedObjective, setSelectedObjective] = useState<AdObjective>('whatsapp_leads');
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [dailyBudget, setDailyBudget] = useState<number>(30);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiSource, setAiSource] = useState<'gemini' | 'groq' | 'openrouter' | 'nlp'>('groq');
  const [apiKey, setApiKey] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Attachments State (+ button)
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);

  // Close attach menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load API Key and Provider from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('svf_ai_api_key');
      const savedProvider = localStorage.getItem('svf_ai_model_provider') as 'gemini' | 'groq' | 'openrouter' | 'nlp';
      if (savedKey) {
        setApiKey(savedKey);
      }
      if (savedProvider) {
        setAiSource(savedProvider);
      } else if (savedKey) {
        if (savedKey.startsWith('gsk_')) setAiSource('groq');
        else if (savedKey.startsWith('sk-or-')) setAiSource('openrouter');
        else setAiSource('gemini');
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSaveApiKey = (key: string, provider?: 'gemini' | 'groq' | 'openrouter' | 'nlp') => {
    setApiKey(key);
    const targetProvider = provider || aiSource;
    setAiSource(targetProvider);
    try {
      if (key.trim()) {
        localStorage.setItem('svf_ai_api_key', key.trim());
      } else {
        localStorage.removeItem('svf_ai_api_key');
      }
      localStorage.setItem('svf_ai_model_provider', targetProvider);
    } catch {
      // Ignore
    }
    setShowKeyModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
        setCustomTitle(file.name.replace(/\.[^/.]+$/, ''));
        setSelectedDesignId(null);
      };
      reader.readAsDataURL(file);
    }
    setShowAttachMenu(false);
  };

  // 3 Clean AI Generated Variations (Zero Emojis)
  const [selectedVariationIndex, setSelectedVariationIndex] = useState(0);
  const [aiVariations, setAiVariations] = useState<AiVariation[]>([
    {
      id: 'var-1',
      angleName: 'Sudut Harga Kilang & Penjimatan',
      tagline: 'Diskaun Kuantiti Terus Dari Kilang',
      headline: 'Kilang Cetak Jersi Sublimasi & DTF No. 1 Malaysia',
      secondaryHeadline: 'Tempah Terus Dari Kilang | Harga Borong',
      primaryText:
        'Jimat kos jersi pasukan anda terus dari kilang. Cetakan sublimasi tajam tidak luntur, fabrik Drifit Milano sejuk, siap dalam tempoh 7-10 hari bekerja. Hubungi kami untuk sebut harga segera di WhatsApp.',
      callToAction: 'Dapatkan Sebut Harga',
      whatsappMessage: 'Salam SVF Apparel, saya ingin mendapatkan sebut harga jersi futsal terus dari kilang.',
    },
    {
      id: 'var-2',
      angleName: 'Sudut Kualiti Premium & Rekaan',
      tagline: 'Fabrik Drifit Sejuk & Rekaan Percuma',
      headline: 'Jersi Sukan Kustom Eksklusif | Kain Milano Anti-Peluh',
      secondaryHeadline: 'Percuma Rekaan Nama, Nombor & Logo Pasukan',
      primaryText:
        'Tingkatkan identiti pasukan anda dengan jersi kustom eksklusif daripada SVF APPAREL. Warna tajam beresolusi tinggi, kemasan jahitan kukuh, dan rekaan disesuaikan secara profesional.',
      callToAction: 'Kirim Mesej WhatsApp',
      whatsappMessage: 'Hai SVF, saya berminat untuk membuat rekaan jersi kustom premium untuk pasukan kami.',
    },
    {
      id: 'var-3',
      angleName: 'Sudut Kelajuan & Jaminan Siap Pantas',
      tagline: 'Jaminan Siap 7 Hari & Penghantaran Selamat',
      headline: 'Tempah Jersi Siap Pantas 7 Hari | Penghantaran Seluruh Malaysia',
      secondaryHeadline: 'Kualiti Terjamin Dari Kilang SVF APPAREL',
      primaryText:
        'Perlukan jersi dengan segera untuk perlawanan minggu hadapan? Kilang kami memproses tempahan pantas 7 hari bekerja dengan jaminan kualiti dan penghantaran selamat ke seluruh Malaysia.',
      callToAction: 'Tempah Sekarang',
      whatsappMessage: 'Salam SVF, saya ada tempahan jersi segera, adakah boleh siap dalam 7 hari?',
    },
  ]);

  // Actions Feedback
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  // Active Design & Current Creative
  const activeDesign = selectedDesignId ? designs.find((d) => d.id === selectedDesignId) || null : null;
  const activeVariation = aiVariations[selectedVariationIndex] || aiVariations[0];

  const currentCreative: AdCreative = {
    id: 'active-preview',
    productName: customTitle || activeDesign?.title || 'Jersi Kustom Sublimasi',
    imageUrl: customImage || activeDesign?.thumbnail_url || activeDesign?.mockup_front_url || '/images/prod_sportswear.jpg',
    headline: activeVariation?.headline || 'Kilang Cetak Jersi Sublimasi & DTF',
    secondaryHeadline: activeVariation?.secondaryHeadline || '',
    primaryText: activeVariation?.primaryText || '',
    callToAction: activeVariation?.callToAction || 'Dapatkan Sebut Harga',
    targetUrl: 'https://svfapparel.my/catalog',
    whatsappMessage: activeVariation?.whatsappMessage || '',
    tags: activeDesign?.tags || ['jersi', 'sublimasi'],
  };

  const handleGenerateAi = async () => {
    if (!userPrompt.trim()) return;
    setIsGeneratingAi(true);

    try {
      const response = await fetch('/api/admin/ads/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userPrompt.trim(),
          platform: selectedPlatform,
          objective: selectedObjective,
          productName: customTitle || activeDesign?.title || 'Jersi Sublimasi Kustom',
          category: activeDesign?.category || 'Jersi Sukan',
          apiKey: apiKey.trim() || undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.variations && Array.isArray(data.variations) && data.variations.length > 0) {
          setAiVariations(data.variations);
          setSelectedVariationIndex(0);
          if (data.source?.includes('groq')) setAiSource('groq');
          else if (data.source?.includes('gemini')) setAiSource('gemini');
          else setAiSource('nlp');
        }
      }
      setStudioStep('result');
    } catch (err) {
      console.error('Failed to generate ads copy:', err);
      setStudioStep('result');
    } finally {
      setIsGeneratingAi(false);
    }
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
${activeVariation.headline}
${activeVariation.secondaryHeadline ? `\nSUB-TAJUK: ${activeVariation.secondaryHeadline}` : ''}

TEKS UTAMA / KAPSYEN:
${activeVariation.primaryText}

PANGGILAN TINDAKAN (CTA):
${activeVariation.callToAction}

MESEJ WHATSAPP:
${activeVariation.whatsappMessage}`;

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
        name: `${selectedPlatform.toUpperCase()} - ${currentCreative.productName}`,
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
        creative: currentCreative,
      };

      setCampaigns([newCamp, ...campaigns]);
      setIsPublishing(false);
      setPublishSuccess(true);
      setTimeout(() => {
        setPublishSuccess(false);
        setActiveTab('campaigns');
      }, 1000);
    }, 1200);
  };

  const handleToggleCampaignStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c))
    );
  };

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto min-h-[85vh] flex flex-col justify-between">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="space-y-6">
        {/* Header Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-normal text-slate-800 tracking-normal">
              Ads Generator
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Penjanaan kandungan kempen iklan pintar berasaskan algoritma Google, Meta, TikTok, dan WhatsApp.
            </p>
          </div>

          {/* Tab Switcher */}
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
              Studio Iklan AI
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('connections')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'connections'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Sambungan API</span>
              <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full font-medium">
                {platforms.filter((p) => p.isConnected).length}/{platforms.length}
              </span>
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

        {/* ======================= TAB 1: STUDIO IKLAN AI ======================= */}
        {activeTab === 'create' && (
          <div>
            {/* STEP 1: INDUSTRY STANDARD UNIFIED PROMPT CARD */}
            {studioStep === 'prompt' && (
              <div className="min-h-[62vh] flex flex-col justify-center items-center py-12 px-4 animate-in fade-in">
                <div className="w-full max-w-3xl">
                  {/* Unified Industry Standard Prompt Card */}
                  <div className="bg-white rounded-3xl border border-slate-300 shadow-sm focus-within:border-slate-800 focus-within:shadow-md transition-all p-3.5 sm:p-4 space-y-3">
                    {/* Attachment Preview INSIDE Prompt Box at the top */}
                    {(customImage || activeDesign) && (
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 pr-3 max-w-sm">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={customImage || activeDesign?.thumbnail_url || activeDesign?.mockup_front_url || '/images/prod_sportswear.jpg'}
                              alt="Lampiran"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 truncate">
                              {customTitle || activeDesign?.title}
                            </p>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {customImage ? 'Imej Dimuat Naik' : `Katalog SVF • ${activeDesign?.category || 'Jersi'}`}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCustomImage(null);
                              setCustomTitle(null);
                              setSelectedDesignId(null);
                            }}
                            className="w-6 h-6 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors shrink-0"
                            title="Padam lampiran"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Text Input / Textarea */}
                    <textarea
                      rows={2}
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && userPrompt.trim() && !isGeneratingAi) {
                          e.preventDefault();
                          handleGenerateAi();
                        }
                      }}
                      placeholder="Tulis arahan prompt iklan anda di sini..."
                      className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none resize-none font-sans px-1 pt-1"
                    />

                    {/* Bottom Action Bar inside the box */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-2" ref={attachMenuRef}>
                        {/* + (Plus) Attachment Button with Popover */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowAttachMenu(!showAttachMenu)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                              showAttachMenu
                                ? 'bg-slate-900 text-white'
                                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                            }`}
                            title="Tambah gambar atau pilih produk katalog"
                          >
                            <Plus className="w-4 h-4" />
                          </button>

                          {/* Attachment Popover (+ Menu) */}
                          {showAttachMenu && (
                            <div className="absolute left-0 bottom-11 z-40 bg-white rounded-2xl border border-slate-200 shadow-xl p-1.5 w-60 space-y-1 text-left animate-in fade-in zoom-in-95">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowCatalogModal(true);
                                  setShowAttachMenu(false);
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center space-x-2.5 transition-colors"
                              >
                                <FolderArchive className="w-4 h-4 text-slate-600" />
                                <span>Pilih dari Katalog</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  fileInputRef.current?.click();
                                  setShowAttachMenu(false);
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl text-left text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center space-x-2.5 transition-colors"
                              >
                                <Upload className="w-4 h-4 text-slate-600" />
                                <span>Muat Naik Gambar / Mockup</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Model Selector Pill */}
                        <button
                          type="button"
                          onClick={() => setShowKeyModal(true)}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200/80 text-xs font-medium text-slate-700 transition-colors shrink-0"
                          title="Tetapan Model AI & Kunci API"
                        >
                          <span>{aiSource === 'groq' ? 'Groq' : aiSource === 'gemini' ? 'Gemini' : aiSource === 'openrouter' ? 'OpenRouter' : 'Enjin AI'}</span>
                          <ChevronDown className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>

                      {/* Send Button */}
                      <button
                        type="button"
                        onClick={handleGenerateAi}
                        disabled={isGeneratingAi || !userPrompt.trim()}
                        className="w-8 h-8 rounded-full bg-slate-900 hover:bg-black text-white flex items-center justify-center shadow-xs transition-colors shrink-0 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                        title="Jana kempen iklan"
                      >
                        {isGeneratingAi ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <SendHorizontal className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: RESULT STUDIO - LEFT NAVIGATION & RIGHT LIVE PREVIEW */}
            {studioStep === 'result' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Back / Prompt Summary Ribbon */}
                <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setStudioStep('prompt')}
                      className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                      title="Kembali ke halaman input"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium uppercase tracking-wider block">
                        Arahan Prompt AI
                      </span>
                      <p className="text-xs font-normal text-slate-800 line-clamp-1 max-w-xl">
                        &ldquo;{userPrompt}&rdquo;
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setStudioStep('prompt')}
                      className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                    >
                      Ubah Arahan Prompt
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateAi}
                      disabled={isGeneratingAi}
                      className="px-4 py-1.5 rounded-full text-xs font-medium bg-slate-900 hover:bg-black text-white shadow-xs transition-colors flex items-center space-x-1.5"
                    >
                      <RefreshCw className={`w-3 h-3 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                      <span>Jana Semula</span>
                    </button>
                  </div>
                </div>

                {/* 3-Column Split: Left Platform Navigation, Center Copywriting Variations, Right Live Ad Preview */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN (lg:col-span-3): Platform Navigation */}
                  <div className="lg:col-span-3 space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block px-1 mb-2">
                        Platform Pengiklanan
                      </span>
                      <div className="bg-white rounded-3xl border border-slate-200 p-2 space-y-1 shadow-xs">
                        {[
                          { id: 'facebook' as AdPlatform, name: 'Facebook Ads', logo: FacebookLogo },
                          { id: 'instagram' as AdPlatform, name: 'Instagram Ads', logo: InstagramLogo },
                          { id: 'google' as AdPlatform, name: 'Google Ads', logo: GoogleAdsLogo },
                          { id: 'tiktok' as AdPlatform, name: 'TikTok Ads', logo: TikTokLogo },
                          { id: 'whatsapp' as AdPlatform, name: 'WhatsApp Ads', logo: WhatsAppLogo },
                        ].map((plat) => {
                          const Logo = plat.logo;
                          const isSelected = selectedPlatform === plat.id;
                          return (
                            <button
                              key={plat.id}
                              type="button"
                              onClick={() => setSelectedPlatform(plat.id)}
                              className={`w-full px-3.5 py-3 rounded-2xl flex items-center space-x-3 transition-all text-left ${
                                isSelected
                                  ? 'bg-slate-900 text-white shadow-xs font-medium'
                                  : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                            >
                              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                                <Logo className="w-4 h-4" />
                              </div>
                              <span className="text-xs tracking-tight">{plat.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Settings: Product & Budget */}
                    <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-3.5 shadow-xs">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Tetapan Kempen
                      </span>

                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Produk Katalog
                        </label>
                        <select
                          value={selectedDesignId || (designs[0]?.id ?? '')}
                          onChange={(e) => {
                            setSelectedDesignId(e.target.value);
                            setCustomImage(null);
                            setCustomTitle(null);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium truncate"
                        >
                          {designs.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-700 block mb-1">
                          Belanjawan Harian (RM)
                        </label>
                        <input
                          type="number"
                          min="10"
                          step="5"
                          value={dailyBudget}
                          onChange={(e) => setDailyBudget(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* CENTER COLUMN (lg:col-span-5): Copywriting Variations Selection */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Pilihan Copywriting
                      </span>
                      <span className="text-xs text-slate-400">
                        {aiVariations.length} Variasi Dijana
                      </span>
                    </div>

                    <div className="space-y-3">
                      {aiVariations.map((variation, idx) => {
                        const isSelected = selectedVariationIndex === idx;
                        return (
                          <div
                            key={variation.id}
                            onClick={() => setSelectedVariationIndex(idx)}
                            className={`p-5 rounded-3xl border transition-all cursor-pointer text-left ${
                              isSelected
                                ? 'bg-white border-slate-900 ring-1 ring-slate-900 shadow-sm'
                                : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[11px] font-semibold uppercase tracking-wider ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}>
                                {variation.angleName}
                              </span>
                              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                                {variation.tagline}
                              </span>
                            </div>

                            <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                              {variation.headline}
                            </h4>

                            {variation.secondaryHeadline && (
                              <p className="text-xs text-slate-500 mt-0.5 font-normal">
                                {variation.secondaryHeadline}
                              </p>
                            )}

                            <p className="text-xs mt-2.5 text-slate-600 line-clamp-3 leading-relaxed">
                              {variation.primaryText}
                            </p>

                            <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 font-medium">
                                CTA: <span className="text-slate-800 font-semibold">{variation.callToAction}</span>
                              </span>
                              <span className={`text-xs font-medium ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                                {isSelected ? 'Pilihan Aktif' : 'Pilih Variasi'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT COLUMN (lg:col-span-4): Live Ad Preview & Actions */}
                  <div className="lg:col-span-4 space-y-3 sticky top-6">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Pratonton Iklan
                      </span>
                      <span className="text-xs text-slate-400 capitalize">
                        {selectedPlatform === 'facebook'
                          ? 'Facebook Feed'
                          : selectedPlatform === 'instagram'
                          ? 'Instagram Feed'
                          : selectedPlatform === 'google'
                          ? 'Google Search'
                          : selectedPlatform === 'tiktok'
                          ? 'TikTok In-Feed'
                          : 'WhatsApp'}
                      </span>
                    </div>

                    <div className="bg-slate-50/80 rounded-3xl border border-slate-200 p-5 space-y-4 text-center shadow-xs">
                      {/* Ad Preview Card */}
                      <AdPreviewCard platform={selectedPlatform} creative={currentCreative} />

                      {/* Action Buttons Bar */}
                      <div className="pt-3 border-t border-slate-200 space-y-2">
                        <button
                          type="button"
                          onClick={handlePublishCampaign}
                          disabled={isPublishing}
                          className="w-full py-3 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium shadow-xs transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          {isPublishing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Memproses Kempen...</span>
                            </>
                          ) : publishSuccess ? (
                            <>
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span>Kempen Berjaya Dilancarkan!</span>
                            </>
                          ) : (
                            <>
                              <Rocket className="w-4 h-4" />
                              <span>Lancar Kempen Iklan</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyContent}
                          className="w-full py-2.5 rounded-full text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 transition-all flex items-center justify-center space-x-1.5 shadow-xs"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tersalin ke Papan Keratan</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Teks Copywriting</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: SAMBUNGAN AKAUN API ======================= */}
        {activeTab === 'connections' && (
          <div className="space-y-6">
            <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <p className="font-medium text-slate-800 text-sm">Status Gerbang Integrasi API</p>
                <p className="text-slate-500 mt-0.5">
                  Sambungkan akaun pengiklanan rasmi anda untuk membolehkan sistem melancarkan kempen secara terus.
                </p>
              </div>
              <div className="text-right shrink-0">
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
                    <th className="py-3.5 px-4 font-medium">Nama Kempen & Platform</th>
                    <th className="py-3.5 px-4 font-medium">Objektif</th>
                    <th className="py-3.5 px-4 font-medium">Status</th>
                    <th className="py-3.5 px-4 font-medium">Belanjawan / Hari</th>
                    <th className="py-3.5 px-4 font-medium">Prestasi (Klik / Capaian)</th>
                    <th className="py-3.5 px-4 font-medium">Jumlah Dibelanjakan</th>
                    <th className="py-3.5 px-4 text-right font-medium">Tindakan</th>
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

      {/* MODAL 1: CATALOG PICKER MODAL */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-2xl w-full shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <FolderArchive className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900">Pilih Produk Dari Katalog</h3>
                  <p className="text-xs text-slate-400">Pilih mockup yang ingin digunakan untuk kempen iklan ini.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto p-1 flex-1">
              {designs.map((d) => (
                <div
                  key={d.id}
                  onClick={() => {
                    setSelectedDesignId(d.id);
                    setCustomImage(null);
                    setCustomTitle(null);
                    setShowCatalogModal(false);
                  }}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col space-y-2 text-left hover:border-slate-300 ${
                    selectedDesignId === d.id && !customImage
                      ? 'bg-slate-100 border-slate-900 ring-1 ring-slate-900'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.thumbnail_url || d.mockup_front_url || '/images/prod_sportswear.jpg'}
                      alt={d.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-slate-800 line-clamp-1">{d.title}</h5>
                    <span className="text-[10px] text-slate-400 capitalize">{d.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: API KEY & MODEL CONFIGURATION MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900">Tetapan Model AI</h3>
                  <p className="text-xs text-slate-500">Pilih penyedia model dan masukkan API key.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Model Provider Selector */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Penyedia Model AI
                </label>
                <select
                  value={aiSource}
                  onChange={(e) => setAiSource(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer"
                >
                  <option value="groq">Groq (Llama 3.3 / GPT-OSS 120B)</option>
                  <option value="gemini">Google Gemini (Flash / Pro)</option>
                  <option value="openrouter">OpenRouter AI</option>
                  <option value="nlp">Enjin Semantik SVF (Tempatan)</option>
                </select>
              </div>

              {/* API Key Input with Eye Toggle */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">
                  Kunci API (API Key)
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Masukkan API key anda..."
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title={showApiKey ? 'Sembunyikan' : 'Lihat'}
                  >
                    {showApiKey ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleSaveApiKey(apiKey, aiSource)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium shadow-xs transition-colors"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
