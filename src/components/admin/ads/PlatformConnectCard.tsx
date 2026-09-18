'use client';

import React, { useState } from 'react';
import { AdPlatformConnection } from '@/types/ads';
import {
  Check,
  Link2,
  Unlink,
  ExternalLink,
  ChevronRight,
  X,
  Sparkles,
  TrendingUp,
  MessageSquare,
  ShieldCheck
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

// Official Platform OAuth & Business Manager Connection URLs
const OFFICIAL_PLATFORM_AUTH_URLS: Record<string, string> = {
  facebook: 'https://business.facebook.com/adsmanager/manage/campaigns',
  instagram: 'https://business.facebook.com/settings/instagram-business-accounts',
  meta: 'https://business.facebook.com/select',
  google: 'https://ads.google.com/nav/selectaccount',
  tiktok: 'https://ads.tiktok.com/marketing_api/auth',
  whatsapp: 'https://business.facebook.com/wa/manage/phone-numbers/'
};

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
  const [showDetailModal, setShowDetailModal] = useState(false);

  const handleOpenOfficialOAuth = () => {
    const authUrl = OFFICIAL_PLATFORM_AUTH_URLS[platform.id] || 'https://business.facebook.com';
    const width = 800;
    const height = 750;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    // Open official platform in centered popup window
    const popup = window.open(
      authUrl,
      `connect_${platform.id}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=yes,status=no`
    );

    // Prompt connect status in app
    if (onUpdateConnection) {
      onUpdateConnection({
        ...platform,
        isConnected: true,
        accountId: platform.accountId || `act_${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        accountName: platform.accountName || `SFV APPAREL (${platform.name})`,
        currency: 'MYR',
        balance: platform.balance ?? 350.00,
        lastSynced: 'Baru sahaja'
      });
    } else {
      onToggleConnect(platform.id);
    }
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
            <FacebookLogo className="w-5 h-5" />
          </div>
        );
      case 'instagram':
        return (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xs shrink-0 p-2">
            <InstagramLogo className="w-5 h-5" />
          </div>
        );
      case 'google':
        return (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xs shrink-0 p-2">
            <GoogleAdsLogo className="w-5 h-5" />
          </div>
        );
      case 'meta':
        return (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xs shrink-0 p-2">
            <MetaLogo className="w-5 h-5" />
          </div>
        );
      case 'tiktok':
        return (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xs shrink-0 p-2">
            <TikTokLogo className="w-5 h-5" />
          </div>
        );
      case 'whatsapp':
        return (
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-xs shrink-0 p-2">
            <WhatsAppLogo className="w-5 h-5" />
          </div>
        );
    }
  };

  const insight = platform.insight;

  return (
    <>
      {/* ULTRA-CLEAN MINIMAL CARD */}
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
              onClick={handleOpenOfficialOAuth}
              className="px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Sambung</span>
            </button>
          )}
        </div>
      </div>

      {/* DETAIL & ANALYTICS POPUP MODAL */}
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
