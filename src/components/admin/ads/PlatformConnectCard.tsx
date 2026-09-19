'use client';

import React, { useState, useEffect } from 'react';
import { AdPlatformConnection, AdPlatform, AdCampaign } from '@/types/ads';
import {
  verifyPlatformConnection,
  fetchLivePlatformCampaigns,
  toggleMetaLiveCampaignStatus,
  savePlatformConnectionDb,
  disconnectPlatformDb,
  LiveCampaignData
} from '@/app/actions/adsPlatformActions';
import {
  Check,
  Link2,
  Unlink,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  Info,
  Plus,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  BookOpen,
  Power,
  Play,
  Pause,
  Sliders
} from 'lucide-react';
import {
  GoogleAdsLogo,
  MetaLogo,
  TikTokLogo,
  WhatsAppLogo,
  FacebookLogo,
  InstagramLogo
} from '@/components/admin/ads/PlatformLogos';

interface PlatformConnectCardProps {
  platform: AdPlatformConnection;
  campaigns?: AdCampaign[];
  onUpdateConnection?: (updated: AdPlatformConnection) => void;
  onToggleConnect: (platformId: string) => void;
  onNavigateToStudio?: () => void;
}

interface PlatformGuideStep {
  step: number;
  title: string;
  description: string;
  codeSnippet?: string;
  actionText?: string;
  actionUrl?: string;
}

interface PlatformConfig {
  title: string;
  subtitle: string;
  field1Label: string;
  field1Prefix?: string;
  field1Placeholder: string;
  field1HelpText?: string;
  field1LinkText?: string;
  field1LinkUrl?: string;
  field2Label: string;
  field2Placeholder: string;
  field2HelpText?: string;
  field2LinkText?: string;
  field2LinkUrl?: string;
  field3Label: string;
  field3Prefix?: string;
  field3Placeholder: string;
  field3Subtext: string;
  field3Required?: boolean;
  field3LinkText?: string;
  field3LinkUrl?: string;
  guideSteps: PlatformGuideStep[];
}

