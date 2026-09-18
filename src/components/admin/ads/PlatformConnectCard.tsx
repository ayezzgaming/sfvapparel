'use client';

import React, { useState } from 'react';
import { AdPlatformConnection } from '@/types/ads';
import {
  Check,
  Link2,
  Unlink,
  ExternalLink,
  HelpCircle,
  X,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  Info
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

  // Form State for API Credentials
  const [accountIdInput, setAccountIdInput] = useState(platform.accountId || '');
  const [accessTokenInput, setAccessTokenInput] = useState('');
  const [pixelIdInput, setPixelIdInput] = useState(platform.pixelId || '');
  const [showToken, setShowToken] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active Tooltip State
  const [activeTooltip, setActiveTooltip] = useState<'accountId' | 'accessToken' | 'pixelId' | null>(null);

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
          humanAdvice: `Akaun ${platform.name} berjaya disambungkan dan sedia melancarkan iklan.`,
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

      {/* ================= MODAL 1: SAMBUNG API DENGAN TOOLTIP (?) ================= */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-3">
                {renderIcon()}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Sambung API {platform.name}</h3>
                  <p className="text-xs text-slate-400">Masukkan kredensial rasmi akaun pengiklanan anda</p>
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

            {/* Form */}
            <form onSubmit={handleSaveConnection} className="space-y-4">
              {/* FIELD 1: AD ACCOUNT ID WITH TOOLTIP (?) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                    <span>Ad Account ID</span>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === 'accountId' ? null : 'accountId')}
                        onMouseEnter={() => setActiveTooltip('accountId')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none"
                        title="Cara mendapatkan Ad Account ID"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>

                      {/* Tooltip Content */}
                      {activeTooltip === 'accountId' && (
                        <div className="absolute left-0 bottom-6 z-50 w-72 p-3 bg-slate-900 text-white text-[11px] rounded-2xl shadow-xl space-y-1.5 animate-in fade-in">
                          <p className="font-semibold text-slate-200">Cara Mendapatkan Ad Account ID:</p>
                          <p className="text-slate-300 leading-relaxed">
                            Buka <strong>Meta Ads Manager</strong> (business.facebook.com/adsmanager). ID Akaun anda tertera di menu kiri atas sebelah profil, biasanya bermula dengan <code className="text-amber-300 font-mono">act_123456789</code>.
                          </p>
                          <a
                            href="https://business.facebook.com/adsmanager"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-indigo-300 hover:text-indigo-200 font-medium pt-1"
                          >
                            <span>Buka Ads Manager</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </label>

                  <span className="text-[10px] text-slate-400 font-mono">Contoh: act_839201948201</span>
                </div>

                <input
                  type="text"
                  required
                  value={accountIdInput}
                  onChange={(e) => setAccountIdInput(e.target.value)}
                  placeholder={platform.id === 'google' ? 'Contoh: 849-201-9482' : 'act_839201948201'}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 text-xs text-slate-800 border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>

              {/* FIELD 2: ACCESS TOKEN WITH TOOLTIP (?) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                    <span>Meta Access Token (Kunci API)</span>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === 'accessToken' ? null : 'accessToken')}
                        onMouseEnter={() => setActiveTooltip('accessToken')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none"
                        title="Cara mendapatkan Meta Access Token"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>

                      {/* Tooltip Content */}
                      {activeTooltip === 'accessToken' && (
                        <div className="absolute left-0 bottom-6 z-50 w-72 p-3 bg-slate-900 text-white text-[11px] rounded-2xl shadow-xl space-y-1.5 animate-in fade-in">
                          <p className="font-semibold text-slate-200">Cara Mendapatkan Meta Access Token:</p>
                          <p className="text-slate-300 leading-relaxed">
                            Boleh dijana melalui <strong>Meta Business Settings &gt; System Users</strong> (kebenaran <code className="text-amber-300">ads_management</code>) ATAU dijana pantas di <strong>Meta Graph API Explorer</strong>.
                          </p>
                          <a
                            href="https://developers.facebook.com/tools/explorer/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-indigo-300 hover:text-indigo-200 font-medium pt-1"
                          >
                            <span>Buka Graph API Explorer</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    required
                    value={accessTokenInput}
                    onChange={(e) => setAccessTokenInput(e.target.value)}
                    placeholder="EAAG... (Tampal Token Meta anda di sini)"
                    className="w-full px-3.5 py-2.5 pr-10 rounded-2xl bg-slate-50 text-xs text-slate-800 border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
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

              {/* FIELD 3: PIXEL ID (OPTIONAL) WITH TOOLTIP (?) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-slate-700 flex items-center space-x-1.5">
                    <span>Meta Pixel ID (Pilihan)</span>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setActiveTooltip(activeTooltip === 'pixelId' ? null : 'pixelId')}
                        onMouseEnter={() => setActiveTooltip('pixelId')}
                        onMouseLeave={() => setActiveTooltip(null)}
                        className="text-slate-400 hover:text-slate-600 focus:outline-none"
                        title="Cara mendapatkan Pixel ID"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                      </button>

                      {/* Tooltip Content */}
                      {activeTooltip === 'pixelId' && (
                        <div className="absolute left-0 bottom-6 z-50 w-72 p-3 bg-slate-900 text-white text-[11px] rounded-2xl shadow-xl space-y-1.5 animate-in fade-in">
                          <p className="font-semibold text-slate-200">Meta Pixel ID:</p>
                          <p className="text-slate-300 leading-relaxed">
                            Didapati di <strong>Meta Events Manager</strong>. Digunakan untuk menjejak pesanan jersi daripada katalog web.
                          </p>
                        </div>
                      )}
                    </div>
                  </label>
                </div>

                <input
                  type="text"
                  value={pixelIdInput}
                  onChange={(e) => setPixelIdInput(e.target.value)}
                  placeholder="Contoh: 920194820192"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 text-xs text-slate-800 border border-slate-200/80 focus:outline-none focus:ring-1 focus:ring-slate-400 font-mono"
                />
              </div>

              <div className="flex items-center space-x-2 text-[11px] text-slate-400 pt-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Token disimpan dengan selamat di pangkalan data anda dan tidak dikongsi.</span>
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
                      <span>Mengesahkan API...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Berjaya Disambungkan!</span>
                    </>
                  ) : (
                    <span>Sahkan & Sambung Akaun</span>
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
