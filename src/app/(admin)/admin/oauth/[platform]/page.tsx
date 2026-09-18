'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import {
  FacebookLogo,
  InstagramLogo,
  GoogleAdsLogo,
  TikTokLogo,
  WhatsAppLogo,
  MetaLogo
} from '@/components/admin/ads/PlatformLogos';
import { ShieldCheck, CheckCircle2, RefreshCw, X, AlertCircle } from 'lucide-react';

export default function OAuthPopupPage() {
  const params = useParams();
  const platform = (params?.platform as string) || 'meta';

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const getPlatformInfo = () => {
    switch (platform.toLowerCase()) {
      case 'meta':
      case 'facebook':
      case 'instagram':
        return {
          name: 'Meta Business Suite (Facebook & Instagram)',
          company: 'Meta Platforms, Inc.',
          icon: MetaLogo,
          scopes: [
            'Mengurus Iklan & Bajet (ads_management)',
            'Membaca Data Prestasi & Pixel (ads_read)',
            'Akses Halaman & Profil Perniagaan Instagram (pages_show_list, instagram_basic)',
            'Integrasi WhatsApp Business API (whatsapp_business_messaging)'
          ],
          defaultAccount: {
            accountId: 'act_839201948201',
            accountName: 'SFV APPAREL - Meta Ads Manager',
            currency: 'MYR',
            balance: 450.00,
            pixelId: 'pix_920194820192'
          }
        };
      case 'google':
        return {
          name: 'Google Ads & Marketing Platform',
          company: 'Google LLC',
          icon: GoogleAdsLogo,
          scopes: [
            'Mengurus Kempen Iklan Carian & Pameran (Google Ads API)',
            'Membaca Metrik Klik, Teraan & Penukaran (adwords)',
            'Akses Profil Perniagaan Google'
          ],
          defaultAccount: {
            accountId: '849-201-9482',
            accountName: 'SFV Ventures Marketing (Google Ads)',
            currency: 'MYR',
            balance: 320.50,
            pixelId: 'AW-920194820'
          }
        };
      case 'tiktok':
        return {
          name: 'TikTok for Business (TikTok Ads)',
          company: 'TikTok Pte. Ltd.',
          icon: TikTokLogo,
          scopes: [
            'Pengurusan Kempen Iklan Video (ad_management)',
            'Akses TikTok Pixel & Pelaporan Data',
            'Pengurusan Akaun Perniagaan'
          ],
          defaultAccount: {
            accountId: 'adv_729482019482',
            accountName: 'SFV APPAREL Official TikTok Ads',
            currency: 'MYR',
            balance: 280.00,
            pixelId: 'tt_pix_82019482'
          }
        };
      case 'whatsapp':
        return {
          name: 'WhatsApp Cloud Business API',
          company: 'Meta Platforms / WhatsApp LLC',
          icon: WhatsAppLogo,
          scopes: [
            'Penghantaran Mesej & Sebut Harga Automatik (whatsapp_business_messaging)',
            'Pengurusan Templat Iklan Click-to-WhatsApp',
            'Membaca Status Respons Prospek'
          ],
          defaultAccount: {
            accountId: 'waba_948201948201',
            accountName: 'SFV APPAREL Official WABA (+6011-2897 4556)',
            currency: 'MYR',
            balance: 150.00,
            pixelId: 'wa_webhook_active'
          }
        };
      default:
        return {
          name: 'Platform Pengiklanan',
          company: 'Platform Provider',
          icon: ShieldCheck,
          scopes: ['Akses Pengurusan Kempen & Data Analitik'],
          defaultAccount: {
            accountId: 'act_default',
            accountName: 'Akaun Perniagaan SFV APPAREL',
            currency: 'MYR',
            balance: 200.00,
            pixelId: 'pix_default'
          }
        };
    }
  };

  const info = getPlatformInfo();
  const Icon = info.icon;

  const handleAuthorize = () => {
    setIsAuthorizing(true);

    setTimeout(() => {
      setIsAuthorizing(false);
      setIsSuccess(true);

      // Post message back to parent window
      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'OAUTH_AUTH_SUCCESS',
            platform: platform.toLowerCase(),
            account: info.defaultAccount
          },
          '*'
        );
      }

      // Automatically close the popup after brief success display
      setTimeout(() => {
        window.close();
      }, 1200);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-6 text-slate-800 font-sans antialiased select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center p-2 border border-slate-200 shadow-xs shrink-0">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 leading-tight">{info.name}</h1>
            <p className="text-[11px] text-slate-500">{info.company} • Pengesahan Selamat (OAuth 2.0)</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.close()}
          className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="my-auto py-6 max-w-md mx-auto w-full space-y-5">
        {isSuccess ? (
          <div className="bg-white rounded-3xl p-8 text-center space-y-4 shadow-sm border border-emerald-100 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Akaun Berjaya Disambungkan!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Akses telah diluluskan untuk <strong>{info.defaultAccount.accountName}</strong>. Tetingkap ini akan ditutup secara automatik.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Kebenaran Akses Diperlukan
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                Aplikasi <strong>SFV APPAREL Marketing Studio</strong> meminta kebenaran rasmi untuk menyambung dan mengurus kempen pemasaran anda:
              </p>
            </div>

            {/* Scopes List */}
            <div className="space-y-2 bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
              {info.scopes.map((scope, i) => (
                <div key={i} className="flex items-start space-x-2.5 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{scope}</span>
                </div>
              ))}
            </div>

            {/* Account Target Info */}
            <div className="bg-slate-50/60 rounded-2xl p-3 border border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">ID Akaun Pilihan:</span>
              <span className="font-mono font-medium text-slate-800">{info.defaultAccount.accountId}</span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-slate-500 shrink-0" />
              <span>Token OAuth disulitkan secara selamat. Anda boleh membatalkan akses pada bila-bila masa.</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Actions */}
      {!isSuccess && (
        <div className="border-t border-slate-200 pt-4 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={() => window.close()}
            disabled={isAuthorizing}
            className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleAuthorize}
            disabled={isAuthorizing}
            className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-medium transition-all shadow-sm flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isAuthorizing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Mengesahkan...</span>
              </>
            ) : (
              <span>Benarkan Akses (Authorize)</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
