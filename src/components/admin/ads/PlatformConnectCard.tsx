'use client';

import React, { useState } from 'react';
import { AdPlatformConnection, AdPlatform } from '@/types/ads';
import {
  Check,
  Link2,
  Unlink,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  BookOpen
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
  onUpdateConnection?: (updated: AdPlatformConnection) => void;
  onToggleConnect: (platformId: string) => void;
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
        field1Placeholder: 'Contoh: 849-201-9482',
        field1LinkText: 'Lihat ID di Google Ads',
        field1LinkUrl: 'https://ads.google.com',
        field2Label: 'Google Developer Token / API Key',
        field2Placeholder: 'Contoh: AIzaSy... / Developer Token',
        field2LinkText: 'Dapatkan di Google Cloud',
        field2LinkUrl: 'https://console.cloud.google.com/apis/credentials',
        field3Label: 'Google Conversion Action ID / Tag',
        field3Placeholder: 'Contoh: AW-920194820/abc123XYZ',
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
        field1Placeholder: 'Contoh: 6982019482019482019',
        field1LinkText: 'Cari ID di TikTok Ads',
        field1LinkUrl: 'https://ads.tiktok.com',
        field2Label: 'TikTok Access Token (Marketing API)',
        field2Placeholder: 'Contoh: act.tiktok.92a8b3c...',
        field2LinkText: 'Jana Token di Developer Portal',
        field2LinkUrl: 'https://business-api.tiktok.com/portal/',
        field3Label: 'TikTok Pixel Code',
        field3Placeholder: 'Contoh: C8ABCDE12345FG678',
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
        field1Placeholder: 'Contoh: 948201948201 atau waba_948201948201',
        field1LinkText: 'Buka WhatsApp Manager',
        field1LinkUrl: 'https://business.facebook.com/wa/manage/',
        field2Label: 'System User Permanent Access Token',
        field2Placeholder: 'EAAG... (Token Kekal Meta WhatsApp)',
        field2LinkText: 'Jana di Meta Developers',
        field2LinkUrl: 'https://developers.facebook.com/apps/',
        field3Label: 'Phone Number ID',
        field3Placeholder: 'Contoh: 104829104829104',
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
        field1Placeholder: 'Contoh: act_839201948201 atau 839201948201',
        field1LinkText: 'Cari ID di Ads Manager',
        field1LinkUrl: 'https://business.facebook.com/adsmanager',
        field2Label: 'Meta Access Token (Kunci API Graph / System User)',
        field2Placeholder: 'EAAG... (Tampal Token Meta anda di sini)',
        field2LinkText: 'Jana Token di Graph Explorer',
        field2LinkUrl: 'https://developers.facebook.com/tools/explorer/',
        field3Label: 'Meta Pixel / Dataset ID',
        field3Placeholder: 'Contoh: 920194820192',
        field3Subtext: 'Untuk menjejak penukaran (conversion) dan borang laman web',
        field3Required: false,
        field3LinkText: 'Buka Events Manager',
        field3LinkUrl: 'https://business.facebook.com/events_manager2',
        guideSteps: [
          {
            step: 1,
            title: 'Dapatkan Meta Ad Account ID',
            description: 'Buka Meta Ads Manager. ID akaun anda berada di menu dropdown atas sebelah profil.',
            codeSnippet: 'act_839201948201',
            actionText: 'Buka Meta Ads Manager',
            actionUrl: 'https://business.facebook.com/adsmanager'
          },
          {
            step: 2,
            title: 'Jana Meta Access Token',
            description: 'Buka Graph API Explorer rasmi Meta. Tanda kebenaran ads_management & ads_read, lalu klik Generate Token.',
            actionText: 'Buka Graph API Explorer',
            actionUrl: 'https://developers.facebook.com/tools/explorer/'
          },
          {
            step: 3,
            title: 'Tampal & Sahkan Sambungan',
            description: 'Tampal ID Akaun dan Token ke dalam borang di bawah, kemudian klik Sahkan & Sambung.'
          }
        ]
      };
  }
}

