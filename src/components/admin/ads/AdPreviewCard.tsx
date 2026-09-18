'use client';

import React from 'react';
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
  // 1. Google Ads Preview
  if (platform === 'google') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-3.5 shadow-xs font-sans text-left">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <GoogleAdsLogo className="w-4 h-4" />
          <span className="font-semibold text-slate-900 text-[11px] bg-slate-100 px-2 py-0.5 rounded-full">Tajaan</span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-600 font-mono text-[11px]">https://svfapparel.my/katalog</span>
        </div>

        <div className="space-y-1">
          <h4 className="text-base text-[#1a0dab] hover:underline cursor-pointer font-medium leading-snug">
            {creative.headline || 'Kilang Cetak Jersi Sublimasi & DTF Malaysia'}
          </h4>
          {creative.secondaryHeadline && (
            <span className="text-sm text-[#1a0dab] block -mt-0.5 font-normal">
              {creative.secondaryHeadline}
            </span>
          )}
          <p className="text-xs text-slate-600 leading-relaxed pt-1">
            {creative.primaryText || 'Tempah jersi sublimasi berkualiti tinggi dari kilang. Kain selesa, warna tajam, rekaan percuma.'}
          </p>
        </div>

        {/* Extensions */}
        <div className="pt-2 flex flex-wrap gap-2 text-xs border-t border-slate-100 text-[#1a0dab]">
          <span className="bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-full border border-slate-200 cursor-pointer">
            Katalog Jersi 2026
          </span>
          <span className="bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-full border border-slate-200 cursor-pointer">
            Sebut Harga WhatsApp
          </span>
          <span className="bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-full border border-slate-200 cursor-pointer">
            Galeri Rekaan
          </span>
        </div>
      </div>
    );
  }

  // 2. Facebook Ads Preview
  if (platform === 'facebook' || platform === 'meta') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs font-sans text-left max-w-sm mx-auto">
        {/* Post Header */}
        <div className="p-3.5 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              SFV
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-semibold text-slate-900">SVF Apparel Malaysia</span>
                <FacebookLogo className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] text-slate-400 block">Tajaan · Facebook Feed</span>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </div>

        {/* Primary Text */}
        <div className="px-3.5 py-2.5 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
          {creative.primaryText}
        </div>

        {/* Ad Image */}
        <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creative.imageUrl || '/images/prod_sportswear.jpg'}
            alt="Ad Creative"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Ad Call to Action bar */}
        <div className="p-3 bg-slate-50 flex items-center justify-between border-b border-slate-100">
          <div className="min-w-0 flex-1 pr-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">SVFAPPAREL.MY</span>
            <h5 className="text-xs font-bold text-slate-900 truncate">{creative.headline}</h5>
          </div>
          <button
            type="button"
            className="px-3.5 py-1.5 rounded-lg bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-medium shadow-xs transition-colors shrink-0"
          >
            {creative.callToAction || 'Kirim Mesej'}
          </button>
        </div>

        {/* Social Metrics */}
        <div className="px-3.5 py-2 flex items-center justify-between text-xs text-slate-500 bg-white">
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
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs font-sans text-left max-w-sm mx-auto">
        {/* Post Header */}
        <div className="p-3.5 flex items-center justify-between border-b border-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px]">
              SFV
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-semibold text-slate-900">svfapparel</span>
                <InstagramLogo className="w-3 h-3" />
              </div>
              <span className="text-[10px] text-slate-400 block">Tajaan</span>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </div>

        {/* Ad Image */}
        <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={creative.imageUrl || '/images/prod_sportswear.jpg'}
            alt="Instagram Creative"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Instagram CTA Bar */}
        <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between cursor-pointer hover:bg-black transition-colors">
          <span className="text-xs font-semibold">{creative.callToAction || 'Ketahui Lebih Lanjut'}</span>
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
        <div className="px-3.5 pb-3 pt-1 text-xs text-slate-800 leading-relaxed space-y-1">
          <p className="line-clamp-3">
            <span className="font-semibold text-slate-900 mr-1.5">svfapparel</span>
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
      <div className="relative aspect-[9/16] max-w-[270px] mx-auto rounded-3xl overflow-hidden bg-slate-900 text-white shadow-xl flex flex-col justify-between p-4">
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
              SFV
            </div>
            <span className="text-xs font-semibold text-white">@svfapparel</span>
          </div>

          <p className="text-[11px] text-white/90 line-clamp-3 leading-snug font-normal">
            {creative.primaryText}
          </p>

          <button
            type="button"
            className="w-full py-2.5 rounded-full bg-[#FE2C55] hover:bg-[#E0264B] text-white font-semibold text-xs shadow-md transition-colors"
          >
            {creative.callToAction || 'Tempah Sekarang'}
          </button>
        </div>
      </div>
    );
  }

  // 5. WhatsApp Ads Preview
  return (
    <div className="bg-[#ECE5DD] rounded-3xl border border-slate-200 p-4 max-w-sm mx-auto shadow-xs text-left font-sans space-y-3">
      <div className="flex items-center space-x-2 px-1">
        <WhatsAppLogo className="w-4 h-4" />
        <span className="text-xs font-semibold text-slate-800">Iklan Terus WhatsApp Business</span>
      </div>

      <div className="bg-white rounded-2xl p-3 shadow-xs space-y-2.5 border border-slate-200/60">
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

        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
          <div className="flex items-center space-x-1.5 font-semibold text-emerald-800">
            <Phone className="w-3.5 h-3.5" />
            <span>Mesej Sedia Ada (Autofill):</span>
          </div>
          <p className="text-[11px] italic font-mono text-emerald-950">
            &ldquo;{creative.whatsappMessage || 'Salam SVF, saya berminat untuk tempahan jersi.'}&rdquo;
          </p>
        </div>
      </div>

      <div className="text-center">
        <span className="text-[10px] text-slate-500">
          Bakal pelanggan klik iklan dan terus bersembang dengan pasukan jualan anda di WhatsApp.
        </span>
      </div>
    </div>
  );
}