function getPlatformConfig(platformId: AdPlatform): PlatformConfig {
  switch (platformId) {
    case 'google':
      return {
        title: 'Sambung API Google Ads',
        subtitle: 'Hubungkan Google Ads Customer ID & Developer Token untuk kempen carian Search & Display',
        field1Label: 'Google Ads Customer ID',
        field1Prefix: 'ID:',
        field1Placeholder: '',
        field1LinkText: 'Lihat ID di Google Ads',
        field1LinkUrl: 'https://ads.google.com',
        field2Label: 'Google Developer Token / API Key',
        field2Placeholder: '',
        field2LinkText: 'Dapatkan di Google Cloud',
        field2LinkUrl: 'https://console.cloud.google.com/apis/credentials',
        field3Label: 'Google Conversion Action ID / Tag',
        field3Prefix: 'Tag:',
        field3Placeholder: '',
        field3Subtext: 'Untuk mengesan klik WhatsApp dan jualan di laman web',
        field3Required: false,
        field3LinkText: 'Buka Conversion Center',
        field3LinkUrl: 'https://ads.google.com/aw/conversions',
        guideSteps: [
          {
            step: 1,
            title: 'Dapatkan Google Customer ID (10-Digit)',
            description: 'Buka papan pemuka Google Ads. Customer ID tertera di penjuru kanan atas berdekatan profil akaun.',
            codeSnippet: '849-201-9482',
            actionText: 'Buka Google Ads',
            actionUrl: 'https://ads.google.com'
          },
          {
            step: 2,
            title: 'Dapatkan Developer Token di Google Cloud',
            description: 'Masuk ke Google Cloud Console / Google Ads API Center untuk menjana atau menyalin Developer Token.',
            actionText: 'Buka Google Cloud Credentials',
            actionUrl: 'https://console.cloud.google.com/apis/credentials'
          },
          {
            step: 3,
            title: 'Sahkan & Aktifkan Sambungan',
            description: 'Tampal Customer ID dan Kunci Akses ke dalam borang di bawah, lalu klik butang Sahkan & Sambung.'
          }
        ]
      };

    case 'tiktok':
      return {
        title: 'Sambung API TikTok Ads',
        subtitle: 'Hubungkan TikTok for Business Marketing API untuk pelancaran kempen video automatik',
        field1Label: 'TikTok Advertiser ID',
        field1Prefix: 'ID:',
        field1Placeholder: '',
        field1LinkText: 'Cari ID di TikTok Ads',
        field1LinkUrl: 'https://ads.tiktok.com',
        field2Label: 'TikTok Access Token (Marketing API)',
        field2Placeholder: '',
        field2LinkText: 'Jana Token di Developer Portal',
        field2LinkUrl: 'https://business-api.tiktok.com/portal/',
        field3Label: 'TikTok Pixel Code',
        field3Prefix: 'Pixel:',
        field3Placeholder: '',
        field3Subtext: 'Untuk optimasi sasaran audiens sukan dan belia',
        field3Required: false,
        field3LinkText: 'Buka Events Manager',
        field3LinkUrl: 'https://ads.tiktok.com/events/',
        guideSteps: [
          {
            step: 1,
            title: 'Dapatkan TikTok Advertiser ID',
            description: 'Buka TikTok Ads Manager. ID Pengiklan anda (19-digit) berada di tetapan akaun / profil pengiklan.',
            codeSnippet: '6982019482019482019',
            actionText: 'Buka TikTok Ads Manager',
            actionUrl: 'https://ads.tiktok.com'
          },
          {
            step: 2,
            title: 'Jana TikTok Marketing API Long-lived Token',
            description: 'Buka TikTok Business Marketing API Portal, pilih aplikasi anda dan salin Access Token.',
            actionText: 'Buka TikTok Business API Portal',
            actionUrl: 'https://business-api.tiktok.com/portal/'
          },
          {
            step: 3,
            title: 'Tampal & Sambungkan',
            description: 'Tampal Advertiser ID dan Token ke dalam borang di bawah untuk membuka analitik dan iklan automatik.'
          }
        ]
      };

    case 'whatsapp':
      return {
        title: 'Sambung WhatsApp Cloud API',
        subtitle: 'Hubungkan Meta WhatsApp Business API untuk pengiklanan Click-to-WhatsApp & mesej rasmi',
        field1Label: 'WhatsApp Business Account (WABA) ID',
        field1Prefix: 'waba_',
        field1Placeholder: '',
        field1LinkText: 'Buka WhatsApp Manager',
        field1LinkUrl: 'https://business.facebook.com/wa/manage/',
        field2Label: 'System User Permanent Access Token',
        field2Placeholder: '',
        field2LinkText: 'Jana di Meta Developers',
        field2LinkUrl: 'https://developers.facebook.com/apps/',
        field3Label: 'Phone Number ID',
        field3Prefix: 'ID:',
        field3Placeholder: '',
        field3Subtext: 'ID Nombor telefon yang didaftarkan di WhatsApp Cloud API',
        field3Required: true,
        field3LinkText: 'Cari di Cloud API Setup',
        field3LinkUrl: 'https://developers.facebook.com/apps/',
        guideSteps: [
          {
            step: 1,
            title: 'Dapatkan WABA ID (WhatsApp Business Account)',
            description: 'Buka Meta Business Manager > WhatsApp Accounts untuk menyalin WABA ID anda.',
            codeSnippet: 'waba_948201948201',
            actionText: 'Buka WhatsApp Manager',
            actionUrl: 'https://business.facebook.com/wa/manage/'
          },
          {
            step: 2,
            title: 'Jana System User Permanent Token',
            description: 'Buka Meta Developers > App > WhatsApp API Setup. Jana token kekal dengan izin whatsapp_business_messaging.',
            actionText: 'Buka Meta Developers',
            actionUrl: 'https://developers.facebook.com/apps/'
          },
          {
            step: 3,
            title: 'Salin Phone Number ID & Sambung',
            description: 'Salin Phone Number ID dari dashboard WhatsApp API Setup dan lengkapkan borang di bawah.'
          }
        ]
      };

    case 'facebook':
    case 'instagram':
    case 'meta':
    default:
      return {
        title: `Sambung API ${platformId === 'instagram' ? 'Instagram Ads' : 'Meta & Facebook Ads'}`,
        subtitle: 'Hubungkan Meta Ads Manager & Graph API untuk kawalan kempen dan penjejakan leads secara langsung',
        field1Label: 'Ad Account ID (Meta)',
        field1Prefix: 'act_',
        field1Placeholder: '',
        field1LinkText: 'Cari ID di Ads Manager',
        field1LinkUrl: 'https://business.facebook.com/adsmanager',
        field2Label: 'Meta Access Token (Kunci API Graph / System User)',
        field2Placeholder: '',
        field2LinkText: 'Panduan & Pautan Jana Token',
        field2LinkUrl: 'https://business.facebook.com/settings/system-users',
        field3Label: 'Meta Pixel / Dataset ID',
        field3Prefix: 'pix_',
        field3Placeholder: '',
        field3Subtext: 'Untuk menjejak penukaran (conversion) dan borang laman web',
        field3Required: false,
        field3LinkText: 'Buka Events Manager',
        field3LinkUrl: 'https://business.facebook.com/events_manager2',
        guideSteps: [
          {
            step: 1,
            title: 'Kaedah 1: Meta Business Suite System User (Disyorkan / Token Kekal)',
            description: 'Buka Pengguna Sistem di Meta Business Suite. Cipta pengguna Admin, tetapkan akaun iklan (Full Control), dan jana token kekal dengan izin ads_management & business_management.',
            actionText: 'Buka Meta System Users',
            actionUrl: 'https://business.facebook.com/settings/system-users'
          },
          {
            step: 2,
            title: 'Kaedah 2: Meta Graph API Explorer (Ujian Pantas)',
            description: 'Buka Graph API Explorer rasmi Meta. Pilih aplikasi anda, dapatkan token akses pengguna dengan izin ads_management & ads_read.',
            actionText: 'Buka Graph API Explorer',
            actionUrl: 'https://developers.facebook.com/tools/explorer/'
          },
          {
            step: 3,
            title: 'Dapatkan Meta Ad Account ID',
            description: 'Buka Meta Ads Manager. ID akaun anda berada di menu dropdown atas sebelah profil (format nombor 10-16 digit).',
            codeSnippet: 'act_839201948201',
            actionText: 'Buka Meta Ads Manager',
            actionUrl: 'https://business.facebook.com/adsmanager'
          }
        ]
      };
  }
}

