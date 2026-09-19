'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { AdPlatform, AdObjective, AdCreative, AdCampaign, AdPlatformConnection } from '@/types/ads';
import { INITIAL_PLATFORMS, INITIAL_CAMPAIGNS } from '@/lib/ads/ad-templates';
import PlatformConnectCard from '@/components/admin/ads/PlatformConnectCard';
import AdPreviewCard from '@/components/admin/ads/AdPreviewCard';
import AiAdAdvisorPanel from '@/components/admin/ads/AiAdAdvisorPanel';
import {
  GoogleAdsLogo,
  FacebookLogo,
  InstagramLogo,
  TikTokLogo,
  WhatsAppLogo
} from '@/components/admin/ads/PlatformLogos';
import {
  getSavedPlatformConnectionsDb,
  getSavedCampaignsDb,
  saveCampaignDb,
  savePlatformConnectionDb,
  disconnectPlatformDb
} from '@/app/actions/adsPlatformActions';
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
  ChevronLeft,
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
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [adFormat, setAdFormat] = useState<'feed' | 'story' | 'reels'>('feed');

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
  const [showAdvisor, setShowAdvisor] = useState(false);

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

  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [lastDbSyncTime, setLastDbSyncTime] = useState<string | null>(null);

  // Fetch single source of truth directly from Supabase Database
  const fetchDatabaseState = async () => {
    setIsSyncingDb(true);
    try {
      // 1. Fetch live platform connections from central Supabase DB
      const connRes = await getSavedPlatformConnectionsDb();
      if (connRes.success && Array.isArray(connRes.connections)) {
        setPlatforms((prev) =>
          prev.map((initialP) => {
            const found = connRes.connections.find((p) => p.id === initialP.id);
            return found ? { ...initialP, ...found } : initialP;
          })
        );
        // Sync tokens into local storage for this machine
        if (connRes.tokens) {
          Object.entries(connRes.tokens).forEach(([platId, tok]) => {
            try {
              if (tok) {
                localStorage.setItem(`svf_platform_token_${platId}`, tok);
              }
            } catch {
              // Ignore
            }
          });
        }
      }

      // 2. Fetch shared campaigns from central Supabase DB
      const campRes = await getSavedCampaignsDb();
      if (campRes.success && Array.isArray(campRes.campaigns) && campRes.campaigns.length > 0) {
        setCampaigns(campRes.campaigns);
      }
      setLastDbSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error syncing with Supabase DB:', err);
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Initial Load: AI API Keys & Supabase Database fetch
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
    } catch {
      // Ignore
    }

    // Immediate DB fetch on mount
    fetchDatabaseState();

    // Re-sync on window focus (when admin switches back to this browser tab)
    const handleFocus = () => {
      fetchDatabaseState();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Auto re-sync when switching tabs to ensure real-time cross-device updates
  useEffect(() => {
    if (activeTab === 'connections' || activeTab === 'campaigns') {
      fetchDatabaseState();
    }
  }, [activeTab]);

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

  const handleUpdateConnection = async (updated: AdPlatformConnection) => {
    setPlatforms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    let token = '';
    try {
      token = localStorage.getItem(`svf_platform_token_${updated.id}`) || '';
    } catch {
      // Ignore
    }
    // Persist to central Supabase DB
    await savePlatformConnectionDb(updated, token || undefined);
    await fetchDatabaseState();
  };

  const handleToggleConnect = async (platformId: string) => {
    const target = platforms.find((p) => p.id === platformId);
    if (!target) return;
    const newConnected = !target.isConnected;
    const updated: AdPlatformConnection = {
      ...target,
      isConnected: newConnected,
      lastSynced: newConnected ? 'Baru sahaja' : target.lastSynced,
    };
    setPlatforms((prev) => prev.map((p) => (p.id === platformId ? updated : p)));
    if (!newConnected) {
      await disconnectPlatformDb(platformId);
    } else {
      let token = '';
      try {
        token = localStorage.getItem(`svf_platform_token_${platformId}`) || '';
      } catch {}
      await savePlatformConnectionDb(updated, token || undefined);
    }
    await fetchDatabaseState();
  };

  const handleToggleCampaignStatus = async (campaignId: string) => {
    const target = campaigns.find((c) => c.id === campaignId);
    if (!target) return;
    const newStatus: 'active' | 'paused' = target.status === 'active' ? 'paused' : 'active';
    const updated = {
      ...target,
      status: newStatus,
    };
    setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? updated : c)));
    await saveCampaignDb(updated);
    await fetchDatabaseState();
  };

  const handlePublishCampaign = async () => {
    setIsPublishing(true);
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
    setCampaigns((prev) => [newCampaign, ...prev]);
    // Save newly launched campaign to shared Supabase DB
    await saveCampaignDb(newCampaign);
    setIsPublishing(false);
    setPublishSuccess(true);
    await fetchDatabaseState();
    setTimeout(() => setPublishSuccess(false), 3500);
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
    <div className="space-y-4 w-full px-2 sm:px-4 lg:px-6 py-2 text-slate-900 font-sans">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="space-y-4">
        {/* Sleek Top Navigation Bar - Ultra Clean, Static & Minimal */}
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 py-2.5 border-b border-slate-100">
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
          <div className="animate-in fade-in">
            {/* Unified 2-Panel Workspace Layout with Toggle Handle */}
            <div className="flex flex-col lg:flex-row items-start gap-3.5 transition-all duration-300 relative">
              {/* PANEL KIRI (Form Konfigurasi) */}
              <div
                className={`bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-sm flex flex-col gap-4 transition-all duration-300 ${
                  isLeftPanelCollapsed
                    ? 'hidden'
                    : 'w-full lg:w-[440px] xl:w-[480px] shrink-0'
                }`}
              >
                {/* Error Notification Banner if API error occurs */}
                {generationError && (
                  <div className="bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-xs rounded-xl p-3.5 flex items-start justify-between gap-3 border border-red-200 dark:border-red-900/50">
                    <div className="flex-1">
                      <p className="font-semibold mb-0.5">Ralat Kredensial AI Model</p>
                      <p className="text-red-600 dark:text-red-300">{generationError}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowKeyModal(true)}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0"
                    >
                      Tetapkan Key
                    </button>
                  </div>
                )}

                {/* 1. SELECT PLATFORM */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block px-1">
                    1. Saluran Pengiklanan
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-5 gap-2">
                    {[
                      { id: 'facebook' as AdPlatform, name: 'Facebook', logo: FacebookLogo },
                      { id: 'instagram' as AdPlatform, name: 'Instagram', logo: InstagramLogo },
                      { id: 'google' as AdPlatform, name: 'Google', logo: GoogleAdsLogo },
                      { id: 'tiktok' as AdPlatform, name: 'TikTok', logo: TikTokLogo },
                      { id: 'whatsapp' as AdPlatform, name: 'WhatsApp', logo: WhatsAppLogo },
                    ].map((plat) => {
                      const Logo = plat.logo;
                      const isSelected = selectedPlatform === plat.id;
                      const conn = platforms.find((p) => p.id === plat.id);
                      const isConnected = conn?.isConnected;

                      return (
                        <button
                          key={plat.id}
                          type="button"
                          onClick={() => setSelectedPlatform(plat.id)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center ${
                            isSelected
                              ? 'bg-slate-50 dark:bg-zinc-800 border-indigo-500 dark:border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                              : 'bg-white dark:bg-zinc-900 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-slate-50/50 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <div className="w-4 h-4 flex items-center justify-center shrink-0">
                            <Logo className="w-4 h-4" />
                          </div>
                          <span className={`text-[11px] truncate w-full ${isSelected ? 'font-semibold text-slate-900 dark:text-zinc-100' : 'font-medium text-slate-700 dark:text-zinc-300'}`}>
                            {plat.name}
                          </span>
                          {isConnected ? (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[8px] font-medium text-slate-400 dark:text-zinc-500">
                              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-zinc-600"></span>
                              Belum
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. PROMPT & ATTACHMENTS */}
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block px-1">
                    2. Arahan &amp; Konteks Iklan
                  </span>
                  
                  {/* Modern Capsule Prompt Box */}
                  <div className="rounded-2xl border border-slate-200 dark:border-zinc-700 bg-slate-50/80 dark:bg-zinc-800/80 p-3 shadow-sm focus-within:bg-white dark:focus-within:bg-zinc-900 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all flex flex-col gap-2">
                    {/* Text Input / Textarea */}
                    <textarea
                      rows={3}
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
                      className="w-full bg-transparent resize-none border-0 focus:ring-0 focus:outline-none text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 font-sans p-1"
                    />

                    {/* Bottom Action Bar inside the box */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/50 dark:border-zinc-700/50">
                      {/* Left Side: + Button & Selected Product Chip */}
                      <div className="flex items-center space-x-2 min-w-0" ref={attachMenuRef}>
                        {/* + (Plus) Attachment Button with Popover */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() => setShowAttachMenu(!showAttachMenu)}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                              showAttachMenu ? 'bg-slate-200 dark:bg-zinc-700 text-slate-900 dark:text-zinc-100' : 'hover:bg-slate-200/80 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-400'
                            }`}
                            title="Tambah lampiran (Foto atau Produk)"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          {/* Dropdown Menu for Attachment Choices */}
                          {showAttachMenu && (
                            <div className="absolute left-0 bottom-9 z-30 w-52 bg-white dark:bg-zinc-800 rounded-xl p-1.5 shadow-xl border border-slate-100 dark:border-zinc-700 text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAttachMenu(false);
                                  setShowCatalogModal(true);
                                }}
                                className="w-full px-3 py-2 rounded-lg flex items-center space-x-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700/50 text-slate-700 dark:text-zinc-200 transition-colors text-left"
                              >
                                <FolderArchive className="w-4 h-4 text-slate-500" />
                                <span>Pilih dari Katalog</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowAttachMenu(false);
                                  fileInputRef.current?.click();
                                }}
                                className="w-full px-3 py-2 rounded-lg flex items-center space-x-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700/50 text-slate-700 dark:text-zinc-200 transition-colors text-left"
                              >
                                <Upload className="w-4 h-4 text-slate-500" />
                                <span>Muat Naik Foto / Mockup</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Selected Attachment Chip */}
                        {(customImage || activeDesign) && (
                          <div className="flex items-center space-x-2 bg-white dark:bg-zinc-800 rounded-lg p-1 pr-2 border border-slate-200/80 dark:border-zinc-700 shadow-2xs min-w-0">
                            <div className="w-5 h-5 rounded-md overflow-hidden bg-slate-200 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={customImage || activeDesign?.thumbnail_url || activeDesign?.mockup_front_url || '/images/prod_sportswear.jpg'}
                                alt="Lampiran"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-[11px] font-medium text-slate-800 dark:text-zinc-200 max-w-[110px] sm:max-w-[140px] truncate">
                              {customTitle || activeDesign?.title}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setCustomImage(null);
                                setCustomTitle(null);
                                setSelectedDesignId(null);
                              }}
                              className="w-4 h-4 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 flex items-center justify-center transition-colors shrink-0"
                              title="Padam lampiran"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Hidden File Input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </div>

                      {/* Right Side: Generate / Jana Iklan Button */}
                      <button
                        type="button"
                        onClick={handleGenerateAi}
                        disabled={isGeneratingAi || !userPrompt.trim()}
                        className="h-8 px-3.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all shrink-0 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed shadow-xs"
                        title="Jana kempen iklan"
                      >
                        {isGeneratingAi ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Menjana...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                            <span>Jana Iklan AI</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. POST-GENERATION TUNING CONTROLS (Active when results are available) */}
                {studioStep === 'result' && (
                  <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-zinc-800 animate-in fade-in">
                    <span className="text-[11px] font-semibold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block px-1">
                      3. Penalaan &amp; Pelancaran Kempen
                    </span>

                    {/* Combobox for Angle / Variation Selection */}
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block mb-1">
                        Pilihan Sudut Iklan ({aiVariations.length} Variasi)
                      </label>
                      <select
                        value={selectedVariationIndex}
                        onChange={(e) => setSelectedVariationIndex(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 text-xs text-slate-800 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium truncate"
                      >
                        {aiVariations.map((v, idx) => (
                          <option key={v.id || idx} value={idx}>
                            {v.angleName || `Variasi ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Product Catalog Selector */}
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block mb-1">
                        Produk Katalog
                      </label>
                      <select
                        value={selectedDesignId || (designs[0]?.id ?? '')}
                        onChange={(e) => {
                          setSelectedDesignId(e.target.value);
                          setCustomImage(null);
                          setCustomTitle(null);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 text-xs text-slate-800 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-slate-400 font-medium truncate"
                      >
                        {designs.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Daily Budget */}
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-zinc-400 block mb-1">
                        Belanjawan Harian (RM)
                      </label>
                      <input
                        type="number"
                        min="10"
                        step="5"
                        value={dailyBudget}
                        onChange={(e) => setDailyBudget(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 text-xs text-slate-800 dark:text-zinc-200 border border-slate-200/80 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                      />
                    </div>

                    {/* Launch & Copy Buttons */}
                    <div className="pt-2 space-y-2">
                      <button
                        type="button"
                        onClick={handlePublishCampaign}
                        disabled={isPublishing}
                        className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 shadow-xs cursor-pointer"
                      >
                        {isPublishing ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Melancarkan...</span>
                          </>
                        ) : publishSuccess ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Kempen Berjaya Dilancarkan!</span>
                          </>
                        ) : (
                          <span>Lancar Kempen Iklan</span>
                        )}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCopyContent}
                          className="flex-1 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200/60 dark:border-zinc-700 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Teks Disalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Salin Teks</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateAi}
                          disabled={isGeneratingAi}
                          className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                          title="Jana semula variasi iklan"
                        >
                          <RefreshCw className={`w-3 h-3 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                          <span>Jana Semula</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* VERTICAL CAPSULE TOGGLE DIVIDER BUTTON */}
              <button
                type="button"
                onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                title={isLeftPanelCollapsed ? 'Buka Panel Konfigurasi' : 'Sembunyikan Panel Konfigurasi'}
                className="w-5 h-12 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-full shadow-sm flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all z-20 shrink-0 select-none self-center lg:self-start lg:mt-32"
              >
                {isLeftPanelCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {/* PANEL KANAN (Kanvas Pratinjau) */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-5 shadow-sm flex-1 w-full min-h-[500px] flex flex-col transition-all duration-300">
                {/* Header Kanvas */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-zinc-800 overflow-x-auto">
                  {/* Sisi Kiri: Tab Format Tampilan (Pill Segmented Style) */}
                  <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
                    {[
                      { id: 'feed', label: 'Feed Post' },
                      { id: 'story', label: 'Stories' },
                      { id: 'reels', label: 'Reels / Video' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setAdFormat(fmt.id as 'feed' | 'story' | 'reels')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                          adFormat === fmt.id
                            ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 shadow-xs font-semibold'
                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>

                  {/* Sisi Kanan: Action Buttons (Salin Teks, Lancar Kempen, Penasihat AI) */}
                  <div className="flex items-center space-x-2 shrink-0">
                    {studioStep === 'result' && (
                      <>
                        <button
                          type="button"
                          onClick={handleCopyContent}
                          className="h-8 px-3 rounded-xl text-xs font-medium text-slate-700 dark:text-zinc-300 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border border-slate-200/80 dark:border-zinc-700 transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer"
                          title="Salin teks iklan"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Disalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                              <span>Salin Teks</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handlePublishCampaign}
                          disabled={isPublishing}
                          className="h-8 px-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 text-xs font-semibold transition-all flex items-center space-x-1.5 whitespace-nowrap disabled:opacity-50 cursor-pointer shadow-xs"
                          title="Lancar kempen ke platform"
                        >
                          {isPublishing ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Melancar...</span>
                            </>
                          ) : publishSuccess ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Berjaya!</span>
                            </>
                          ) : (
                            <>
                              <Rocket className="w-3.5 h-3.5 text-indigo-400 dark:text-indigo-600" />
                              <span>Lancar Kempen</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowAdvisor(true)}
                          className="h-8 px-3 rounded-xl text-xs font-semibold text-slate-800 dark:text-zinc-200 hover:text-slate-950 bg-slate-50 dark:bg-zinc-800 border border-slate-200/90 dark:border-zinc-700 shadow-2xs hover:bg-slate-100 dark:hover:bg-zinc-700 transition-all flex items-center space-x-1.5 whitespace-nowrap cursor-pointer group"
                          title="Penasihat Strategi AI (SMM)"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                          <span className="hidden sm:inline">Penasihat AI</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Konten Kanvas: Empty State vs Live Mockup Preview */}
                {studioStep === 'prompt' ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center my-auto min-h-[380px]">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700/60 flex items-center justify-center mb-3 text-slate-400 dark:text-zinc-500">
                      <Sparkles className="w-5 h-5 stroke-[1.5]" />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200 mb-1">
                      Kanvas Pratinjau Siap
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-zinc-500 max-w-sm leading-relaxed">
                      Pilih platform dan masukkan arahan di panel kiri untuk memvisualisasikan iklan di sini.
                    </p>
                  </div>
                ) : (
                  <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center py-4 flex-1">
                    <AdPreviewCard
                      platform={selectedPlatform}
                      creative={currentCreative}
                      connectedAccount={platforms.find((p) => p.id === selectedPlatform)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Collapsible Slide-over / Flyout Drawer for AI Strategy Advisor */}
            {showAdvisor && (
              <div className="fixed inset-0 z-50 overflow-hidden">
                {/* Dark/Blur Backdrop */}
                <div
                  className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
                  onClick={() => setShowAdvisor(false)}
                />
                <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 z-10 animate-in slide-in-from-right duration-300">
                  <div className="w-screen max-w-md sm:max-w-lg p-3 sm:p-5 flex flex-col justify-center h-full">
                    <AiAdAdvisorPanel
                      platform={selectedPlatform}
                      creative={currentCreative}
                      dailyBudget={dailyBudget}
                      productTitle={activeDesign?.title || customTitle || 'Jersi Sukan Sublimasi'}
                      onApplyBudgetRecommendation={(b) => setDailyBudget(b)}
                      onOptimizeCopy={handleGenerateAi}
                      onClose={() => setShowAdvisor(false)}
                      isOptimizing={isGeneratingAi}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================= TAB 2: SAMBUNGAN AKAUN API ======================= */}
        {activeTab === 'connections' && (
          <div className="space-y-4">
            <div className="bg-slate-50/90 p-4 sm:p-5 rounded-3xl border border-slate-200/80 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-slate-900 text-sm">Status Gerbang & Kawalan Pemasaran</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Pangkalan Data Terpusat (Supabase)
                  </span>
                </div>
                <p className="text-slate-500">
                  Data sambungan disimpan ke pelayan berpusat supaya semua komputer/admin boleh melihat status akaun dan metrik yang sama serta-merta.
                </p>
              </div>
              <div className="flex items-center space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={fetchDatabaseState}
                  disabled={isSyncingDb}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition-colors flex items-center space-x-1.5 shadow-2xs disabled:opacity-50"
                  title="Segerak status terkini dari Pangkalan Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncingDb ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDb ? 'Menyegerak...' : 'Segerak Pangkalan Data'}</span>
                </button>
                <div className="text-right">
                  <span className="font-semibold text-slate-900">
                    {platforms.filter((p) => p.isConnected).length} / {platforms.length}
                  </span>{' '}
                  aktif
                </div>
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
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mt-1 border border-emerald-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Berjalan Baik
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
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full whitespace-nowrap border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Berjalan
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
