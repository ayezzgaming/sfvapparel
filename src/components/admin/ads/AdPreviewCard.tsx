'use client';

import React from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { AdCreative, AdPlatform } from '@/types/ads';
import {
  GoogleAdsLogo,
  FacebookLogo,
  InstagramLogo,
  TikTokLogo,
  WhatsAppLogo
} from '@/components/admin/ads/PlatformLogos';
import { MoreHorizontal, ThumbsUp, MessageCircle, Share2, Phone, Heart, Bookmark } from 'lucide-react';

interface AdPreviewCardProps {
  platform: AdPlatform;
  creative: AdCreative;
}

export default function AdPreviewCard({ platform, creative }: AdPreviewCardProps) {
  const { companySettings } = useAppStore();

  const brandName = companySettings?.brand_name || 'SFV APPAREL';
  const companyFullName = companySettings?.company_name || 'SFV Ventures Marketing';
  const rawDomain = (companySettings?.website_url || 'sfvapparel.my')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  const brandInitials = brandName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'SFV';
  const socialHandle = `@${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const phoneDisplay = companySettings?.phone || companySettings?.whatsapp_number || '+60 14-859 9138';

  // 1. Google Ads Preview
  if (platform === 'google') {
    return (
      <div className="bg-slate-50/80 rounded-3xl p-5 sm:p-6 space-y-3 font-sans text-left">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <GoogleAdsLogo className="w-4 h-4" />
          <span className="font-semibold text-slate-900 text-[11px] bg-white px-2 py-0.5 rounded-full">Tajaan</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600 font-mono text-[11px]">https://{rawDomain}/katalog</span>
        </div>

        <div className="space-y-1">
          <h4 className="text-base text-[#1a0dab] hover:underline cursor-pointer font-medium leading-snug">
            {creative.headline || `Kilang Cetak Jersi Sublimasi & DTF | ${brandName}`}
          </h4>
          {creative.secondaryHeadline && (
            <span className="text-sm text-[#1a0dab] block -mt-0.5 font-normal">
              {creative.secondaryHeadline}
            </span>
          )}
          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            {creative.primaryText || `Tempah jersi sublimasi berkualiti tinggi dari ${brandName}. Kain selesa, warna tajam, rekaan percuma.`}
          </p>
        </div>

        {/* Extensions */}
        <div className="pt-2 flex flex-wrap gap-2 text-xs text-[#1a0dab]">
          <span className="bg-white hover:bg-slate-100 px-3 py-1 rounded-full cursor-pointer transition-colors">
            Katalog Jersi 2026
          </span>
          <span className="bg-white hover:bg-slate-100 px-3 py-1 rounded-full cursor-pointer transition-colors">
            Sebut Harga WhatsApp
          </span>
          <span className="bg-white hover:bg-slate-100 px-3 py-1 rounded-full cursor-pointer transition-colors">
            Galeri Rekaan
          </span>
        </div>
      </div>
    );
  }

  // 2. Facebook Ads Preview
  if (platform === 'facebook' || platform === 'meta') {
    return (
      <div className="bg-slate-50/80 rounded-3xl overflow-hidden font-sans text-left max-w-sm mx-auto">
        {/* Post Header */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-xs tracking-wider">
              {brandInitials}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-900">{brandName}</span>
                <FacebookLogo className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] text-slate-400 block">Tajaan · Facebook Feed</span>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </div>

        {/* Primary Text */}
        <div className="px-3.5 py-2 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
          {creative.primaryText}
        </div>

        {/* Ad Image */}
        <div className="relative aspect-square w-full bg-slate-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creative.imageUrl || '/images/prod_sportswear.jpg'}
            alt="Ad Creative"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Ad Call to Action bar */}
        <div className="p-3 bg-white/80 flex items-center justify-between">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">{rawDomain.toUpperCase()}</span>
            <h5 className="text-xs font-bold text-slate-900 truncate">{creative.headline}</h5>
          </div>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-xl bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-medium transition-colors shrink-0"
          >
            {creative.callToAction || 'Kirim Mesej'}
          </button>
        </div>

        {/* Social Metrics */}
        <div className="px-3.5 py-2.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1">
            <ThumbsUp className="w-3.5 h-3.5 text-[#1877F2]" />
            <span className="text-[11px]">348 sukaan</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>52 komen</span>
            <span>24 perkongsian</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Instagram Ads Preview
  if (platform === 'instagram') {
    return (
      <div className="bg-slate-50/80 rounded-3xl overflow-hidden font-sans text-left max-w-sm mx-auto">
        {/* Post Header */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-800 flex items-center justify-center font-bold text-[10px] tracking-wider">
              {brandInitials}
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-semibold text-slate-900">{socialHandle.replace('@', '')}</span>
                <InstagramLogo className="w-3 h-3" />
              </div>
              <span className="text-[10px] text-slate-400 block">Tajaan</span>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </div>

        {/* Ad Image */}
        <div className="relative aspect-square w-full bg-slate-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creative.imageUrl || '/images/prod_sportswear.jpg'}
            alt="Instagram Creative"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Instagram CTA Bar */}
        <div className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-between cursor-pointer transition-colors">
          <span className="text-xs font-medium">{creative.callToAction || 'Ketahui Lebih Lanjut'}</span>
          <span className="text-xs text-slate-300">›</span>
        </div>

        {/* Action icons */}
        <div className="px-3.5 pt-2.5 pb-1 flex items-center justify-between text-slate-800">
          <div className="flex items-center space-x-3">
            <Heart className="w-4 h-4" />
            <MessageCircle className="w-4 h-4" />
            <Share2 className="w-4 h-4" />
          </div>
          <Bookmark className="w-4 h-4 text-slate-400" />
        </div>

        {/* Caption */}
        <div className="px-3.5 pb-3.5 pt-1 text-xs text-slate-800 leading-relaxed space-y-1">
          <p className="line-clamp-3">
            <span className="font-semibold text-slate-900 mr-1.5">{socialHandle.replace('@', '')}</span>
            {creative.primaryText}
          </p>
          <span className="text-[10px] text-slate-400 block">Lihat semua 48 komen</span>
        </div>
      </div>
    );
  }

  // 4. TikTok Ads Preview
  if (platform === 'tiktok') {
    return (
      <div className="relative aspect-[9/16] max-w-[270px] mx-auto rounded-3xl overflow-hidden bg-slate-900 text-white flex flex-col justify-between p-4">
        {/* Background mockup image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creative.imageUrl || '/images/prod_sportswear.jpg'}
          alt="TikTok Ad"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/40" />

        <div className="relative z-10 flex justify-between items-center text-xs">
          <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full">
            <TikTokLogo className="w-3.5 h-3.5 fill-white" />
            <span className="text-[10px] font-medium text-white">Tajaan</span>
          </div>
        </div>

        {/* Bottom Ad overlay */}
        <div className="relative z-10 space-y-2.5 text-left">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-[10px]">
              {brandInitials}
            </div>
            <span className="text-xs font-semibold text-white">{socialHandle}</span>
          </div>

          <p className="text-[11px] text-white/90 line-clamp-3 leading-snug font-normal">
            {creative.primaryText}
          </p>

          <button
            type="button"
            className="w-full py-2.5 rounded-full bg-[#FE2C55] hover:bg-[#E0264B] text-white font-semibold text-xs transition-colors"
          >
            {creative.callToAction || 'Tempah Sekarang'}
          </button>
        </div>
      </div>
    );
  }

  // 5. WhatsApp Ads Preview
  return (
    <div className="bg-slate-50/80 rounded-3xl p-4 max-w-sm mx-auto text-left font-sans space-y-3">
      <div className="flex items-center space-x-2 px-1">
        <WhatsAppLogo className="w-4 h-4" />
        <span className="text-xs font-semibold text-slate-800">Iklan Terus WhatsApp Business</span>
      </div>

      <div className="bg-white rounded-2xl p-3 space-y-2.5">
        <div className="aspect-video rounded-xl overflow-hidden bg-slate-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creative.imageUrl || '/images/prod_sportswear.jpg'}
            alt="WhatsApp Ad Preview"
            className="w-full h-full object-cover"
          />
        </div>

        <div>
          <h5 className="text-xs font-bold text-slate-900">{creative.headline}</h5>
          <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{creative.primaryText}</p>
        </div>

        <div className="p-3 rounded-xl bg-emerald-50/70 text-xs text-emerald-900 space-y-1">
          <div className="flex items-center space-x-1.5 font-semibold text-emerald-800">
            <Phone className="w-3.5 h-3.5" />
            <span>Mesej Sedia Ada (Autofill):</span>
          </div>
          <p className="text-[11px] italic font-mono text-emerald-950">
            &ldquo;{creative.whatsappMessage || `Salam ${brandName}, saya berminat untuk tempahan jersi.`}&rdquo;
          </p>
        </div>
      </div>

      <div className="text-center px-1">
        <span className="text-[10px] text-slate-500">
          Pelanggan klik iklan dan terus berhubung dengan khidmat jualan {brandName} ({phoneDisplay}).
        </span>
      </div>
    </div>
  );
}
