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
  const { designs, companySettings } = useAppStore();
  const brandName = companySettings?.brand_name || 'SFV APPAREL';

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
  const [aiSource, setAiSource] = useState<'gemini' | 'groq' | 'openrouter'>('groq');
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

  // Load API Key, Provider, Platforms, and Campaigns from localStorage
  useEffect(() => {
    try {
      const savedKey = localStorage.getItem('svf_ai_api_key');
      const savedProvider = localStorage.getItem('svf_ai_model_provider') as 'gemini' | 'groq' | 'openrouter';
      if (savedKey) {
        setApiKey(savedKey);
      }
      if (savedProvider && ['gemini', 'groq', 'openrouter'].includes(savedProvider)) {
        setAiSource(savedProvider);
      } else if (savedKey) {
        if (savedKey.startsWith('gsk_')) setAiSource('groq');
        else if (savedKey.startsWith('sk-or-')) setAiSource('openrouter');
        else setAiSource('gemini');
      }

      // Restore saved platform connections
      const savedPlatforms = localStorage.getItem('svf_ads_platforms');
      if (savedPlatforms) {
        const parsed = JSON.parse(savedPlatforms);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPlatforms((prev) =>
            prev.map((initialP) => {
              const found = parsed.find((p: any) => p.id === initialP.id);
              return found ? { ...initialP, ...found } : initialP;
            })
          );
        }
      }

      // Restore saved campaigns
      const savedCampaigns = localStorage.getItem('svf_ads_campaigns');
      if (savedCampaigns) {
        const parsed = JSON.parse(savedCampaigns);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCampaigns(parsed);
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const handleSaveApiKey = (key: string, provider?: 'gemini' | 'groq' | 'openrouter') => {
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

  // 5 Clean AI Generated Variations Grounded on Database
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
      whatsappMessage: 'Salam ' + (companySettings?.brand_name || 'SFV APPAREL') + ', saya ingin mendapatkan sebut harga jersi futsal terus dari kilang.',
    },
    {
      id: 'var-2',
      angleName: 'Sudut Kualiti Premium & Rekaan',
      tagline: 'Fabrik Drifit Sejuk & Rekaan Percuma',
      headline: 'Jersi Sukan Kustom Eksklusif | Kain Milano Anti-Peluh',
      secondaryHeadline: 'Percuma Rekaan Nama, Nombor & Logo Pasukan',
      primaryText:
        'Tingkatkan identiti pasukan anda dengan jersi kustom eksklusif daripada ' + (companySettings?.brand_name || 'SFV APPAREL') + '. Warna tajam beresolusi tinggi, kemasan jahitan kukuh, dan rekaan disesuaikan secara profesional.',
      callToAction: 'Kirim Mesej WhatsApp',
      whatsappMessage: 'Hai ' + (companySettings?.brand_name || 'SFV APPAREL') + ', saya berminat untuk membuat rekaan jersi kustom premium untuk pasukan kami.',
    },
    {
      id: 'var-3',
      angleName: 'Sudut Kelajuan & Jaminan Siap Pantas',
      tagline: 'Jaminan Siap 7 Hari & Penghantaran Selamat',
      headline: 'Tempah Jersi Siap Pantas 7 Hari | Penghantaran Seluruh Malaysia',
      secondaryHeadline: 'Kualiti Terjamin Dari Kilang ' + (companySettings?.brand_name || 'SFV APPAREL'),
      primaryText:
        'Perlukan jersi dengan segera untuk perlawanan minggu hadapan? Kilang kami memproses tempahan pantas 7 hari bekerja dengan jaminan kualiti dan penghantaran selamat ke seluruh Malaysia.',
      callToAction: 'Tempah Sekarang',
      whatsappMessage: 'Salam ' + (companySettings?.brand_name || 'SFV APPAREL') + ', saya ada tempahan jersi segera, adakah boleh siap dalam 7 hari?',
    },
    {
      id: 'var-4',
      angleName: 'Sudut Identiti Pasukan & E-Sports',
      tagline: 'Percuma Custom Nama & Nombor Pasukan',
      headline: 'Jersi E-Sports & Kelab Sukan | Sublimasi HD Penuh',
      secondaryHeadline: 'Pilihan No. 1 Pasukan Juara & Kejohanan',
      primaryText:
        'Tampilkan gaya profesional di gelanggang. Sublimasi penuh warna terang yang tidak pudar, rekaan khas mengikut tema kelab anda, dan potongan sukan yang fleksibel dan selesa.',
      callToAction: 'Kustom Sekarang',
      whatsappMessage: 'Salam ' + (companySettings?.brand_name || 'SFV APPAREL') + ', saya ingin tempah jersi kustom untuk pasukan kami.',
    },
    {
      id: 'var-5',
      angleName: 'Sudut Korporat, Sekolah & Pukal',
      tagline: 'Invois Rasmi & Harga Pukal Berperingkat',
      headline: 'Tempahan Baju Pukal & Jersi Korporat | Sulaman & DTF',
      secondaryHeadline: 'Diskaun Kuantiti Sehingga 25%',
      primaryText:
        'Penyelesaian pakaian rasmi untuk syarikat, sekolah, dan agensi kerajaan. Pesanan pukal dengan diskaun berperingkat, kualiti terjamin, dan penyata invois perniagaan yang lengkap.',
      callToAction: 'Minta Sebut Harga Pukal',
      whatsappMessage: 'Salam ' + (companySettings?.brand_name || 'SFV APPAREL') + ', saya mewakili syarikat/institusi untuk mendapatkan sebut harga tempahan pukal.',
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
    productName: customTitle || activeDesign?.title || 'Jersi Sukan Kustom Sublimasi',
    imageUrl: customImage || activeDesign?.thumbnail_url || activeDesign?.mockup_front_url || '/images/prod_sportswear.jpg',
    headline: activeVariation?.headline || 'Kilang Cetak Jersi Sublimasi & DTF',
    secondaryHeadline: activeVariation?.secondaryHeadline || '',
    primaryText: activeVariation?.primaryText || '',
    callToAction: activeVariation?.callToAction || 'Dapatkan Sebut Harga',
    targetUrl: companySettings?.website_url || 'https://sfvapparel.my/catalog',
    whatsappMessage: activeVariation?.whatsappMessage || '',
    tags: activeDesign?.tags || ['jersi', 'sublimasi'],
  };

  const [generationError, setGenerationError] = useState<string | null>(null);

  const handleGenerateAi = async () => {
    if (!userPrompt.trim()) return;
    setIsGeneratingAi(true);
    setGenerationError(null);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Gagal menjana copywriting AI. Sila semak Kunci API anda.');
      }

      if (data.variations && Array.isArray(data.variations) && data.variations.length > 0) {
        setAiVariations(data.variations);
        setSelectedVariationIndex(0);
        if (data.source?.includes('groq')) setAiSource('groq');
        else if (data.source?.includes('gemini')) setAiSource('gemini');
        else if (data.source?.includes('openrouter')) setAiSource('openrouter');
        setStudioStep('result');
      } else {
        throw new Error('Respons model AI tidak mengandungi variasi yang sah.');
      }
    } catch (err: any) {
      console.error('Failed to generate ads copy:', err);
      setGenerationError(err?.message || 'Ralat sambungan ke API Model AI.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleUpdateConnection = (updated: AdPlatformConnection) => {
    setPlatforms((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      try {
        localStorage.setItem('svf_ads_platforms', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleToggleConnect = (platformId: string) => {
    setPlatforms((prev) => {
      const next = prev.map((p) => {
        if (p.id === platformId) {
          return {
            ...p,
            isConnected: !p.isConnected,
            lastSynced: !p.isConnected ? 'Baru sahaja' : p.lastSynced,
          };
        }
        return p;
      });
      try {
        localStorage.setItem('svf_ads_platforms', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handleToggleCampaignStatus = (campaignId: string) => {
    setCampaigns((prev) => {
      const next: AdCampaign[] = prev.map((c) => {
        if (c.id === campaignId) {
          const newStatus: 'active' | 'paused' = c.status === 'active' ? 'paused' : 'active';
          return {
            ...c,
            status: newStatus,
          };
        }
        return c;
      });
      try {
        localStorage.setItem('svf_ads_campaigns', JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };

  const handlePublishCampaign = () => {
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishSuccess(true);
      const newCampaign: AdCampaign = {
        id: `camp-${Date.now()}`,
        name: `${selectedPlatform.toUpperCase()} - ${currentCreative.headline.substring(0, 30)}`,
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
      setCampaigns((prev) => {
        const next = [newCampaign, ...prev];
        try {
          localStorage.setItem('svf_ads_campaigns', JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });
      setTimeout(() => setPublishSuccess(false), 3500);
    }, 1200);
  };

  const handleCopyContent = () => {
    const fullAdContent = `--- IKLAN ${selectedPlatform.toUpperCase()} (${brandName}) ---
TAJUK: ${currentCreative.headline}
${currentCreative.secondaryHeadline ? `SUB-TAJUK: ${currentCreative.secondaryHeadline}\n` : ''}
SALINAN IKLAN:
${currentCreative.primaryText}

TINDAKAN (CTA): ${currentCreative.callToAction}
PAUTAN: ${currentCreative.targetUrl}
MESEJ AUTOFILL WHATSAPP: ${currentCreative.whatsappMessage}`;

    navigator.clipboard.writeText(fullAdContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-slate-900 font-sans">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="space-y-4">
        {/* Sleek Top Navigation Bar - Ultra Clean & Minimal */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
          {/* Tab Switcher */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'create'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Studio Iklan AI
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('connections')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'connections'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sambungan API
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-white text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kempen Aktif ({campaigns.length})
            </button>
          </div>

          {/* AI Model / Key Selector Quick Pill */}
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors shrink-0"
            title="Tetapan Model AI & Kunci API"
          >
            <Bot className="w-3.5 h-3.5 text-slate-500" />
            <span>{aiSource === 'groq' ? 'Groq Llama 3.3' : aiSource === 'gemini' ? 'Gemini 1.5' : 'OpenRouter'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* ======================= TAB 1: STUDIO IKLAN AI ======================= */}
        {activeTab === 'create' && (
          <div>
            {/* STEP 1: PLATFORM-FIRST GENERATION WORKFLOW */}
            {studioStep === 'prompt' && (
              <div className="min-h-[58vh] flex flex-col justify-center items-center py-6 px-4 animate-in fade-in">
                <div className="w-full max-w-2xl space-y-5">
                  {/* Error Notification Banner if API error occurs */}
                  {generationError && (
                    <div className="bg-red-50 text-red-700 text-xs rounded-2xl p-4 flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-semibold mb-0.5">Ralat Kredensial AI Model</p>
                        <p className="text-red-600">{generationError}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowKeyModal(true)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-medium hover:bg-red-700 transition-colors shrink-0"
                      >
                        Tetapkan API Key
                      </button>
                    </div>
                  )}

                  {/* 1. SELECT PLATFORM FIRST */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">
                      1. Pilih Saluran Pengiklanan
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-50/80 p-1.5 rounded-3xl">
                      {[
                        { id: 'facebook' as AdPlatform, name: 'Facebook', logo: FacebookLogo },
                        { id: 'instagram' as AdPlatform, name: 'Instagram', logo: InstagramLogo },
                        { id: 'google' as AdPlatform, name: 'Google', logo: GoogleAdsLogo },
                        { id: 'tiktok' as AdPlatform, name: 'TikTok', logo: TikTokLogo },
                        { id: 'whatsapp' as AdPlatform, name: 'WhatsApp', logo: WhatsAppLogo },
                      ].map((plat) => {
                        const Logo = plat.logo;
                        const isSelected = selectedPlatform === plat.id;
                        return (
                          <button
                            key={plat.id}
                            type="button"
                            onClick={() => setSelectedPlatform(plat.id)}
                            className={`px-3 py-2.5 rounded-2xl flex items-center justify-center space-x-2 transition-all ${
                              isSelected
                                ? 'bg-white text-slate-900 font-semibold shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                            }`}
                          >
                            <div className="w-4 h-4 flex items-center justify-center shrink-0">
                              <Logo className="w-4 h-4" />
                            </div>
                            <span className="text-xs">{plat.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. UNIFIED PROMPT & ATTACHMENTS CARD */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-1">
                      2. Masukkan Arahan & Konteks Iklan
                    </span>
                    <div className="bg-slate-50/90 rounded-3xl p-4 space-y-3">
                      {/* Attachment Preview INSIDE Prompt Box at the top */}
                      {(customImage || activeDesign) && (
                        <div className="flex items-center gap-2 pb-2">
                          <div className="flex items-center space-x-3 bg-white rounded-2xl p-2 pr-3 max-w-sm">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 shrink-0">
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
                                {customImage ? 'Imej Dimuat Naik' : `Katalog ${brandName} • ${activeDesign?.category || 'Jersi'}`}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomImage(null);
                                setCustomTitle(null);
                                setSelectedDesignId(null);
                              }}
                              className="w-6 h-6 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors shrink-0"
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
                        placeholder={`Tulis arahan kempen untuk ${
                          selectedPlatform === 'facebook'
                            ? 'Facebook Ads'
                            : selectedPlatform === 'instagram'
                            ? 'Instagram Ads'
                            : selectedPlatform === 'google'
                            ? 'Google Search Ads'
                            : selectedPlatform === 'tiktok'
                            ? 'TikTok Video Ads'
                            : 'WhatsApp Direct Leads'
                        }...`}
                        className="w-full bg-transparent text-sm sm:text-base text-slate-900 placeholder-slate-400 focus:outline-none resize-none font-sans px-1 pt-1"
                      />

                      {/* Bottom Action Bar inside the box */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center space-x-2" ref={attachMenuRef}>
                          {/* + (Plus) Attachment Button with Popover */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowAttachMenu(!showAttachMenu)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shrink-0 ${
                                showAttachMenu
                                  ? 'bg-slate-200 text-slate-900'
                                  : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                              }`}
                              title="Tambah gambar atau pilih produk katalog"
                            >
                              <Plus className="w-4 h-4" />
                            </button>

                            {/* Attachment Popover (+ Menu) */}
                            {showAttachMenu && (
                              <div className="absolute left-0 bottom-11 z-40 bg-white rounded-2xl p-1.5 w-60 space-y-1 text-left animate-in fade-in zoom-in-95 shadow-lg">
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
                                  <span>Muat Naik Imej</span>
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Hidden File Input */}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </div>

                        {/* Send Button */}
                        <button
                          type="button"
                          onClick={handleGenerateAi}
                          disabled={isGeneratingAi || !userPrompt.trim()}
                          className="w-8 h-8 rounded-full bg-slate-900 hover:bg-black text-white flex items-center justify-center transition-colors shrink-0 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
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
              </div>
            )}

            {/* STEP 2: RESULT STUDIO - ULTRA-CLEAN SPACIOUS 2-COLUMN STUDIO */}
            {studioStep === 'result' && (
              <div className="animate-in fade-in">
                {/* 2-Column Split: Left Platform Nav & Settings, Right Full Live Preview Studio */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN (lg:col-span-4): Clean Platform Navigation & Quick Settings */}
                  <div className="lg:col-span-4 lg:sticky lg:top-4 space-y-3">
                    {/* Platform Selector */}
                    <div className="bg-slate-50/80 rounded-3xl p-2 space-y-1">
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
                            className={`w-full px-3.5 py-2.5 rounded-2xl flex items-center space-x-3 transition-all text-left ${
                              isSelected
                                ? 'bg-slate-100 text-slate-900 font-semibold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
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

                    {/* Quick Settings: Product & Budget */}
                    <div className="bg-slate-50/80 rounded-3xl p-4 space-y-3">
                      <div>
                        <label className="text-[11px] font-medium text-slate-600 block mb-1">
                          Produk Katalog
                        </label>
                        <select
                          value={selectedDesignId || (designs[0]?.id ?? '')}
                          onChange={(e) => {
                            setSelectedDesignId(e.target.value);
                            setCustomImage(null);
                            setCustomTitle(null);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-medium truncate"
                        >
                          {designs.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.title}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-medium text-slate-600 block mb-1">
                          Belanjawan Harian (RM)
                        </label>
                        <input
                          type="number"
                          min="10"
                          step="5"
                          value={dailyBudget}
                          onChange={(e) => setDailyBudget(Number(e.target.value))}
                          className="w-full px-3 py-2 rounded-xl bg-white text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-300 font-mono"
                        />
                      </div>
                    </div>

                    {/* Prompt Actions (Ubah / Jana Semula) */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStudioStep('prompt')}
                        className="flex-1 py-2 rounded-2xl text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50/80 hover:bg-slate-100 transition-colors text-center"
                      >
                        Ubah Arahan
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateAi}
                        disabled={isGeneratingAi}
                        className="px-4 py-2 rounded-2xl text-xs font-medium bg-slate-900 hover:bg-black text-white transition-colors flex items-center justify-center space-x-1.5"
                      >
                        <RefreshCw className={`w-3 h-3 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                        <span>Jana Semula</span>
                      </button>
                    </div>
                  </div>


                  {/* RIGHT COLUMN (lg:col-span-8): Spacious Live Ad Preview with Angle Switcher */}
                  <div className="lg:col-span-8 space-y-4">
                    {/* Horizontal Variation Angle Switcher Pills */}
                    <div className="bg-slate-50/80 rounded-3xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                        Pilihan Sudut Iklan ({aiVariations.length})
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-0.5">
                        {aiVariations.map((v, idx) => {
                          const isSelected = selectedVariationIndex === idx;
                          return (
                            <button
                              key={v.id || idx}
                              type="button"
                              onClick={() => setSelectedVariationIndex(idx)}
                              className={`px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap ${
                                isSelected
                                  ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                              }`}
                            >
                              <span>{v.angleName || `Variasi ${idx + 1}`}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Spacious Preview & Actions Container */}
                    <div className="bg-slate-50/80 rounded-3xl p-6 sm:p-8 space-y-6 text-center">
                      {/* Live Ad Simulator Card */}
                      <AdPreviewCard platform={selectedPlatform} creative={currentCreative} />

                      {/* Action Buttons Bar */}
                      <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
                        <button
                          type="button"
                          onClick={handlePublishCampaign}
                          disabled={isPublishing}
                          className="w-full sm:flex-1 py-3 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                        >
                          {isPublishing ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>Memproses...</span>
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
                          className="w-full sm:w-auto px-6 py-3 rounded-full text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 transition-all flex items-center justify-center space-x-1.5"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Teks</span>
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
          <div className="space-y-4">
            <div className="bg-slate-50/80 p-4 sm:p-5 rounded-3xl border border-slate-100 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900 text-sm">Status Gerbang & Kawalan Pemasaran</p>
                <p className="text-slate-500 mt-0.5">
                  Sambungkan platform untuk membolehkan AI melancarkan kempen dan membaca analitik prestasi secara automatik.
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="font-semibold text-slate-900">
                  {platforms.filter((p) => p.isConnected).length} daripada {platforms.length}
                </span>{' '}
                saluran aktif
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {platforms.map((platform) => (
                <PlatformConnectCard
                  key={platform.id}
                  platform={platform}
                  campaigns={campaigns}
                  onUpdateConnection={handleUpdateConnection}
                  onToggleConnect={handleToggleConnect}
                  onNavigateToStudio={() => setActiveTab('create')}
                />
              ))}
            </div>
          </div>
        )}

        {/* ======================= TAB 3: SENARAI KEMPEN AKTIF & PENILAIAN AI ======================= */}
        {activeTab === 'campaigns' && (
          <div className="space-y-4">
            {/* KPI Summary Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50/80 p-4 rounded-3xl text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase block">Jumlah Belanja</span>
                <span className="text-base font-semibold text-slate-900 font-mono">
                  {formatCurrency(campaigns.reduce((acc, c) => acc + c.spent, 0))}
                </span>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-3xl text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase block">Prospek WhatsApp Masuk</span>
                <span className="text-base font-semibold text-emerald-600 font-mono">
                  {campaigns.reduce((acc, c) => acc + c.leadsOrConversions, 0)} Orang
                </span>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-3xl text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase block">Purata Kos / Prospek</span>
                <span className="text-base font-semibold text-slate-900 font-mono">
                  RM {(campaigns.reduce((acc, c) => acc + c.spent, 0) / Math.max(1, campaigns.reduce((acc, c) => acc + c.leadsOrConversions, 0))).toFixed(2)}
                </span>
              </div>
              <div className="bg-slate-50/80 p-4 rounded-3xl text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase block">Status Keseluruhan</span>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mt-1">
                  ● Berjalan Baik
                </span>
              </div>
            </div>

            {/* Campaigns Table with AI Evaluation Notes */}
            <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 text-slate-500 text-xs font-medium border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-4 font-medium">Nama Kempen & Platform</th>
                      <th className="py-3.5 px-4 font-medium">Objektif</th>
                      <th className="py-3.5 px-4 font-medium">Status</th>
                      <th className="py-3.5 px-4 font-medium">Belanjawan</th>
                      <th className="py-3.5 px-4 font-medium">Prestasi & Analitik</th>
                      <th className="py-3.5 px-4 font-medium">Penilaian AI untuk Masa Depan</th>
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
                              <span className="font-medium text-slate-800 block text-xs">{camp.name}</span>
                              <span className="text-[11px] text-slate-400 uppercase font-mono">
                                {camp.platform} · {camp.createdAt}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                            {camp.objective.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {camp.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                              ● Berjalan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Jeda
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-800 text-xs whitespace-nowrap">
                          {formatCurrency(camp.dailyBudget)}/hari
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs space-y-0.5">
                            <span className="font-semibold text-emerald-600 font-mono block">
                              {camp.leadsOrConversions} Prospek WA
                            </span>
                            <span className="text-slate-400 text-[11px] block">
                              {camp.clicks} klik • {camp.impressions.toLocaleString()} paparan
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-xs text-slate-600 leading-snug">
                            {camp.evaluationNote || 'Kempen memaparkan respons stabil. Teruskan pemantauan baki kredit.'}
                          </p>
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
                  <option value="groq">Groq Cloud (Llama 3.3 70B Versatile / Mixtral)</option>
                  <option value="gemini">Google Gemini (2.0 Flash / Pro)</option>
                  <option value="openrouter">OpenRouter AI (Multi-Model Gateway)</option>
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
