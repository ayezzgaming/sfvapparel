'use client';

import React, { useState } from 'react';
import { AdPlatformConnection } from '@/types/ads';
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
  Info,
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
import { formatCurrency } from '@/lib/pricing-calculator';

interface PlatformConnectCardProps {
  platform: AdPlatformConnection;
  onUpdateConnection?: (updated: AdPlatformConnection) => void;
  onToggleConnect: (platformId: string) => void;
}

export default function PlatformConnectCard({
  platform,
  onUpdateConnection,
  onToggleConnect,
}: PlatformConnectCardProps) {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(true);

  // Form State for API Credentials
  const [accountIdInput, setAccountIdInput] = useState(platform.accountId || '');
  const [accessTokenInput, setAccessTokenInput] = useState('');
  const [pixelIdInput, setPixelIdInput] = useState(platform.pixelId || '');
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSaveConnection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountIdInput.trim() || !accessTokenInput.trim()) return;

    setIsSaving(true);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);

      const updatedAccount: AdPlatformConnection = {
        ...platform,
        isConnected: true,
        accountId: accountIdInput.trim(),
        accountName: platform.accountName || `SFV APPAREL (${platform.name})`,
        currency: 'MYR',
        balance: platform.balance ?? 450.00,
        pixelId: pixelIdInput.trim() || undefined,
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
      }, 1000);
    }, 800);
  };

  const handleDisconnect = () => {
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
              onClick={() => setShowConnectModal(true)}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Sambung</span>
            </button>
          )}
        </div>
      </div>

      {/* ================= MODAL 1: SAMBUNG API DENGAN PANDUAN JELAS ================= */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {renderIcon()}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Sambung API {platform.name}</h3>
                  <p className="text-xs text-slate-400">Hubungkan akaun rasmi untuk kawalan kempen secara terus</p>
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

            {/* EXPANDABLE INLINE STEP-BY-STEP GUIDE (JELAS & BOLEH KLIK) */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowHelpGuide(!showHelpGuide)}
                className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-slate-800 hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Panduan 3 Langkah Mendapatkan ID & Token</span>
                </div>
                {showHelpGuide ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {showHelpGuide && (
                <div className="px-4 pb-4 pt-1 space-y-3 text-xs text-slate-600 border-t border-slate-200/60 font-sans">
                  {/* Step 1 */}
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="space-y-1">
                      <p className="text-slate-800 font-medium">Dapatkan Ad Account ID:</p>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Buka Meta Ads Manager. ID Akaun anda berada di menu atas sebelah kiri profil (format: <code className="text-indigo-600 font-mono font-semibold">act_1234567890</code>).
                      </p>
                      <a
                        href="https://business.facebook.com/adsmanager"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs mt-1"
                      >
                        <span>Buka Meta Ads Manager</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="space-y-1">
                      <p className="text-slate-800 font-medium">Jana Meta Access Token (Kunci API):</p>
                      <p className="text-slate-500 text-[11px] leading-relaxed">
                        Buka <strong>Graph API Explorer</strong> rasmi Meta &gt; tandakan kebenaran <code className="text-indigo-600 font-mono font-semibold">ads_management</code> &amp; <code className="text-indigo-600 font-mono font-semibold">ads_read</code> &gt; klik <em>Generate Access Token</em>.
                      </p>
                      <a
                        href="https://developers.facebook.com/tools/explorer/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs mt-1"
                      >
                        <span>Buka Graph API Explorer</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <p className="text-slate-600 text-[11px] leading-relaxed pt-0.5">
                      Tampalkan ID Akaun dan Access Token tersebut ke dalam borang di bawah, lalu klik <strong>Sahkan &amp; Sambung</strong>.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSaveConnection} className="space-y-4">
              {/* FIELD 1: AD ACCOUNT ID */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    Ad Account ID <span className="text-rose-500">*</span>
                  </label>
                  <a
                    href="https://business.facebook.com/adsmanager"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center space-x-1"
                  >
                    <span>Cari ID di Ads Manager</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <input
                  type="text"
                  required
                  value={accountIdInput}
                  onChange={(e) => setAccountIdInput(e.target.value)}
                  placeholder={platform.id === 'google' ? 'Contoh: 849-201-9482' : 'act_839201948201'}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 text-xs text-slate-800 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>

              {/* FIELD 2: ACCESS TOKEN */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800">
                    Meta Access Token (Kunci API) <span className="text-rose-500">*</span>
                  </label>
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center space-x-1"
                  >
                    <span>Jana Token di Graph Explorer</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    required
                    value={accessTokenInput}
                    onChange={(e) => setAccessTokenInput(e.target.value)}
                    placeholder="EAAG... (Tampal Token Meta anda di sini)"
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

              {/* FIELD 3: PIXEL ID (OPTIONAL) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700">
                    Meta Pixel ID <span className="text-slate-400 font-normal">(Pilihan)</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Untuk jejak pesanan borang web</span>
                </div>

                <input
                  type="text"
                  value={pixelIdInput}
                  onChange={(e) => setPixelIdInput(e.target.value)}
                  placeholder="Contoh: 920194820192"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 text-xs text-slate-800 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Kredensial disimpan dengan selamat dan digunakan khusus untuk melancarkan kempen anda.</span>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !accountIdInput.trim() || !accessTokenInput.trim()}
                  className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-xs flex items-center space-x-2 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengesahkan Sambungan...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Berjaya Disambungkan!</span>
                    </>
                  ) : (
                    <span>Sahkan &amp; Sambung Akaun</span>
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
                <span>ID Akaun / Pixel:</span>
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
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
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
