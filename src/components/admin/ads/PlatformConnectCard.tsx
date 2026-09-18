'use client';

import React, { useState } from 'react';
import { AdPlatformConnection } from '@/types/ads';
import { Check, Link2, Unlink, RefreshCw } from 'lucide-react';
import { GoogleAdsLogo, MetaLogo, TikTokLogo, WhatsAppLogo } from '@/components/admin/ads/PlatformLogos';

interface PlatformConnectCardProps {
  platform: AdPlatformConnection;
  onToggleConnect: (platformId: string) => void;
}

export default function PlatformConnectCard({
  platform,
  onToggleConnect,
}: PlatformConnectCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      onToggleConnect(platform.id);
      setIsConnecting(false);
    }, 800);
  };

  const renderIcon = () => {
    switch (platform.id) {
      case 'google':
        return (
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-xs shrink-0 p-2">
            <GoogleAdsLogo className="w-6 h-6" />
          </div>
        );
      case 'meta':
        return (
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-xs shrink-0 p-2">
            <MetaLogo className="w-6 h-6" />
          </div>
        );
      case 'tiktok':
        return (
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-xs shrink-0 p-2">
            <TikTokLogo className="w-6 h-6" />
          </div>
        );
      case 'whatsapp':
        return (
          <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center border border-slate-200 shadow-xs shrink-0 p-2">
            <WhatsAppLogo className="w-6 h-6" />
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center space-x-3.5">
          {renderIcon()}
          <div>
            <h3 className="text-sm font-medium text-slate-900">{platform.name}</h3>
            <span className="text-xs text-slate-500 line-clamp-1">{platform.description}</span>
          </div>
        </div>

        {platform.isConnected ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0">
            <Check className="w-3 h-3 text-emerald-600" />
            Tersambung
          </span>
        ) : (
          <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2.5 py-0.5 rounded-full shrink-0 border border-slate-200">
            Belum Disambung
          </span>
        )}
      </div>

      {platform.isConnected ? (
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 text-xs space-y-1.5 font-sans">
          <div className="flex items-center justify-between text-slate-600">
            <span>Akaun:</span>
            <span className="font-medium text-slate-800">{platform.accountName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600">
            <span>ID Akaun:</span>
            <span className="font-mono text-slate-700">{platform.accountId}</span>
          </div>
          {platform.balance !== undefined && (
            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-200/60">
              <span>Baki Kredit Iklan:</span>
              <span className="font-mono font-medium text-slate-900">
                {platform.currency} {platform.balance.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200 text-xs text-slate-500">
          Klik butang di bawah untuk meluluskan akses akaun pengiklanan secara langsung melalui OAuth.
        </div>
      )}

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
        <div className="text-[11px] text-slate-400">
          {platform.isConnected && platform.lastSynced && (
            <span>Disegerak: {platform.lastSynced}</span>
          )}
        </div>

        {platform.isConnected ? (
          <button
            type="button"
            onClick={handleConnect}
            className="px-4 py-1.5 rounded-full text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all flex items-center space-x-1"
          >
            <Unlink className="w-3.5 h-3.5" />
            <span>Nyahpaut</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-4 py-1.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menyambung...</span>
              </>
            ) : (
              <>
                <Link2 className="w-3.5 h-3.5" />
                <span>Sambung Akaun</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
