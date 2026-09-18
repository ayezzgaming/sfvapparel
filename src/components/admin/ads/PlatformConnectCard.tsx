'use client';

import React, { useState, useEffect } from 'react';
import { AdPlatformConnection } from '@/types/ads';
import {
  Check,
  Link2,
  Unlink,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ExternalLink
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

export default function PlatformConnectCard({
  platform,
  onUpdateConnection,
  onToggleConnect,
}: PlatformConnectCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  // Listen for OAuth Popup PostMessage
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const receivedPlatform = event.data.platform;
        if (
          receivedPlatform === platform.id ||
          (receivedPlatform === 'meta' && (platform.id === 'facebook' || platform.id === 'instagram'))
        ) {
          const account = event.data.account;
          if (onUpdateConnection) {
            onUpdateConnection({
              ...platform,
              isConnected: true,
              accountId: account.accountId,
              accountName: account.accountName,
              currency: account.currency,
              balance: account.balance,
              pixelId: account.pixelId,
              lastSynced: 'Baru sahaja'
            });
          } else {
            onToggleConnect(platform.id);
          }
          setIsConnecting(false);
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [platform, onUpdateConnection, onToggleConnect]);

  const handleOpenOAuthPopup = () => {
    setIsConnecting(true);

    const width = 600;
    const height = 720;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      `/admin/oauth/${platform.id}`,
      `oauth_${platform.id}`,
      `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,location=no,status=no`
    );

    // Fallback timer if popup closed manually
    const timer = setInterval(() => {
      if (!popup || popup.closed) {
        clearInterval(timer);
        setIsConnecting(false);
      }
    }, 1000);
  };

  const handleDisconnect = () => {
    onToggleConnect(platform.id);
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
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-xs border border-slate-100 flex flex-col justify-between space-y-4 hover:shadow-sm transition-all">
      {/* Top Identity & Status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          {renderIcon()}
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-slate-900">{platform.name}</h3>
              {platform.isConnected && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <Check className="w-2.5 h-2.5" />
                  Aktif & Siap Kawal
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{platform.description}</p>
          </div>
        </div>

        {!platform.isConnected && (
          <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full shrink-0">
            Belum Disambung
          </span>
        )}
      </div>

      {/* Connection Info or Callout */}
      {platform.isConnected ? (
        <div className="space-y-3">
          {/* Account Metadata Bar */}
          <div className="bg-slate-50 rounded-2xl p-3.5 text-xs space-y-1.5 font-sans">
            <div className="flex items-center justify-between text-slate-600">
              <span>Akaun Rasmi:</span>
              <span className="font-medium text-slate-900 truncate max-w-[200px]">
                {platform.accountName}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>ID Akaun / Pixel:</span>
              <span className="font-mono text-slate-700">{platform.accountId}</span>
            </div>
            {platform.balance !== undefined && (
              <div className="flex items-center justify-between text-slate-600 pt-1.5 border-t border-slate-200/60">
                <span>Baki Kredit Iklan:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {platform.currency} {platform.balance.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Human-Readable Performance Metrics & AI Evaluation */}
          {insight && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-2xl p-2.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Belanja</span>
                  <span className="text-xs font-semibold text-slate-900 font-mono">
                    RM {insight.totalSpent.toFixed(0)}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-2.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Leads WA</span>
                  <span className="text-xs font-semibold text-emerald-600 font-mono">
                    {insight.totalLeads} Orang
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-2.5">
                  <span className="text-[10px] text-slate-400 block uppercase font-medium">Kos / Mesej</span>
                  <span className="text-xs font-semibold text-slate-900 font-mono">
                    RM {insight.costPerLead.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* AI Strategic Human-Readable Recommendation */}
              <div className="bg-slate-50/90 rounded-2xl p-3.5 text-xs text-slate-700 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-900 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>Nasihat Pemasaran AI:</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{insight.humanAdvice}</p>
                <p className="text-slate-900 font-medium text-[11px] pt-1">
                  💡 {insight.nextStepRecommendation}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-xs text-slate-600 space-y-2">
          <p className="leading-relaxed">
            Sambungkan akaun <strong>{platform.name}</strong> anda dengan 1 klik. Sistem akan membuka tetingkap login rasmi dan kembali secara automatik setelah berjaya.
          </p>
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Kredensial disahkan selamat melalui OAuth rasmi.</span>
          </div>
        </div>
      )}

      {/* Bottom Footer Actions */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="text-[11px] text-slate-400">
          {platform.isConnected && platform.lastSynced && (
            <span>Disegerak: {platform.lastSynced}</span>
          )}
        </div>

        {platform.isConnected ? (
          <button
            type="button"
            onClick={handleDisconnect}
            className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center space-x-1"
          >
            <Unlink className="w-3 h-3" />
            <span>Nyahpaut</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleOpenOAuthPopup}
            disabled={isConnecting}
            className="px-4 py-2 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-xs flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Membuka Login...</span>
              </>
            ) : (
              <>
                <Link2 className="w-3 h-3" />
                <span>Sambung Akaun</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
