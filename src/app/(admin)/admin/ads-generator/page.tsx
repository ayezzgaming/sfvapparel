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
import {
  getSavedPlatformConnectionsDb,
  getSavedCampaignsDb,
  saveCampaignDb,
  savePlatformConnectionDb,
  disconnectPlatformDb
} from '@/app/actions/adsPlatformActions';
import { formatCurrency } from '@/lib/pricing-calculator';
import {
  Copy,
  Check,
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
  EyeOff,
  ArrowUp,
  Layers,
  Bookmark,
  Clock,
  RotateCw,
  Pencil
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
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
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
  const [selectedHookStyle, setSelectedHookStyle] = useState<string>('diskon');
  const [isAudienceModalOpen, setIsAudienceModalOpen] = useState(false);
  const [bestTimeIndex, setBestTimeIndex] = useState(0);

  const bestTimesList = [
    'Khamis – Ahad (8:00 PM – 10:30 PM)',
    'Jumaat – Sabtu (12:30 PM – 2:30 PM)',
    'Setiap Hari (7:30 PM – 11:00 PM)',
    'Isnin – Rabu (8:30 PM – 10:00 PM)',
  ];
  const bestPostTime = bestTimesList[bestTimeIndex];

  const handleRegenerateBestTime = () => {
    setBestTimeIndex((prev) => (prev + 1) % bestTimesList.length);
  };

  const handleSelectHookStyle = (hookId: string) => {
    setSelectedHookStyle(hookId);
    const mapping: Record<string, number> = {
      diskon: 0,
      solusi: 1,
      fomo: 2,
      story: 3,
    };
    if (mapping[hookId] !== undefined && mapping[hookId] < aiVariations.length) {
      setSelectedVariationIndex(mapping[hookId]);
    }
  };

  const handleRegenerateHookOnly = () => {
    const nextIdx = (selectedVariationIndex + 1) % Math.max(1, aiVariations.length);
    setSelectedVariationIndex(nextIdx);
    const hookKeys = ['diskon', 'solusi', 'fomo', 'story', 'diskon'];
    if (hookKeys[nextIdx]) {
      setSelectedHookStyle(hookKeys[nextIdx]);
    }
  };

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
        setIsLeftPanelCollapsed(true);
        setIsRightPanelOpen(true);
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

  const handleSaveDraft = async () => {
    setIsPublishing(true);
    const draftCampaign: AdCampaign = {
      id: `draft-${Date.now()}`,
      name: `[Draft] ${selectedPlatform.toUpperCase()} - ${currentCreative.headline.substring(0, 30)}`,
      platform: selectedPlatform,
      objective: selectedObjective,
      status: 'paused',
      dailyBudget,
      spent: 0,
      clicks: 0,
      impressions: 0,
      leadsOrConversions: 0,
      cpc: 0,
      createdAt: new Date().toISOString().split('T')[0],
      creative: currentCreative,
    };
    setCampaigns((prev) => [draftCampaign, ...prev]);
    await saveCampaignDb(draftCampaign);
    setIsPublishing(false);
    setPublishSuccess(true);
    await fetchDatabaseState();
    setTimeout(() => setPublishSuccess(false), 3000);
  };

  const handlePostAd = async () => {
    await handlePublishCampaign();
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
    <div className="w-full h-full overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950 flex flex-col p-4 gap-3 text-slate-900 dark:text-zinc-100 font-sans">
      {/* Hidden File Input for Image Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Baris Header Tab (Studio Iklan AI, Sambungan API, Kempen Aktif) */}
      <div className="shrink-0 flex items-center justify-between">
        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 bg-slate-100/90 dark:bg-zinc-800/90 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'create'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Studio Iklan AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('connections')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'connections'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Sambungan API
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'campaigns'
                ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 font-semibold shadow-xs'
                : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200'
            }`}
          >
            Kempen Aktif ({campaigns.length})
          </button>
        </div>

        {/* Toolbar Kanan: AI Model & Action Buttons [Draft] [Post] */}
        <div className="flex items-center gap-2">
          {/* AI Model / Key Selector Quick Pill */}
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-slate-100/90 dark:bg-zinc-800/90 hover:bg-slate-200 dark:hover:bg-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 transition-colors shrink-0 cursor-pointer border border-slate-200/80 dark:border-zinc-700/80"
            title="Tetapan Model AI & Kunci API"
          >
            <Bot className="w-3.5 h-3.5 text-slate-500" />
            <span>{aiSource === 'groq' ? 'Groq Llama 3.3' : aiSource === 'gemini' ? 'Gemini 1.5' : 'OpenRouter'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Tombol Draft & Post (Muncul saat ada hasil generate) */}
          {studioStep === 'result' && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-zinc-800 animate-in fade-in duration-200">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isPublishing}
                className="h-8 px-3 text-xs font-medium bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-700 dark:text-zinc-200 hover:bg-slate-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              >
                <Bookmark className="w-3.5 h-3.5 text-slate-500" />
                <span>Draft</span>
              </button>

              <button
                type="button"
                onClick={handlePostAd}
                disabled={isPublishing}
                className="h-8 px-3.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isPublishing ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : publishSuccess ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Posted!</span>
                  </>
                ) : (
                  <span>Post</span>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ======================= TAB 1: STUDIO IKLAN AI ======================= */}
      {activeTab === 'create' && (
        <div className="flex-1 min-h-0 overflow-hidden flex items-stretch gap-4 relative animate-in fade-in">
          {/* SISI KIRI: PANEL KONTROL (Tanpa Kartu Putih, Langsung di Atas #f0f4f9) */}
          <div
            className={`flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out select-none ${
              isLeftPanelCollapsed
                ? 'w-0 opacity-0 overflow-hidden pointer-events-none'
                : 'w-[360px] xl:w-[400px] opacity-100'
            }`}
          >
            {/* Area Konten Form (Scroll Internal Mandiri) */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-2 pb-2 space-y-3.5">
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
                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors shrink-0 cursor-pointer"
                  >
                    Tetapkan Key
                  </button>
                </div>
              )}

              {/* 1. Saluran Pengiklanan */}
              <div className="space-y-2">
                <div className="text-xs font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
                  1. Saluran Pengiklanan
                </div>
                
                {/* 5 Tombol Platform SVG Asli */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                          isSelected
                            ? 'bg-white dark:bg-zinc-800 border-indigo-500 dark:border-indigo-500 shadow-xs ring-1 ring-indigo-500/20'
                            : 'bg-white/70 dark:bg-zinc-900/70 border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800'
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
            </div>

            {/* Kotak Input Melayang di Bawah (Struktur 2 Baris Anti-Himpit) */}
            <div className="shrink-0 pt-2 pb-0 w-full">
              <div
                className={`bg-white dark:bg-zinc-900 border border-slate-300/80 dark:border-zinc-700 shadow-sm flex flex-col gap-2 p-2.5 transition-all focus-within:border-slate-400 ${
                  customImage || activeDesign ? 'rounded-2xl' : 'rounded-full px-4 py-2.5'
                }`}
              >
                {/* Baris Atas: Tray Lampiran Produk (Hanya Muncul Jika Ada Produk Terpilih) */}
                {(customImage || activeDesign) && (
                  <div className="flex items-center gap-2 px-1 pt-0.5 overflow-x-auto">
                    <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-1.5 pr-2.5 max-w-full group">
                      {/* Thumbnail Gambar Produk */}
                      {customImage || activeDesign?.thumbnail_url || activeDesign?.mockup_front_url ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={customImage || activeDesign?.thumbnail_url || activeDesign?.mockup_front_url || '/images/prod_sportswear.jpg'}
                          alt={customTitle || activeDesign?.title || 'Produk'}
                          className="w-7 h-7 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-zinc-700"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                          PRD
                        </div>
                      )}

                      {/* Nama Produk */}
                      <span className="text-xs font-medium text-slate-700 dark:text-zinc-200 truncate max-w-[200px]">
                        {customTitle || activeDesign?.title}
                      </span>

                      {/* Tombol Hapus Lampiran */}
                      <button
                        type="button"
                        onClick={() => {
                          setCustomImage(null);
                          setCustomTitle(null);
                          setSelectedDesignId(null);
                        }}
                        className="w-4 h-4 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors ml-1 cursor-pointer"
                        title="Hapus lampiran"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Baris Bawah: Input Teks & Tombol Aksi (Lebar Penuh 100%) */}
                <div className="flex items-center gap-2 w-full">
                  {/* Tombol Lampiran (+) */}
                  <div className="relative shrink-0" ref={attachMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowAttachMenu(!showAttachMenu)}
                      className="text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors p-1 shrink-0 cursor-pointer"
                      title="Lampirkan Produk"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu for Attachment Choices */}
                    {showAttachMenu && (
                      <div className="absolute left-0 bottom-10 z-40 w-52 bg-white dark:bg-zinc-800 rounded-2xl p-1.5 shadow-xl border border-slate-100 dark:border-zinc-700 text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAttachMenu(false);
                            setShowCatalogModal(true);
                          }}
                          className="w-full px-3 py-2 rounded-xl flex items-center space-x-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700/50 text-slate-700 dark:text-zinc-200 transition-colors text-left cursor-pointer"
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
                          className="w-full px-3 py-2 rounded-xl flex items-center space-x-2.5 hover:bg-slate-50 dark:hover:bg-zinc-700/50 text-slate-700 dark:text-zinc-200 transition-colors text-left cursor-pointer"
                        >
                          <Upload className="w-4 h-4 text-slate-500" />
                          <span>Muat Naik Foto / Mockup</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Input Teks */}
                  <input
                    type="text"
                    value={userPrompt}
                    onChange={(e) => setUserPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && userPrompt.trim() && !isGeneratingAi) {
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
                    className="flex-1 bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-800 dark:text-zinc-100 placeholder:text-slate-400 focus:ring-0 p-0"
                  />

                  {/* Tombol Kirim Minimalis */}
                  <button
                    type="button"
                    onClick={handleGenerateAi}
                    disabled={isGeneratingAi || !userPrompt.trim()}
                    className="text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors p-1 shrink-0 cursor-pointer"
                    title="Kirim Arahan"
                  >
                    {isGeneratingAi ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <ArrowUp className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SISI KANAN: KARTU PANGGUNG UTAMA (The Floating Stage Card) */}
          <div
            className={`bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col h-full relative overflow-hidden transition-all duration-300 ease-in-out ${
              isLeftPanelCollapsed && !isRightPanelOpen
                ? 'flex-1 mr-64 xl:mr-72'
                : 'flex-1 mr-0'
            }`}
          >
            {/* Gagang Toggle Kapsul Sisi Kiri (Alternasi Panel Kiri & Kanan) */}
            <button
              type="button"
              onClick={() => {
                if (isLeftPanelCollapsed) {
                  // Saat panel kiri dibuka kembali:
                  setIsLeftPanelCollapsed(false);
                  setIsRightPanelOpen(false); // Tutup panel kanan agar tidak berdesakan
                } else {
                  // Saat panel kiri ditutup:
                  setIsLeftPanelCollapsed(true);
                  if (studioStep === 'result') {
                    setIsRightPanelOpen(true); // WAJIB BUKA KEMBALI PANEL KANAN jika ada iklan aktif!
                  }
                }
              }}
              title={isLeftPanelCollapsed ? 'Buka Panel Konfigurasi' : 'Sembunyikan Panel Konfigurasi'}
              className={`absolute left-[5px] top-1/2 -translate-y-1/2 h-12 rounded-full flex items-center justify-center cursor-pointer select-none z-40 transition-all duration-200 ease-out group p-0 border-0 outline-none origin-left ${
                isLeftPanelCollapsed
                  ? 'w-5 bg-[#f0f4f9] hover:bg-[#e2e7ee] dark:bg-zinc-700'
                  : 'w-1.5 hover:w-5 bg-[#f0f4f9] hover:bg-[#e2e7ee] dark:bg-zinc-700'
              }`}
            >
              <span
                className={`transition-opacity duration-150 flex items-center justify-center text-slate-500 dark:text-zinc-300 ${
                  isLeftPanelCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
              >
                {isLeftPanelCollapsed ? (
                  <ChevronRight className="w-3.5 h-3.5" />
                ) : (
                  <ChevronLeft className="w-3.5 h-3.5" />
                )}
              </span>
            </button>
            {/* Header Kanvas */}
            <div className="flex items-center justify-between px-6 py-3.5 border-b border-slate-100 dark:border-zinc-800 min-h-[56px] shrink-0 gap-3">
              {studioStep === 'result' ? (
                <>
                  {/* Sisi Kiri: Tab Format */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 p-1 rounded-xl shrink-0">
                    {[
                      { id: 'feed', label: 'Feed Post' },
                      { id: 'story', label: 'Stories' },
                      { id: 'reels', label: 'Reels / Video' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setAdFormat(fmt.id as 'feed' | 'story' | 'reels')}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                          adFormat === fmt.id
                            ? 'bg-white dark:bg-zinc-700 text-slate-800 dark:text-zinc-100 shadow-sm font-semibold'
                            : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>

                  {/* Sisi Kanan: Quick Platform Switcher & Salin Teks */}
                  <div className="flex items-center gap-3">
                    {/* Quick Platform Switcher: Ikon Bersih Tanpa Wadah Lingkaran Tebal */}
                    <div className="flex items-center gap-2">
                      {[
                        { id: 'facebook', name: 'Facebook', Icon: FacebookLogo },
                        { id: 'instagram', name: 'Instagram', Icon: InstagramLogo },
                        { id: 'google', name: 'Google Ads', Icon: GoogleAdsLogo },
                        { id: 'tiktok', name: 'TikTok Ads', Icon: TikTokLogo },
                        { id: 'whatsapp', name: 'WhatsApp', Icon: WhatsAppLogo },
                      ].map(({ id, name, Icon }) => {
                        const isActive = selectedPlatform === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSelectedPlatform(id as AdPlatform)}
                            title={`Alihkan ke ${name}`}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                              isActive
                                ? 'bg-slate-200/80 dark:bg-zinc-700 opacity-100'
                                : 'opacity-40 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>

                    {/* Tombol Aksi Salin Teks */}
                    <button
                      type="button"
                      onClick={handleCopyContent}
                      className="h-8 px-3 text-xs font-medium border border-slate-200 dark:border-zinc-700 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors flex items-center space-x-1.5 cursor-pointer text-slate-700 dark:text-zinc-300 shadow-2xs"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Disalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Salin Teks</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                /* State Awal Sebelum Generate: Header Bersih Kosong (Tanpa Tombol Prematur) */
                <div className="w-full flex items-center justify-between text-xs text-slate-400 dark:text-zinc-500 font-medium">
                  <span>Pratinjau Langsung</span>
                  <span className="text-[11px] text-slate-400/80 dark:text-zinc-500/80">Menunggu arahan...</span>
                </div>
              )}
            </div>

            {/* Area Kanvas Bersih */}
            <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
              {studioStep === 'prompt' ? (
                <div className="text-center space-y-2 max-w-sm">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-slate-400">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-zinc-200">
                    Kanvas Pratinjau Siap
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Pilih platform dan masukkan arahan di panel kiri untuk memvisualisasikan iklan di sini.
                  </p>
                </div>
              ) : (
                <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center py-2">
                  <AdPreviewCard
                    platform={selectedPlatform}
                    creative={currentCreative}
                    connectedAccount={platforms.find((p) => p.id === selectedPlatform)}
                    format={adFormat}
                  />
                </div>
              )}
            </div>
          </div>

          {/* SISI KANAN: PANEL SETELAN IKLAN & SASARAN */}
          {isRightPanelOpen && studioStep === 'result' && (
            <div className="w-72 xl:w-80 shrink-0 h-full flex flex-col justify-between p-4 bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm transition-all duration-300">
              <div className="space-y-5 overflow-y-auto pr-1">
                {/* Header Panel Kanan */}
                <div className="pb-2 border-b border-slate-100 dark:border-zinc-800">
                  <span className="text-xs font-semibold tracking-wider text-slate-500 dark:text-zinc-400 uppercase">
                    Setelan Iklan
                  </span>
                </div>

                {/* 1. Gaya Hook: MENGGUNAKAN COMBOBOX / DROPDOWN */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-zinc-400 block">
                    Gaya Copywriting (Hook)
                  </label>
                  <div className="relative">
                    <select
                      value={selectedHookStyle}
                      onChange={(e) => handleSelectHookStyle(e.target.value)}
                      className="w-full h-10 px-3 py-2 text-xs text-slate-700 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:border-slate-400 focus:bg-white dark:focus:bg-zinc-800 transition-all appearance-none cursor-pointer"
                    >
                      <option value="diskon">Tawaran & Diskaun Langsung</option>
                      <option value="fomo">Urgensi & Kouta Terhad (FOMO)</option>
                      <option value="story">Komuniti & Semangat Pasukan</option>
                      <option value="solusi">Kualiti Material & Ketahanan</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <ChevronDown className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>

                {/* 2. Sasaran Audiens (Dengan Ikon Pensil Edit) */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Sasaran Audiens</span>
                    <button
                      type="button"
                      onClick={() => setIsAudienceModalOpen(true)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                      title="Ubah Target Audiens"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50/70 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Demografi:</span>
                      <span className="font-medium text-slate-700 dark:text-zinc-200">18 - 35 thn</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Minat:</span>
                      <span className="font-medium text-slate-700 dark:text-zinc-200 truncate max-w-[140px]">
                        Futsal, Jersey, Sukan
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Wilayah:</span>
                      <span className="font-medium text-slate-700 dark:text-zinc-200">Malaysia (Semenanjung)</span>
                    </div>
                  </div>
                </div>

                {/* 3. Waktu Siaran Rekomendasi (Dengan Ikon Regenerate Putar) */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-zinc-400">Waktu Siaran Optimal</span>
                    <button
                      type="button"
                      onClick={() => handleRegenerateBestTime()}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
                      title="Cari rekomendasi waktu lain"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50/70 dark:bg-zinc-800/40 rounded-xl border border-slate-200/60 dark:border-zinc-700/60">
                    <div className="text-xs font-medium text-slate-700 dark:text-zinc-200 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{bestPostTime}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Anggaran Harian & Unjuran Ringkas */}
                <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-zinc-400">
                    <span>Bajet Harian</span>
                    <span className="font-semibold text-slate-800 dark:text-zinc-100">RM {dailyBudget}</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="200"
                    step="5"
                    value={dailyBudget}
                    onChange={(e) => setDailyBudget(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-slate-600"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 pt-0.5">
                    <span>Paparan: ~{(dailyBudget * 180).toLocaleString()}</span>
                    <span>WhatsApp: ~{Math.round(dailyBudget / 6.5)} prospek</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        {/* ======================= TAB 2: SAMBUNGAN AKAUN API ======================= */}
        {activeTab === 'connections' && (
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 animate-in fade-in">
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-600 dark:text-zinc-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <p className="font-semibold text-slate-900 dark:text-zinc-100 text-sm">Status Gerbang & Kawalan Pemasaran</p>
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Pangkalan Data Terpusat (Supabase)
                  </span>
                </div>
                <p className="text-slate-500 dark:text-zinc-400">
                  Data sambungan disimpan ke pelayan berpusat supaya semua komputer/admin boleh melihat status akaun dan metrik yang sama serta-merta.
                </p>
              </div>
              <div className="flex items-center space-x-3 shrink-0">
                <button
                  type="button"
                  onClick={fetchDatabaseState}
                  disabled={isSyncingDb}
                  className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 border border-slate-200 dark:border-zinc-700 text-xs font-medium text-slate-700 dark:text-zinc-300 transition-colors flex items-center space-x-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
                  title="Segerak status terkini dari Pangkalan Data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isSyncingDb ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDb ? 'Menyegerak...' : 'Segerak Pangkalan Data'}</span>
                </button>
                <div className="text-right">
                  <span className="font-semibold text-slate-900 dark:text-zinc-100">
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
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 animate-in fade-in">
            {/* KPI Summary Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 dark:border-zinc-800 text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase block">Jumlah Belanja</span>
                <span className="text-base font-semibold text-slate-900 dark:text-zinc-100 font-mono">
                  {formatCurrency(campaigns.reduce((acc, c) => acc + c.spent, 0))}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 dark:border-zinc-800 text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase block">Prospek WhatsApp Masuk</span>
                <span className="text-base font-semibold text-emerald-600 font-mono">
                  {campaigns.reduce((acc, c) => acc + c.leadsOrConversions, 0)} Orang
                </span>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 dark:border-zinc-800 text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase block">Purata Kos / Prospek</span>
                <span className="text-base font-semibold text-slate-900 dark:text-zinc-100 font-mono">
                  RM {(campaigns.reduce((acc, c) => acc + c.spent, 0) / Math.max(1, campaigns.reduce((acc, c) => acc + c.leadsOrConversions, 0))).toFixed(2)}
                </span>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-200/80 dark:border-zinc-800 text-center">
                <span className="text-[10px] text-slate-400 font-medium uppercase block">Status Keseluruhan</span>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mt-1 border border-emerald-100 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Berjalan Baik
                </span>
              </div>
            </div>

            {/* Campaigns Table with AI Evaluation Notes */}
            <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/80 dark:bg-zinc-800/80 text-slate-500 dark:text-zinc-400 text-xs font-medium border-b border-slate-100 dark:border-zinc-800">
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
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-sm">
                    {campaigns.map((camp) => (
                      <tr key={camp.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={camp.creative.imageUrl}
                                alt={camp.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="font-medium text-slate-800 dark:text-zinc-200 block text-xs">{camp.name}</span>
                              <span className="text-[11px] text-slate-400 dark:text-zinc-500 uppercase font-mono">
                                {camp.platform} · {camp.createdAt}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-600 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                            {camp.objective.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          {camp.status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full whitespace-nowrap border border-emerald-100 dark:border-emerald-800/60">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              Berjalan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full whitespace-nowrap">
                              Jeda
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-800 dark:text-zinc-200 text-xs whitespace-nowrap">
                          {formatCurrency(camp.dailyBudget)}/hari
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="text-xs space-y-0.5">
                            <span className="font-semibold text-emerald-600 font-mono block">
                              {camp.leadsOrConversions} Prospek WA
                            </span>
                            <span className="text-slate-400 dark:text-zinc-500 text-[11px] block">
                              {camp.clicks} klik • {camp.impressions.toLocaleString()} paparan
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-xs text-slate-600 dark:text-zinc-400 leading-snug">
                            {camp.evaluationNote || 'Kempen memaparkan respons stabil. Teruskan pemantauan baki kredit.'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleCampaignStatus(camp.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                              camp.status === 'active'
                                ? 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 border-slate-200 dark:border-zinc-700'
                                : 'text-slate-900 dark:text-zinc-100 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 border-slate-300 dark:border-zinc-600'
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

      {/* MODAL 3: AUDIENCE TARGET MODAL */}
      {isAudienceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 flex items-center justify-center border border-slate-200 dark:border-zinc-700">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-900 dark:text-zinc-100">Sasaran Audiens</h3>
                  <p className="text-xs text-slate-500">Konfigurasi segmen demografi dan minat.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAudienceModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 dark:text-zinc-400 font-medium block mb-1">Umur & Jantina</label>
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-200">
                  Lelaki & Wanita (18 - 35 tahun)
                </div>
              </div>
              <div>
                <label className="text-slate-600 dark:text-zinc-400 font-medium block mb-1">Minat Utama</label>
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-200">
                  Futsal, Bola Sepak, Jersey Sublimation, Sukan Komuniti
                </div>
              </div>
              <div>
                <label className="text-slate-600 dark:text-zinc-400 font-medium block mb-1">Wilayah / Geografi</label>
                <div className="p-2.5 bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 rounded-xl text-slate-700 dark:text-zinc-200">
                  Malaysia (Semenanjung, Sabah & Sarawak)
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAudienceModalOpen(false)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-slate-900 text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                Tutup & Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