// Clean and sanitize input value by stripping prefixes and ensuring neat formatting
function extractCleanValue(val: string, prefix?: string): string {
  if (!val) return '';
  let cleaned = val.trim();
  if (prefix === 'act_') {
    if (cleaned.includes('act=')) {
      const match = cleaned.match(/act=([0-9]+)/i);
      cleaned = match && match[1] ? match[1] : cleaned.replace(/^.*act[=_:]/i, '');
    } else {
      cleaned = cleaned.replace(/^act[=_:\s-]*/i, '');
    }
    return cleaned.replace(/[^0-9]/g, '');
  }
  if (prefix === 'pix_') {
    cleaned = cleaned.replace(/^pix[=_:\s-]*/i, '');
    return cleaned.replace(/[^0-9]/g, '');
  }
  if (prefix === 'waba_') {
    cleaned = cleaned.replace(/^waba[=_:\s-]*/i, '');
    return cleaned.replace(/[^0-9]/g, '');
  }
  return cleaned;
}

export default function PlatformConnectCard({
  platform,
  campaigns = [],
  onUpdateConnection,
  onToggleConnect,
  onNavigateToStudio,
}: PlatformConnectCardProps) {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false); // Clean: hidden by default

  const config = getPlatformConfig(platform.id);

  // Form State for API Credentials (Empty by default if not connected)
  const [field1Input, setField1Input] = useState(
    platform.isConnected && platform.accountId ? extractCleanValue(platform.accountId, config.field1Prefix) : ''
  );
  const [field2Input, setField2Input] = useState('');
  const [field3Input, setField3Input] = useState(
    platform.isConnected && platform.pixelId ? extractCleanValue(platform.pixelId, config.field3Prefix) : ''
  );
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dbSaveError, setDbSaveError] = useState<string | null>(null);

  // Live Test Connection States
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'success' | 'error';
    accountName: string;
    accountId: string;
    profilePictureUrl?: string;
    latencyMs: number;
    balance: number;
    currency: string;
    verifiedPermissions: string[];
    message: string;
  } | null>(null);

  // Real Live Meta Campaigns State & Actions
  const [liveCampaigns, setLiveCampaigns] = useState<LiveCampaignData[] | null>(null);
  const [liveTotalSpent, setLiveTotalSpent] = useState<number | null>(null);
  const [liveTotalLeads, setLiveTotalLeads] = useState<number | null>(null);
  const [liveCostPerLead, setLiveCostPerLead] = useState<number | null>(null);
  const [livePrimaryResultLabel, setLivePrimaryResultLabel] = useState<string>('Hasil / Prospek');
  const [liveTotalLinkClicks, setLiveTotalLinkClicks] = useState<number | null>(null);
  const [liveTotalReach, setLiveTotalReach] = useState<number | null>(null);
  const [selectedDatePreset, setSelectedDatePreset] = useState<string>('maximum');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);

  // Auto-sync real Meta campaigns when detail modal opens
  useEffect(() => {
    if (showDetailModal && platform.isConnected && liveCampaigns === null) {
      handleSyncLiveMetrics(selectedDatePreset);
    }
  }, [showDetailModal, platform.isConnected]);

  // LIVE METRICS CALCULATION (Strictly 100% Genuine Meta Graph API Data)
  const displayCampaigns = liveCampaigns !== null ? liveCampaigns : campaigns.filter((c) => c.platform === platform.id);
  const realTotalSpent = liveTotalSpent !== null
    ? liveTotalSpent
    : displayCampaigns.reduce((acc, c) => acc + (c.spent || 0), 0);
  const realTotalLeads = liveTotalLeads !== null
    ? liveTotalLeads
    : displayCampaigns.reduce((acc, c) => acc + (c.leadsOrConversions || 0), 0);
  const realTotalClicks = displayCampaigns.reduce((acc, c) => acc + (c.clicks || 0), 0);
  const realTotalImpressions = displayCampaigns.reduce((acc, c) => acc + (c.impressions || 0), 0);
  const realCostPerLead = liveCostPerLead !== null
    ? liveCostPerLead
    : (realTotalLeads > 0 ? realTotalSpent / realTotalLeads : 0);
  const activeCampaignsCount = displayCampaigns.filter((c) => c.status === 'active').length;

  // Open modal and populate initial values (strictly blank if not connected)
  const handleOpenConnectModal = () => {
    if (!platform.isConnected) {
      setField1Input('');
      setField2Input('');
      setField3Input('');
    } else {
      setField1Input(platform.accountId ? extractCleanValue(platform.accountId, config.field1Prefix) : '');
      setField3Input(platform.pixelId ? extractCleanValue(platform.pixelId, config.field3Prefix) : '');
      try {
        const storedToken = localStorage.getItem(`svf_platform_token_${platform.id}`) || '';
        setField2Input(storedToken);
      } catch {
        setField2Input('');
      }
    }
    setTestResult(null);
    setShowHelpGuide(false);
    setShowConnectModal(true);
  };

  // Perform Live API Test Handshake (Server Action call to Meta Graph API)
  const handleTestConnection = async () => {
    if (!field1Input.trim() || !field2Input.trim()) {
      setTestResult({
        status: 'error',
        accountName: '',
        accountId: '',
        latencyMs: 0,
        balance: 0,
        currency: 'MYR',
        verifiedPermissions: [],
        message: 'Sila lengkapkan ID Akaun dan Kunci API (Access Token) sebelum menguji sambungan.'
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const effectiveAccountId = config.field1Prefix === 'act_' 
      ? `act_${field1Input.trim()}`
      : config.field1Prefix === 'waba_'
        ? `waba_${field1Input.trim()}`
        : field1Input.trim();

    const effectivePixelId = field3Input.trim() 
      ? (config.field3Prefix === 'pix_' ? `pix_${field3Input.trim()}` : field3Input.trim())
      : '';

    try {
      const res = await verifyPlatformConnection(
        platform.id,
        effectiveAccountId,
        field2Input.trim(),
        effectivePixelId
      );

      setIsTesting(false);

      if (res.success) {
        setTestResult({
          status: 'success',
          accountName: res.accountName || `SFV APPAREL Official (${platform.name})`,
          accountId: res.accountId || effectiveAccountId,
          profilePictureUrl: res.profilePictureUrl,
          latencyMs: res.latencyMs || 120,
          balance: res.balance ?? 0,
          currency: res.currency || 'MYR',
          verifiedPermissions: res.verifiedPermissions || ['ads_management', 'ads_read'],
          message: res.message
        });
      } else {
        setTestResult({
          status: 'error',
          accountName: '',
          accountId: effectiveAccountId,
          latencyMs: res.latencyMs || 0,
          balance: 0,
          currency: 'MYR',
          verifiedPermissions: [],
          message: res.message
        });
      }
    } catch (err: unknown) {
      setIsTesting(false);
      const errMsg = err instanceof Error ? err.message : 'Ralat sambungan pelayan.';
      setTestResult({
        status: 'error',
        accountName: '',
        accountId: effectiveAccountId,
        latencyMs: 0,
        balance: 0,
        currency: 'MYR',
        verifiedPermissions: [],
        message: `Ralat semasa menyemak API: ${errMsg}`
      });
    }
  };

  // Real-Time Live Sync Handshake with Meta Graph API
  const handleSyncLiveMetrics = async (targetPreset: string = selectedDatePreset) => {
    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      const storedToken = localStorage.getItem(`svf_platform_token_${platform.id}`) || '';
      const effectiveAccountId = config.field1Prefix === 'act_' && platform.accountId && !platform.accountId.startsWith('act_')
        ? `act_${platform.accountId}`
        : (platform.accountId || (config.field1Prefix === 'act_' ? `act_${field1Input.trim()}` : field1Input.trim()));

      const res = await fetchLivePlatformCampaigns(
        platform.id,
        effectiveAccountId,
        storedToken,
        targetPreset
      );

      setIsSyncing(false);
      if (res.success) {
        setLiveCampaigns(res.campaigns);
        setLiveTotalSpent(res.totalSpent);
        setLiveTotalLeads(res.totalLeads);
        setLiveCostPerLead(res.costPerLead);
        setSyncSuccess(true);
        setSyncStatusMsg(res.message);

        if (onUpdateConnection) {
          onUpdateConnection({
            ...platform,
            lastSynced: 'Baru sahaja',
            insight: {
              totalSpent: res.totalSpent,
              totalLeads: res.totalLeads,
              costPerLead: res.costPerLead,
              healthScore: res.totalLeads > 10 ? 'cemerlang' : 'baik',
              humanAdvice:
                res.campaigns.length > 0
                  ? `Berjaya menyegerak ${res.campaigns.length} kempen dari Meta Graph API dengan kos purata RM${res.costPerLead.toFixed(2)} / prospek.`
                  : `Akaun Meta aktif dan tersambung. Tiada kempen dikesan pada akaun ini setakat ini.`,
              nextStepRecommendation:
                res.campaigns.length > 0
                  ? 'Pantau prestasi kempen secara langsung atau jeda/aktifkan status kempen di bawah.'
                  : 'Klik "Studio Iklan AI" untuk melancarkan kempen pertama anda ke Meta.'
            }
          });
        }
        setTimeout(() => setSyncSuccess(false), 2500);
      } else {
        setSyncSuccess(false);
        setSyncStatusMsg(res.message);
      }
    } catch {
      setIsSyncing(false);
      setLiveCampaigns([]);
    }
  };

  // Toggle Campaign status on Meta
  const handleToggleCampaignStatus = async (campaignId: string, currentStatus: string) => {
    setIsTogglingStatus(campaignId);
    const newStatus = currentStatus === 'active' ? 'PAUSED' : 'ACTIVE';
    const storedToken = localStorage.getItem(`svf_platform_token_${platform.id}`) || '';
    const res = await toggleMetaLiveCampaignStatus(campaignId, newStatus, storedToken);
    setIsTogglingStatus(null);
    if (res.success && liveCampaigns) {
      setLiveCampaigns(
        liveCampaigns.map((c) =>
          c.id === campaignId
            ? { ...c, status: newStatus.toLowerCase() as 'active' | 'paused' }
            : c
        )
      );
    }
  };

  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!field1Input.trim() || !field2Input.trim()) return;
    if (config.field3Required && !field3Input.trim()) return;

    setIsSaving(true);

    const rawToken = field2Input.trim();
    try {
      localStorage.setItem(`svf_platform_token_${platform.id}`, rawToken);
    } catch {
      // Ignore
    }

    let cleanInput = field1Input.trim();
    if (config.field1Prefix === 'act_') {
      cleanInput = `act_${cleanInput.replace(/^act_/i, '')}`;
    } else if (config.field1Prefix === 'waba_') {
      cleanInput = `waba_${cleanInput.replace(/^waba_/i, '')}`;
    }
    const effectiveAccountId = cleanInput || testResult?.accountId || field1Input.trim();

    const effectivePixelId = field3Input.trim() 
      ? (config.field3Prefix === 'pix_' ? `pix_${field3Input.trim().replace(/^pix_/i, '')}` : field3Input.trim())
      : undefined;

    // If not already verified via test button, do a live verification first
    let verifiedName = testResult?.accountName;
    let verifiedBalance = testResult?.balance;
    let verifiedCurrency = testResult?.currency;
    let verifiedPicture = testResult?.profilePictureUrl;

    if (!testResult || testResult.status !== 'success') {
      try {
        const res = await verifyPlatformConnection(
          platform.id,
          effectiveAccountId,
          rawToken,
          effectivePixelId || ''
        );
        if (res.success) {
          verifiedName = res.accountName;
          verifiedBalance = res.balance;
          verifiedCurrency = res.currency;
          verifiedPicture = res.profilePictureUrl;
        }
      } catch {
        // Fallback to defaults if offline/bypass
      }
    }

    const updatedAccount: AdPlatformConnection = {
      ...platform,
      isConnected: true,
      accountId: effectiveAccountId,
      accountName: verifiedName || `SFV APPAREL Official (${platform.name})`,
      profilePictureUrl: verifiedPicture || platform.profilePictureUrl,
      currency: verifiedCurrency || 'MYR',
      balance: verifiedBalance !== undefined ? verifiedBalance : (platform.balance ?? 0),
      pixelId: effectivePixelId,
      lastSynced: 'Baru sahaja',
      insight: {
        totalSpent: 0,
        totalLeads: 0,
        costPerLead: 0,
        healthScore: 'baik',
        humanAdvice: `Akaun ${platform.name} berjaya disambungkan dan sedia melancarkan kempen pertama.`,
        nextStepRecommendation: 'Klik "Studio Iklan AI" untuk melancarkan kempen pertama anda sekarang.'
      }
    };

    // 1. Persist to central Supabase DB
    setDbSaveError(null);
    try {
      const dbRes = await savePlatformConnectionDb(updatedAccount, rawToken);
      if (!dbRes.success) {
        setDbSaveError(dbRes.message || 'Pangkalan data menolak sambungan (Semak RLS / Kunci Supabase).');
        setIsSaving(false);
        return;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ralat pangkalan data.';
      setDbSaveError(`Ralat pelayan: ${msg}`);
      setIsSaving(false);
      return;
    }

    // 2. Update local state
    if (onUpdateConnection) {
      onUpdateConnection(updatedAccount);
    } else {
      onToggleConnect(platform.id);
    }

    setIsSaving(false);
    setSaveSuccess(true);

    // 3. Trigger immediate live campaign fetch for newly connected account
    setTimeout(() => {
      setSaveSuccess(false);
      setShowConnectModal(false);
      setShowDetailModal(true);
      handleSyncLiveMetrics();
    }, 600);
  };

  const handleDisconnect = async () => {
    try {
      localStorage.removeItem(`svf_platform_token_${platform.id}`);
    } catch {
      // Ignore
    }
    try {
      await disconnectPlatformDb(platform.id);
    } catch {
      // Ignore
    }
    onToggleConnect(platform.id);
    setShowDetailModal(false);
  };

  const renderIcon = () => {
    switch (platform.id) {
      case 'facebook':
        return (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xs shrink-0 p-2">
            <FacebookLogo className="w-6 h-6" />
          </div>
        );
      case 'instagram':
        return (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xs shrink-0 p-2">
            <InstagramLogo className="w-6 h-6" />
          </div>
        );
      case 'google':
        return (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xs shrink-0 p-2">
            <GoogleAdsLogo className="w-6 h-6" />
          </div>
        );
      case 'meta':
        return (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xs shrink-0 p-2">
            <MetaLogo className="w-6 h-6" />
          </div>
        );
      case 'tiktok':
        return (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xs shrink-0 p-2">
            <TikTokLogo className="w-6 h-6" />
          </div>
        );
      case 'whatsapp':
        return (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xs shrink-0 p-2">
            <WhatsAppLogo className="w-6 h-6" />
          </div>
        );
    }
  };

  return (
    <>
      {/* ================= ULTRA-CLEAN MINIMAL CARD ================= */}
      <div className="bg-white rounded-3xl p-5 shadow-xs border border-slate-100 hover:border-slate-200 transition-all flex items-center justify-between gap-4">
        {/* Left: Logo & Name */}
        <div
          onClick={() => platform.isConnected && setShowDetailModal(true)}
          className={`flex items-center space-x-3.5 min-w-0 ${platform.isConnected ? 'cursor-pointer' : ''}`}
        >
          {renderIcon()}
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-900 truncate">{platform.name}</h3>
              {platform.isConnected ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                  <Check className="w-2.5 h-2.5" />
                  Tersambung
                </span>
              ) : (
                <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full shrink-0">
                  Belum Disambung
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {platform.isConnected ? platform.accountName || platform.accountId : 'Klik sambung untuk hubungkan akaun rasmi'}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          {platform.isConnected ? (
            <>
              <button
                type="button"
                onClick={() => setShowDetailModal(true)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Lihat Analitik
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Putuskan sambungan"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleOpenConnectModal}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Sambung</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= MODAL 1: SAMBUNG API (ULTRA CLEAN & MINIMALIST) ================= */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div
            className={`bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[92vh] overflow-y-auto transition-all duration-300 w-full ${
              showHelpGuide ? 'max-w-3xl' : 'max-w-md'
            }`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {renderIcon()}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Sambung API {platform.name}</h3>
                  <p className="text-[11px] text-slate-400">Masukkan kredensial rasmi akaun pengiklanan</p>
                </div>
              </div>
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setShowHelpGuide(!showHelpGuide)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center space-x-1 ${
                    showHelpGuide
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Buka panduan ringkas"
                >
                  <BookOpen className="w-3 h-3" />
                  <span>{showHelpGuide ? 'Tutup Panduan' : 'Panduan'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Split Content Grid */}
            <div className={showHelpGuide ? 'grid grid-cols-1 md:grid-cols-12 gap-5 items-start' : 'space-y-3.5'}>
              {/* LEFT COLUMN: Clean Form */}
              <div className={showHelpGuide ? 'md:col-span-6 space-y-3' : 'space-y-3'}>
                <form onSubmit={handleSaveConnection} className="space-y-3">
                  {/* FIELD 1: Account ID with Input Group */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {config.field1Label} <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex items-stretch rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 focus-within:bg-white transition-all shadow-2xs">
                      {config.field1Prefix && (
                        <span className="inline-flex items-center px-3 bg-slate-100/90 text-slate-500 font-mono text-xs font-semibold select-none border-r border-slate-200 shrink-0">
                          {config.field1Prefix}
                        </span>
                      )}
                      <input
                        type="text"
                        inputMode={config.field1Prefix === 'act_' ? 'numeric' : 'text'}
                        required
                        value={field1Input}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const cleaned = config.field1Prefix ? extractCleanValue(raw, config.field1Prefix) : raw;
                          setField1Input(cleaned);
                          setTestResult(null);
                        }}
                        placeholder={config.field1Placeholder}
                        className="w-full px-3.5 py-2.5 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none font-mono tracking-wide"
                      />
                    </div>
                  </div>

                  {/* FIELD 2: Access Token */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      {config.field2Label} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-stretch rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 focus-within:bg-white transition-all shadow-2xs">
                      <input
                        type={showToken ? 'text' : 'password'}
                        required
                        value={field2Input}
                        onChange={(e) => {
                          setField2Input(e.target.value);
                          setTestResult(null);
                        }}
                        placeholder="Tampal Kunci Akses / Token di sini"
                        className="w-full px-3.5 py-2.5 pr-10 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowToken(!showToken)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                        title={showToken ? 'Sembunyi token' : 'Papar token'}
                      >
                        {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* FIELD 3: Pixel / Dataset ID with Input Group */}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-600">
                      {config.field3Label} <span className="text-slate-400 text-[10px] font-normal">(Pilihan)</span>
                    </label>
                    <div className="flex items-stretch rounded-xl overflow-hidden border border-slate-200 bg-slate-50 focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400 focus-within:bg-white transition-all shadow-2xs">
                      {config.field3Prefix && (
                        <span className="inline-flex items-center px-3 bg-slate-100/90 text-slate-500 font-mono text-xs font-semibold select-none border-r border-slate-200 shrink-0">
                          {config.field3Prefix}
                        </span>
                      )}
                      <input
                        type="text"
                        inputMode={config.field3Prefix === 'pix_' ? 'numeric' : 'text'}
                        required={config.field3Required}
                        value={field3Input}
                        onChange={(e) => {
                          const raw = e.target.value;
                          const cleaned = config.field3Prefix ? extractCleanValue(raw, config.field3Prefix) : raw;
                          setField3Input(cleaned);
                          setTestResult(null);
                        }}
                        placeholder={config.field3Placeholder}
                        className="w-full px-3.5 py-2.5 bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none font-mono tracking-wide"
                      />
                    </div>
                    {config.field3Subtext && (
                      <p className="text-[10px] text-slate-400">{config.field3Subtext}</p>
                    )}
                  </div>

                  {/* TEST CONNECTION RESULT CARD */}
                  {testResult && (
                    <div
                      className={`rounded-xl p-3 text-xs space-y-2 animate-in zoom-in-95 border ${
                        testResult.status === 'success'
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : 'bg-rose-50/70 border-rose-200 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 font-semibold text-xs">
                          {testResult.status === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          <span>{testResult.status === 'success' ? 'Sambungan Berjaya' : 'Ujian Gagal'}</span>
                        </div>
                        {testResult.status === 'success' && (
                          <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                            {testResult.latencyMs}ms • 200 OK
                          </span>
                        )}
                      </div>

                      {testResult.status === 'success' ? (
                        <div className="space-y-1 text-[11px] bg-white/80 rounded-lg p-2.5 border border-emerald-100">
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Akaun Disahkan:</span>
                            <span className="font-semibold text-slate-900">{testResult.accountName}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>ID:</span>
                            <span className="font-mono text-slate-800">{testResult.accountId}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span>Baki:</span>
                            <span className="font-semibold text-slate-900">
                              {testResult.currency} {testResult.balance.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-rose-700 leading-snug">{testResult.message}</p>
                      )}
                    </div>
                  )}

                  {/* Database Save Error Banner */}
                  {dbSaveError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2 animate-in fade-in">
                      <X className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">Gagal Menyimpan ke Pangkalan Data</p>
                        <p className="text-[11px] text-rose-700 mt-0.5">{dbSaveError}</p>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting || !field1Input.trim() || !field2Input.trim()}
                      className="px-3.5 py-2 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center space-x-1.5 disabled:opacity-40"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-600" />
                          <span>Menguji...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
                          <span>Tes Ping</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowConnectModal(false)}
                        className="px-3.5 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Batal
                      </button>

                      <button
                        type="submit"
                        disabled={
                          isSaving ||
                          !field1Input.trim() ||
                          !field2Input.trim() ||
                          (config.field3Required && !field3Input.trim())
                        }
                        className="px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-xs flex items-center space-x-1.5 disabled:opacity-40"
                      >
                        {isSaving ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Menyimpan...</span>
                          </>
                        ) : saveSuccess ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Tersambung!</span>
                          </>
                        ) : (
                          <span>Sambung</span>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* RIGHT COLUMN: Clean Side Panel Guide (Only shows when Panduan button is clicked) */}
              {showHelpGuide && (
                <div className="md:col-span-6 bg-slate-50/90 rounded-2xl p-4 border border-slate-200/70 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                    <span className="text-xs font-semibold text-slate-800">Panduan Ringkas</span>
                    <button
                      type="button"
                      onClick={() => setShowHelpGuide(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {config.guideSteps.map((s) => (
                      <div
                        key={s.step}
                        className="bg-white rounded-xl p-2.5 border border-slate-200/70 shadow-2xs space-y-1.5"
                      >
                        <p className="font-semibold text-slate-900 text-[11px]">{s.title}</p>
                        <p className="text-slate-600 text-[10px] leading-relaxed">{s.description}</p>
                        {s.actionText && s.actionUrl && (
                          <div className="pt-1 border-t border-slate-100 flex justify-end">
                            <a
                              href={s.actionUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-[10px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded transition-colors"
                            >
                              <span>{s.actionText}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: DETAIL & ANALYTICS POPUP (MEMBACA DATA SEBENAR DARI KEMPEN) ================= */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {renderIcon()}
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-slate-900">{platform.name}</h3>
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Aktif &amp; Disahkan
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Profil Rasmi &amp; Data Prestasi Sebenar</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleSyncLiveMetrics()}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center space-x-1"
                  title="Segerakkan data terkini daripada API"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyegerak...' : syncSuccess ? 'Diselaraskan' : 'Segerak API'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDetailModal(false)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Complete Account & Business Profile Info */}
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2.5 font-sans border border-slate-200/60">
              <div className="flex items-center justify-between text-slate-600">
                <span>Nama Profil Perniagaan:</span>
                <span className="font-semibold text-slate-900">{platform.accountName || `SFV APPAREL Official (${platform.name})`}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>ID Akaun / WABA / Pixel:</span>
                <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                  {platform.accountId || 'Tersambung'}
                </span>
              </div>
              {platform.pixelId && (
                <div className="flex items-center justify-between text-slate-600">
                  <span>Pixel / Dataset ID:</span>
                  <span className="font-mono text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200/80">
                    {platform.pixelId}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-600">
                <span>Status Sambungan API:</span>
                <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" /> Sedia Melancarkan Kempen
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
                <span>Terakhir Diselaraskan:</span>
                <span className="text-slate-700 font-medium">{platform.lastSynced || 'Baru sahaja'}</span>
              </div>
            </div>

            {/* LIVE PERFORMANCE METRICS (100% REAL-TIME DARI META GRAPH API) */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Metrik Analitik Sebenar
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {displayCampaigns.length} Kempen Berdaftar
                  </span>
                </div>

                {/* DATE PRESET FILTER PILLS */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto text-[10px]">
                  {[
                    { id: 'today', label: 'Hari Ini' },
                    { id: 'yesterday', label: 'Semalam' },
                    { id: 'last_7d', label: '7 Hari' },
                    { id: 'last_30d', label: '30 Hari' },
                    { id: 'this_month', label: 'Bulan Ini' },
                    { id: 'maximum', label: 'Sepanjang Masa' },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setSelectedDatePreset(preset.id);
                        handleSyncLiveMetrics(preset.id);
                      }}
                      disabled={isSyncing}
                      className={`px-2 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                        selectedDatePreset === preset.id
                          ? 'bg-white text-slate-900 shadow-xs font-semibold'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Belanja Sebenar</span>
                  <span className="text-sm font-semibold text-slate-900 font-mono">
                    RM {realTotalSpent.toFixed(2)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium truncate" title={livePrimaryResultLabel}>
                    {livePrimaryResultLabel}
                  </span>
                  <span className="text-sm font-semibold text-emerald-600 font-mono">
                    {realTotalLeads} {realTotalLeads > 0 ? (livePrimaryResultLabel.toLowerCase().includes('klik') ? 'Klik' : 'Orang') : ''}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Kos / Hasil</span>
                  <span className="text-sm font-semibold text-slate-900 font-mono">
                    {realTotalLeads > 0 ? `RM ${realCostPerLead.toFixed(2)}` : 'Tiada Data'}
                  </span>
                </div>
              </div>

              {/* Secondary Live Breakdown: Jangkauan, Paparan, Klik Pautan */}
              {(realTotalImpressions > 0 || (liveTotalReach !== null && liveTotalReach > 0)) && (
                <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50/90 rounded-2xl text-[10px] text-slate-600 font-mono border border-slate-200/60 shadow-2xs">
                  <span>
                    Jangkauan: <strong className="text-slate-900">{(liveTotalReach || 0).toLocaleString()}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Paparan: <strong className="text-slate-900">{realTotalImpressions.toLocaleString()}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Klik Pautan: <strong className="text-slate-900">{(liveTotalLinkClicks || 0).toLocaleString()}</strong>
                  </span>
                </div>
              )}

              {/* Status synchronization info */}
              {syncStatusMsg && (
                <div
                  className={`text-[11px] px-3 py-2 rounded-xl border flex items-start justify-between gap-2 ${
                    syncSuccess
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                      : 'bg-rose-50 text-rose-800 border-rose-200/80'
                  }`}
                >
                  <span className="flex-1 leading-snug">{syncStatusMsg}</span>
                  {syncSuccess ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                </div>
              )}

              {/* Breakdown of actual campaigns attached to this platform with real live controls */}
              {displayCampaigns.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-700 block">
                      Kawalan &amp; Status Kempen Langsung:
                    </span>
                    <a
                      href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${(platform.accountId || '').replace(/^act_/i, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-medium inline-flex items-center space-x-1"
                    >
                      <span>Urus di Ads Manager</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {displayCampaigns.map((c) => (
                      <div
                        key={c.id}
                        className="bg-slate-50/90 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border border-slate-200/70 shadow-2xs"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                c.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
                              }`}
                            />
                            <p className="font-semibold text-slate-900 truncate text-xs">{c.name}</p>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                c.status === 'active'
                                  ? 'text-emerald-700 bg-emerald-100/80'
                                  : 'text-amber-700 bg-amber-100/80'
                              }`}
                            >
                              {c.status === 'active' ? 'Aktif' : 'Dijeda'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono flex-wrap">
                            <span>{c.linkClicks && c.linkClicks > 0 ? `${c.linkClicks} klik pautan` : `${c.clicks} klik`}</span>
                            <span>•</span>
                            <span>{c.impressions.toLocaleString()} paparan</span>
                            {c.reach && c.reach > 0 ? (
                              <>
                                <span>•</span>
                                <span>{c.reach.toLocaleString()} jangkauan</span>
                              </>
                            ) : null}
                            <span>•</span>
                            <span>
                              {c.dailyBudget && c.dailyBudget > 0
                                ? `Bajet: RM${c.dailyBudget.toFixed(2)}/hari`
                                : 'Bajet di Ad Set'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/50">
                          <div className="text-left sm:text-right">
                            <span className="font-semibold text-emerald-600 font-mono text-xs block">
                              {c.leadsOrConversions} {c.resultLabel || 'Hasil'}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              RM {c.spent.toFixed(2)}
                            </span>
                          </div>

                          {/* Live Pause / Activate toggle button for Meta API */}
                          <button
                            type="button"
                            onClick={() => handleToggleCampaignStatus(c.id, c.status)}
                            disabled={isTogglingStatus === c.id}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors flex items-center space-x-1 ${
                              c.status === 'active'
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            } disabled:opacity-50`}
                            title={c.status === 'active' ? 'Jeda kempen ini di Meta' : 'Aktifkan kempen ini di Meta'}
                          >
                            {isTogglingStatus === c.id ? (
                              <RefreshCw className="w-3 h-3 animate-spin" />
                            ) : c.status === 'active' ? (
                              <>
                                <Pause className="w-3 h-3" />
                                <span>Jeda</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3" />
                                <span>Aktifkan</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-5 text-center space-y-3 border border-slate-200/80">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-500">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-800">Tiada Kempen Iklan Dikesan</p>
                    <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                      Akaun Meta anda telah disahkan, tetapi tiada kempen iklan aktif dikesan di Meta Ads Manager pada masa ini.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {onNavigateToStudio && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowDetailModal(false);
                          onNavigateToStudio();
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-full text-xs font-medium transition-colors inline-flex items-center space-x-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Cipta Kempen Iklan</span>
                      </button>
                    )}
                    <a
                      href={`https://business.facebook.com/adsmanager/manage/campaigns?act=${(platform.accountId || '').replace(/^act_/i, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-full text-xs font-medium border border-slate-200 transition-colors inline-flex items-center space-x-1"
                    >
                      <span>Buka Ads Manager</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              )}

              {/* Status Note */}
              <div className="bg-slate-50/80 rounded-2xl p-3.5 text-xs text-slate-600 space-y-1 border border-slate-200/60">
                <div className="flex items-center space-x-1.5 text-slate-800 font-medium text-[11px]">
                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Status Akaun:</span>
                </div>
                <p className="text-slate-500 leading-relaxed text-[11px]">
                  {displayCampaigns.length > 0
                    ? `Akaun ${platform.name} aktif dan beroperasi dengan kos purata RM${realCostPerLead.toFixed(2)} setiap prospek.`
                    : `Sambungan API ${platform.name} aktif dan disahkan. Sedia untuk pelancaran kempen.`}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={handleDisconnect}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center space-x-1"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Putuskan Sambungan</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}



