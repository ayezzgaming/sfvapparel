'use client';

import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/lib/store/app-store';
import { AdCreative, AdPlatform } from '@/types/ads';
import {
  GoogleAdsLogo,
  FacebookLogo,
  InstagramLogo,
  TikTokLogo,
  WhatsAppLogo
} from '@/components/admin/ads/PlatformLogos';
import {
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Share2,
  Phone,
  Heart,
  Bookmark,
  Send,
  CheckCheck,
  ChevronRight,
  Search,
  ArrowUpRight,
  ExternalLink,
  Music,
  ShoppingBag,
  Star,
  Check
} from 'lucide-react';

interface AdPreviewCardProps {
  platform: AdPlatform;
  creative: AdCreative;
}

export default function AdPreviewCard({ platform, creative }: AdPreviewCardProps) {
  const { companySettings } = useAppStore();

  const brandName = companySettings?.brand_name || 'SFV APPAREL';
  const rawDomain = (companySettings?.website_url || 'sfvapparel.my')
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
  const brandInitials = brandName.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'SFV';
  const socialHandle = `@${brandName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const phoneDisplay = companySettings?.phone || companySettings?.whatsapp_number || '+60 14-859 9138';

  // Format / Placement State for each platform
  const [activeFormat, setActiveFormat] = useState<string>('default');

  // Reset format to default when platform changes
  useEffect(() => {
    switch (platform) {
      case 'facebook':
        setActiveFormat('feed');
        break;
      case 'instagram':
        setActiveFormat('feed');
        break;
      case 'google':
        setActiveFormat('search');
        break;
      case 'tiktok':
        setActiveFormat('infeed');
        break;
      case 'whatsapp':
        setActiveFormat('click_to_chat');
        break;
      default:
        setActiveFormat('feed');
    }
  }, [platform]);

  // Render Format Switcher Tabs
  const renderFormatSwitcher = () => {
    let formats: { id: string; label: string }[] = [];

    if (platform === 'facebook' || platform === 'meta') {
      formats = [
        { id: 'feed', label: 'Feed Post' },
        { id: 'story', label: 'Story & Reels' },
        { id: 'right_column', label: 'Lajur Kanan' }
      ];
    } else if (platform === 'instagram') {
      formats = [
        { id: 'feed', label: 'Instagram Feed' },
        { id: 'story', label: 'Stories' },
        { id: 'reels', label: 'Reels' }
      ];
    } else if (platform === 'google') {
      formats = [
        { id: 'search', label: 'Carian (Search)' },
        { id: 'display', label: 'Display Banner' },
        { id: 'shopping', label: 'Shopping' }
      ];
    } else if (platform === 'tiktok') {
      formats = [
        { id: 'infeed', label: 'In-Feed Video' },
        { id: 'topview', label: 'TopView Fullscreen' }
      ];
    } else if (platform === 'whatsapp') {
      formats = [
        { id: 'click_to_chat', label: 'Iklan Click-to-Chat' },
        { id: 'chat_screen', label: 'Skrin WhatsApp' }
      ];
    }

    if (formats.length <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-1 p-1 bg-slate-100 rounded-full max-w-fit mx-auto mb-5">
        {formats.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFormat(f.id)}
            className={`px-3 py-1 rounded-full text-xs transition-all ${
              activeFormat === f.id
                ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>
    );
  };

  // ================= 1. GOOGLE ADS =================
  if (platform === 'google') {
    return (
      <div className="space-y-4">
        {renderFormatSwitcher()}

        {/* 1A. Google Search Format */}
        {activeFormat === 'search' && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs font-sans text-left max-w-md mx-auto space-y-2.5">
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <GoogleAdsLogo className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-800 text-[11px] bg-slate-100 px-1.5 py-0.2 rounded">Tajaan</span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 font-mono text-[11px] truncate">https://{rawDomain}/katalog</span>
            </div>

            <div className="space-y-1">
              <h4 className="text-sm sm:text-base text-[#1a0dab] hover:underline cursor-pointer font-medium leading-snug">
                {creative.headline || `Kilang Cetak Jersi Sublimasi & DTF | ${brandName}`}
              </h4>
              {creative.secondaryHeadline && (
                <span className="text-xs sm:text-sm text-[#1a0dab] block -mt-0.5 font-normal">
                  {creative.secondaryHeadline}
                </span>
              )}
              <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                {creative.primaryText || `Tempah jersi sublimasi berkualiti tinggi dari ${brandName}. Kain Milano Drifit sejuk, warna tahan luntur, rekaan percuma.`}
              </p>
            </div>

            {/* Sitelink Extensions */}
            <div className="pt-2 grid grid-cols-2 gap-2 text-xs border-t border-slate-100">
              <div className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <span className="text-[#1a0dab] font-medium block text-[11px]">Katalog Jersi 2026</span>
                <span className="text-slate-400 text-[10px]">Pilihan 50+ templat sukan</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                <span className="text-[#1a0dab] font-medium block text-[11px]">Sebut Harga WhatsApp</span>
                <span className="text-slate-400 text-[10px]">Balasan pantas 5 minit</span>
              </div>
            </div>
          </div>
        )}

        {/* 1B. Google Display Banner Format */}
        {activeFormat === 'display' && (
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs font-sans text-left max-w-[320px] mx-auto">
            <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creative.imageUrl || '/images/prod_sportswear.jpg'}
                alt="Display Ad"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-medium px-2 py-0.5 rounded backdrop-blur-xs">
                Iklan Paparan Google
              </span>
            </div>
            <div className="p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-mono uppercase">{rawDomain}</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">Drifit Milano</span>
              </div>
              <h5 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                {creative.headline || `Pakar Tempahan Jersi Sublimasi Kustom`}
              </h5>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                {creative.primaryText}
              </p>
              <button
                type="button"
                className="w-full py-2 bg-[#1a73e8] hover:bg-blue-600 text-white text-xs font-medium rounded-xl transition-colors text-center"
              >
                {creative.callToAction || 'Lihat Katalog'}
              </button>
            </div>
          </div>
        )}

        {/* 1C. Google Shopping Product Card */}
        {activeFormat === 'shopping' && (
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs font-sans text-left max-w-[240px] mx-auto space-y-2">
            <div className="relative aspect-square w-full bg-slate-100 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creative.imageUrl || '/images/prod_sportswear.jpg'}
                alt="Google Shopping"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1.5 right-1.5 bg-white/90 text-slate-800 text-[9px] font-medium px-1.5 py-0.5 rounded shadow-2xs">
                Tajaan
              </span>
            </div>
            <div className="space-y-1">
              <h5 className="text-xs font-medium text-slate-900 line-clamp-2 leading-snug">
                {creative.headline || `Jersi Sukan Sublimasi Kustom Pasukan`}
              </h5>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-xs font-bold text-slate-900 font-mono">RM 35.00</span>
                <span className="text-[10px] text-slate-400 line-through font-mono">RM 55.00</span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">{brandName} · {rawDomain}</p>
              <div className="flex items-center space-x-1 text-[10px] text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Penghantaran Percuma</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= 2. FACEBOOK ADS =================
  if (platform === 'facebook' || platform === 'meta') {
    return (
      <div className="space-y-4">
        {renderFormatSwitcher()}

        {/* 2A. Facebook Feed Post */}
        {activeFormat === 'feed' && (
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs font-sans text-left max-w-sm mx-auto">
            {/* Header */}
            <div className="p-3.5 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[10px] tracking-wider shrink-0">
                  {brandInitials}
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-semibold text-slate-900">{brandName}</span>
                    <FacebookLogo className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] text-slate-400 block">Tajaan · Facebook Feed</span>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </div>

            {/* Primary Text */}
            <div className="px-3.5 py-2.5 text-xs text-slate-800 leading-relaxed whitespace-pre-line line-clamp-4">
              {creative.primaryText}
            </div>

            {/* Creative Image */}
            <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creative.imageUrl || '/images/prod_sportswear.jpg'}
                alt="Facebook Creative"
                className="w-full h-full object-cover"
              />
            </div>

            {/* CTA Strip */}
            <div className="p-3 bg-slate-50 flex items-center justify-between border-t border-slate-100 gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block font-mono truncate">{rawDomain.toUpperCase()}</span>
                <h5 className="text-xs font-bold text-slate-900 truncate leading-snug">{creative.headline}</h5>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-[#1877F2] hover:bg-blue-600 text-white text-xs font-medium transition-colors shrink-0"
              >
                {creative.callToAction || 'Dapatkan Sebut Harga'}
              </button>
            </div>

            {/* Engagement */}
            <div className="px-3.5 py-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100">
              <div className="flex items-center space-x-1.5">
                <div className="w-4 h-4 rounded-full bg-[#1877F2] flex items-center justify-center">
                  <ThumbsUp className="w-2.5 h-2.5 text-white fill-white" />
                </div>
                <span>348</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-400">
                <span>52 komen</span>
                <span>24 perkongsian</span>
              </div>
            </div>
          </div>
        )}

        {/* 2B. Facebook Story / Reels Format */}
        {activeFormat === 'story' && (
          <div className="relative aspect-[9/16] max-w-[260px] mx-auto rounded-3xl overflow-hidden bg-slate-950 text-white flex flex-col justify-between p-3.5 shadow-md">
            {/* Background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creative.imageUrl || '/images/prod_sportswear.jpg'}
              alt="Story Ad"
              className="absolute inset-0 w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />

            {/* Top Bar */}
            <div className="relative z-10 space-y-2">
              <div className="w-full bg-white/30 h-0.5 rounded-full overflow-hidden">
                <div className="w-2/3 bg-white h-full" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-[9px]">
                  {brandInitials}
                </div>
                <div className="min-w-0">
                  <span className="text-[11px] font-semibold text-white block truncate">{brandName}</span>
                  <span className="text-[9px] text-white/70 block">Tajaan</span>
                </div>
              </div>
            </div>

            {/* Bottom Content & CTA */}
            <div className="relative z-10 space-y-2.5 text-left">
              <p className="text-[11px] text-white/95 line-clamp-3 leading-snug">
                {creative.primaryText}
              </p>
              <button
                type="button"
                className="w-full py-2 rounded-full bg-[#1877F2] hover:bg-blue-600 text-white font-semibold text-xs transition-colors text-center flex items-center justify-center space-x-1"
              >
                <span>{creative.callToAction || 'Ketahui Lanjut'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 2C. Facebook Right Column Banner */}
        {activeFormat === 'right_column' && (
          <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs font-sans text-left max-w-xs mx-auto space-y-2">
            <div className="relative aspect-[16/9] w-full bg-slate-100 rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creative.imageUrl || '/images/prod_sportswear.jpg'}
                alt="Right Column Ad"
                className="w-full h-full object-cover"
              />
              <span className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[8px] px-1.5 py-0.2 rounded font-medium">
                Tajaan
              </span>
            </div>
            <div className="space-y-0.5">
              <h5 className="text-xs font-bold text-slate-900 truncate">{creative.headline}</h5>
              <span className="text-[10px] text-slate-400 font-mono block truncate">{rawDomain}</span>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed pt-1">
                {creative.primaryText}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= 3. INSTAGRAM ADS =================
  if (platform === 'instagram') {
    return (
      <div className="space-y-4">
        {renderFormatSwitcher()}

        {/* 3A. Instagram Feed Post */}
        {activeFormat === 'feed' && (
          <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-2xs font-sans text-left max-w-sm mx-auto">
            {/* Header */}
            <div className="p-3 flex items-center justify-between border-b border-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shrink-0">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[8px] text-slate-900">
                    {brandInitials}
                  </div>
                </div>
                <div>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-semibold text-slate-900">{socialHandle.replace('@', '')}</span>
                    <InstagramLogo className="w-3 h-3" />
                  </div>
                  <span className="text-[9px] text-slate-400 block">Dibiayai</span>
                </div>
              </div>
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </div>

            {/* Photo */}
            <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={creative.imageUrl || '/images/prod_sportswear.jpg'}
                alt="Instagram Creative"
                className="w-full h-full object-cover"
              />
            </div>

            {/* CTA Strip */}
            <div className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white flex items-center justify-between cursor-pointer transition-colors">
              <span className="text-xs font-medium">{creative.callToAction || 'Ketahui Lebih Lanjut'}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            </div>

            {/* Action Buttons */}
            <div className="px-3.5 pt-2.5 pb-1 flex items-center justify-between text-slate-800">
              <div className="flex items-center space-x-3.5">
                <Heart className="w-4 h-4 hover:text-rose-600 transition-colors cursor-pointer" />
                <MessageCircle className="w-4 h-4 hover:text-slate-900 transition-colors cursor-pointer" />
                <Send className="w-4 h-4 hover:text-slate-900 transition-colors cursor-pointer" />
              </div>
              <Bookmark className="w-4 h-4 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer" />
            </div>

            {/* Caption */}
            <div className="px-3.5 pb-3 pt-1 text-xs text-slate-800 leading-relaxed space-y-1">
              <p className="line-clamp-3">
                <span className="font-semibold text-slate-900 mr-1.5">{socialHandle.replace('@', '')}</span>
                {creative.primaryText}
              </p>
              <span className="text-[10px] text-slate-400 block">Lihat semua 48 komen</span>
            </div>
          </div>
        )}

        {/* 3B. Instagram Stories */}
        {activeFormat === 'story' && (
          <div className="relative aspect-[9/16] max-w-[260px] mx-auto rounded-3xl overflow-hidden bg-slate-950 text-white flex flex-col justify-between p-3.5 shadow-md">
            {/* Background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creative.imageUrl || '/images/prod_sportswear.jpg'}
              alt="Instagram Story"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/40" />

            {/* Top Bar */}
            <div className="relative z-10 space-y-2">
              <div className="w-full bg-white/30 h-0.5 rounded-full overflow-hidden">
                <div className="w-1/2 bg-white h-full" />
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                  <div className="w-full h-full rounded-full bg-white flex items-center justify-center font-bold text-[8px] text-slate-900">
                    {brandInitials}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-white block truncate">{socialHandle.replace('@', '')}</span>
                  <span className="text-[9px] text-white/70 block">Dibiayai</span>
                </div>
              </div>
            </div>

            {/* Bottom Swipe Up Bar */}
            <div className="relative z-10 space-y-2 text-center">
              <p className="text-[11px] text-white line-clamp-2 text-left leading-snug">
                {creative.headline}
              </p>
              <div className="bg-white/20 backdrop-blur-md rounded-full py-2 px-3 flex items-center justify-center space-x-1">
                <span className="text-xs font-semibold text-white">{creative.callToAction || 'Ketahui Lanjut'}</span>
                <ChevronRight className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>
        )}

        {/* 3C. Instagram Reels */}
        {activeFormat === 'reels' && (
          <div className="relative aspect-[9/16] max-w-[260px] mx-auto rounded-3xl overflow-hidden bg-slate-950 text-white flex flex-col justify-between p-3.5 shadow-md">
            {/* Background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creative.imageUrl || '/images/prod_sportswear.jpg'}
              alt="Instagram Reels"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

            <div className="relative z-10 flex justify-between items-center text-[10px] font-medium text-white/80">
              <span>Reels</span>
              <span className="bg-black/40 px-2 py-0.5 rounded-full">Dibiayai</span>
            </div>

            {/* Bottom & Right Action Column */}
            <div className="relative z-10 flex items-end justify-between gap-2">
              <div className="space-y-1.5 text-left flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <div className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-[8px]">
                    {brandInitials}
                  </div>
                  <span className="text-xs font-semibold text-white truncate">{socialHandle.replace('@', '')}</span>
                </div>
                <p className="text-[10px] text-white/90 line-clamp-2 leading-tight">
                  {creative.primaryText}
                </p>
                <div className="flex items-center space-x-1 text-[9px] text-white/70">
                  <Music className="w-2.5 h-2.5" />
                  <span className="truncate">Audio Asli · {brandName}</span>
                </div>
              </div>

              {/* Right Side Icons */}
              <div className="flex flex-col items-center space-y-2.5 shrink-0 text-white">
                <div className="flex flex-col items-center">
                  <Heart className="w-4 h-4 fill-white" />
                  <span className="text-[9px] mt-0.5">1.4k</span>
                </div>
                <div className="flex flex-col items-center">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-[9px] mt-0.5">84</span>
                </div>
                <div className="flex flex-col items-center">
                  <Send className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= 4. TIKTOK ADS =================
  if (platform === 'tiktok') {
    return (
      <div className="space-y-4">
        {renderFormatSwitcher()}

        {/* 4A. TikTok In-Feed Video */}
        {activeFormat === 'infeed' && (
          <div className="relative aspect-[9/16] max-w-[260px] mx-auto rounded-3xl overflow-hidden bg-slate-900 text-white flex flex-col justify-between p-3.5 shadow-md">
            {/* Background */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creative.imageUrl || '/images/prod_sportswear.jpg'}
              alt="TikTok Ad"
              className="absolute inset-0 w-full h-full object-cover opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-black/40" />

            <div className="relative z-10 flex justify-between items-center">
              <div className="flex items-center space-x-1 bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-full text-[10px]">
                <TikTokLogo className="w-3 h-3 fill-white" />
                <span className="font-medium text-white">Tajaan</span>
              </div>
            </div>

            {/* Bottom Content & Right Rail */}
            <div className="relative z-10 flex items-end justify-between gap-2 text-left">
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <div className="w-6 h-6 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-[9px]">
                    {brandInitials}
                  </div>
                  <span className="text-xs font-semibold text-white truncate">{socialHandle}</span>
                </div>

                <p className="text-[10px] text-white/90 line-clamp-3 leading-snug">
                  {creative.primaryText}
                </p>

                <button
                  type="button"
                  className="w-full py-2 rounded-full bg-[#FE2C55] hover:bg-[#E0264B] text-white font-semibold text-xs transition-colors text-center"
                >
                  {creative.callToAction || 'Tempah Sekarang'}
                </button>
              </div>

              {/* TikTok Right Rail */}
              <div className="flex flex-col items-center space-y-3 shrink-0 text-white">
                <div className="flex flex-col items-center">
                  <Heart className="w-4 h-4 fill-[#FE2C55] text-[#FE2C55]" />
                  <span className="text-[9px] mt-0.5 font-mono">12.4K</span>
                </div>
                <div className="flex flex-col items-center">
                  <MessageCircle className="w-4 h-4" />
                  <span className="text-[9px] mt-0.5 font-mono">382</span>
                </div>
                <div className="flex flex-col items-center">
                  <Share2 className="w-4 h-4" />
                  <span className="text-[9px] mt-0.5 font-mono">140</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4B. TikTok TopView Fullscreen */}
        {activeFormat === 'topview' && (
          <div className="relative aspect-[9/16] max-w-[260px] mx-auto rounded-3xl overflow-hidden bg-black text-white flex flex-col justify-between p-3.5 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creative.imageUrl || '/images/prod_sportswear.jpg'}
              alt="TikTok TopView"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60" />

            <div className="relative z-10 flex justify-between items-center">
              <span className="text-[9px] font-semibold bg-white/20 px-2 py-0.5 rounded text-white">
                TopView Brand Takeover
              </span>
              <span className="text-[9px] font-mono bg-black/60 text-white/80 px-2 py-0.5 rounded">
                Langkau 3s
              </span>
            </div>

            <div className="relative z-10 space-y-2 text-left">
              <h5 className="text-xs font-bold text-white leading-snug">{creative.headline}</h5>
              <p className="text-[10px] text-white/80 line-clamp-2">{creative.primaryText}</p>
              <button
                type="button"
                className="w-full py-2.5 rounded-full bg-white text-slate-900 font-bold text-xs transition-colors hover:bg-slate-100"
              >
                {creative.callToAction || 'Ketahui Tawaran'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ================= 5. WHATSAPP ADS =================
  return (
    <div className="space-y-4">
      {renderFormatSwitcher()}

      {/* 5A. Click-to-WhatsApp Feed Post */}
      {activeFormat === 'click_to_chat' && (
        <div className="bg-white rounded-2xl p-4 max-w-sm mx-auto text-left font-sans space-y-3 border border-slate-200 shadow-2xs">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
              <WhatsAppLogo className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h5 className="text-xs font-semibold text-slate-900">{brandName} (WhatsApp)</h5>
              <span className="text-[10px] text-slate-400 block">Iklan Terus WhatsApp Click-to-Chat</span>
            </div>
          </div>

          <div className="aspect-video rounded-xl overflow-hidden bg-slate-100 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creative.imageUrl || '/images/prod_sportswear.jpg'}
              alt="WhatsApp Ad Preview"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-1">
            <h5 className="text-xs font-bold text-slate-900 leading-snug">{creative.headline}</h5>
            <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-3">{creative.primaryText}</p>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50 text-xs text-emerald-900 space-y-1 border border-emerald-100">
            <div className="flex items-center space-x-1.5 font-semibold text-emerald-800 text-[11px]">
              <Phone className="w-3 h-3" />
              <span>Mesej Sedia Ada (Autofill):</span>
            </div>
            <p className="text-[11px] italic font-mono text-emerald-950">
              &ldquo;{creative.whatsappMessage || `Salam ${brandName}, saya berminat untuk tempahan jersi.`}&rdquo;
            </p>
          </div>

          <button
            type="button"
            className="w-full py-2 bg-[#25D366] hover:bg-[#1EBE5D] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5"
          >
            <WhatsAppLogo className="w-3.5 h-3.5 fill-white" />
            <span>Kirim Mesej WhatsApp</span>
          </button>
        </div>
      )}

      {/* 5B. Actual WhatsApp Chat App Screen */}
      {activeFormat === 'chat_screen' && (
        <div className="bg-[#EFEAE2] rounded-3xl overflow-hidden border border-slate-300 shadow-sm font-sans text-left max-w-sm mx-auto">
          {/* WhatsApp Header Bar */}
          <div className="bg-[#075E54] text-white p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-xs shrink-0">
                {brandInitials}
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <span className="text-xs font-bold text-white">{brandName}</span>
                  <div className="w-3 h-3 rounded-full bg-emerald-400 flex items-center justify-center">
                    <Check className="w-2 h-2 text-slate-900 stroke-[3]" />
                  </div>
                </div>
                <span className="text-[9px] text-emerald-100 block">Akaun Perniagaan Sah</span>
              </div>
            </div>
            <div className="text-xs text-white/80 font-mono text-[10px]">
              {phoneDisplay}
            </div>
          </div>

          {/* Chat Canvas */}
          <div className="p-3.5 space-y-3 min-h-[220px] flex flex-col justify-end">
            {/* Timestamp Badge */}
            <div className="text-center">
              <span className="text-[9px] font-medium bg-white/80 text-slate-600 px-2 py-0.5 rounded shadow-2xs">
                HARI INI
              </span>
            </div>

            {/* Outgoing Message Bubble (Customer autofill from ad) */}
            <div className="flex justify-end">
              <div className="bg-[#D9FDD3] text-slate-800 rounded-2xl rounded-tr-xs p-2.5 max-w-[85%] shadow-2xs space-y-1">
                <p className="text-xs leading-relaxed">
                  {creative.whatsappMessage || `Salam ${brandName}, saya berminat untuk membuat tempahan jersi melalui iklan.`}
                </p>
                <div className="flex items-center justify-end space-x-1 text-[9px] text-slate-400">
                  <span>14:05</span>
                  <CheckCheck className="w-3 h-3 text-[#53bdeb]" />
                </div>
              </div>
            </div>

            {/* Incoming Automated Response Bubble */}
            <div className="flex justify-start">
              <div className="bg-white text-slate-800 rounded-2xl rounded-tl-xs p-2.5 max-w-[85%] shadow-2xs space-y-1">
                <p className="text-xs leading-relaxed">
                  Salam! Terima kasih kerana menghubungi {brandName}. Berapa kuantiti helai jersi yang anda rancang untuk tempah?
                </p>
                <div className="flex items-center justify-end text-[9px] text-slate-400">
                  <span>14:06</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Simulated Input Bar */}
          <div className="bg-slate-100 p-2 flex items-center space-x-2 border-t border-slate-200">
            <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-xs text-slate-400">
              Tulis mesej...
            </div>
            <div className="w-7 h-7 rounded-full bg-[#075E54] text-white flex items-center justify-center shrink-0">
              <Send className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