export default function PlatformConnectCard({
  platform,
  onUpdateConnection,
  onToggleConnect,
}: PlatformConnectCardProps) {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false); // Clean: hidden by default

  // Form State for API Credentials
  const [field1Input, setField1Input] = useState(platform.accountId || '');
  const [field2Input, setField2Input] = useState('');
  const [field3Input, setField3Input] = useState(platform.pixelId || '');
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const config = getPlatformConfig(platform.id);

  // Open modal and populate initial values (including from localStorage)
  const handleOpenConnectModal = () => {
    setField1Input(platform.accountId || '');
    setField3Input(platform.pixelId || '');
    try {
      const storedToken = localStorage.getItem(`svf_platform_token_${platform.id}`) || '';
      setField2Input(storedToken);
    } catch {
      setField2Input('');
    }
    setShowHelpGuide(false);
    setShowConnectModal(true);
  };

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!field1Input.trim() || !field2Input.trim()) return;
    if (config.field3Required && !field3Input.trim()) return;

    setIsSaving(true);

    try {
      localStorage.setItem(`svf_platform_token_${platform.id}`, field2Input.trim());
    } catch {
      // Ignore
    }

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);

      const updatedAccount: AdPlatformConnection = {
        ...platform,
        isConnected: true,
        accountId: field1Input.trim(),
        accountName: platform.accountName || `SFV APPAREL (${platform.name})`,
        currency: 'MYR',
        balance: platform.balance ?? 450.00,
        pixelId: field3Input.trim() || undefined,
        lastSynced: 'Baru sahaja',
        insight: platform.insight || {
          totalSpent: 310.00,
          totalLeads: 62,
          costPerLead: 5.00,
          healthScore: 'cemerlang',
          humanAdvice: `Akaun ${platform.name} berjaya disambungkan dan sedia melancarkan kempen iklan.`,
          nextStepRecommendation: 'Gunakan AI Ads Generator untuk melancarkan kempen pertama anda.'
        }
      };

      if (onUpdateConnection) {
        onUpdateConnection(updatedAccount);
      } else {
        onToggleConnect(platform.id);
      }

      setTimeout(() => {
        setSaveSuccess(false);
        setShowConnectModal(false);
      }, 800);
    }, 600);
  };

  const handleDisconnect = () => {
    try {
      localStorage.removeItem(`svf_platform_token_${platform.id}`);
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

  const insight = platform.insight;

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

      {/* ================= MODAL 1: SAMBUNG API CLEAN & MINIMALIST (TANPA POLUSI WARNA) ================= */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {renderIcon()}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{config.title}</h3>
                  <p className="text-xs text-slate-400">{config.subtitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TOGGLEABLE CLEAN GUIDE ACCORDION (TERSEMBUNYI SECARA DEFAULT) */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowHelpGuide(!showHelpGuide)}
                className="inline-flex items-center space-x-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors py-0.5"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showHelpGuide ? 'Sembunyikan Petunjuk Sambungan' : 'Lihat Petunjuk & Cara Dapatkan Kunci API'}</span>
                {showHelpGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showHelpGuide && (
                <div className="bg-slate-50 rounded-2xl p-4 space-y-3 text-xs text-slate-600 border border-slate-200/60 animate-in fade-in">
                  {config.guideSteps.map((s) => (
                    <div key={s.step} className="flex items-start space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {s.step}
                      </span>
                      <div className="space-y-1">
                        <p className="text-slate-800 font-medium">{s.title}</p>
                        <p className="text-slate-500 text-[11px] leading-relaxed">
                          {s.description}
                          {s.codeSnippet && (
                            <> (format: <code className="text-slate-800 font-mono font-semibold">{s.codeSnippet}</code>)</>
                          )}
                        </p>
                        {s.actionText && s.actionUrl && (
                          <a
                            href={s.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs hover:bg-slate-50 transition-colors mt-0.5"
                          >
                            <span>{s.actionText}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Minimal Form */}
            <form onSubmit={handleSaveConnection} className="space-y-3.5 pt-1">
              {/* FIELD 1 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    {config.field1Label} <span className="text-rose-500">*</span>
                  </label>
                  {config.field1LinkText && config.field1LinkUrl && (
                    <a
                      href={config.field1LinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-500 hover:text-slate-900 font-medium inline-flex items-center space-x-1"
                    >
                      <span>{config.field1LinkText}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <input
                  type="text"
                  required
                  value={field1Input}
                  onChange={(e) => setField1Input(e.target.value)}
                  placeholder={config.field1Placeholder}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 text-xs text-slate-800 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>

              {/* FIELD 2 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    {config.field2Label} <span className="text-rose-500">*</span>
                  </label>
                  {config.field2LinkText && config.field2LinkUrl && (
                    <a
                      href={config.field2LinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-500 hover:text-slate-900 font-medium inline-flex items-center space-x-1"
                    >
                      <span>{config.field2LinkText}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    required
                    value={field2Input}
                    onChange={(e) => setField2Input(e.target.value)}
                    placeholder={config.field2Placeholder}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-2xl bg-slate-50 text-xs text-slate-800 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
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

              {/* FIELD 3 */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    {config.field3Label}{' '}
                    {config.field3Required ? (
                      <span className="text-rose-500">*</span>
                    ) : (
                      <span className="text-slate-400 font-normal">(Pilihan)</span>
                    )}
                  </label>
                  {config.field3LinkText && config.field3LinkUrl && (
                    <a
                      href={config.field3LinkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-slate-500 hover:text-slate-900 font-medium inline-flex items-center space-x-1"
                    >
                      <span>{config.field3LinkText}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <input
                  type="text"
                  required={config.field3Required}
                  value={field3Input}
                  onChange={(e) => setField3Input(e.target.value)}
                  placeholder={config.field3Placeholder}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 text-xs text-slate-800 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
                <p className="text-[10px] text-slate-400">{config.field3Subtext}</p>
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Kredensial disimpan secara setempat untuk melancarkan kempen anda.</span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2.5">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
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
                  className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-xs flex items-center space-x-2 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersimpan!</span>
                    </>
                  ) : (
                    <span>Simpan &amp; Sambung Akaun</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: DETAIL & ANALYTICS POPUP ================= */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {renderIcon()}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">{platform.name}</h3>
                  <p className="text-xs text-slate-400">Akaun Rasmi & Data Prestasi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Account Info */}
            <div className="bg-slate-50 rounded-2xl p-4 text-xs space-y-2 font-sans">
              <div className="flex items-center justify-between text-slate-600">
                <span>Nama Akaun:</span>
                <span className="font-semibold text-slate-900">{platform.accountName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>ID Akaun / WABA / Pixel:</span>
                <span className="font-mono text-slate-700">{platform.accountId}</span>
              </div>
              {platform.balance !== undefined && (
                <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-200/60">
                  <span>Baki Kredit Iklan:</span>
                  <span className="font-mono font-semibold text-slate-900 text-sm">
                    {platform.currency} {platform.balance.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Human-Readable Performance Metrics */}
            {insight && (
              <div className="space-y-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Analisis Prestasi Pemasaran
                </span>

                <div className="grid grid-cols-3 gap-2.5 text-center">
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Belanja</span>
                    <span className="text-sm font-semibold text-slate-900 font-mono">
                      RM {insight.totalSpent.toFixed(0)}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Prospek WA</span>
                    <span className="text-sm font-semibold text-emerald-600 font-mono">
                      {insight.totalLeads} Orang
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-3">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">Kos / Prospek</span>
                    <span className="text-sm font-semibold text-slate-900 font-mono">
                      RM {insight.costPerLead.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* AI Advice */}
                <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-700 space-y-1.5">
                  <div className="flex items-center space-x-1.5 text-slate-900 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Nasihat & Penilaian AI:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-xs">{insight.humanAdvice}</p>
                  <p className="text-slate-900 font-medium text-xs pt-1">
                    💡 {insight.nextStepRecommendation}
                  </p>
                </div>
              </div>
            )}

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
                className="px-5 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-colors"
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


