'use client';

import React from 'react';
import { AdCreative, AdPlatform } from '@/types/ads';
import { Globe, MoreHorizontal, ThumbsUp, MessageCircle, Share2, Phone, Sparkles } from 'lucide-react';

interface AdPreviewCardProps {
  platform: AdPlatform;
  creative: AdCreative;
}

export default function AdPreviewCard({ platform, creative }: AdPreviewCardProps) {
  if (platform === 'google') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs font-sans text-left">
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span className="font-bold text-slate-800 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">Tajaan</span>
          <span className="text-slate-400">·</span>
          <span>https://svfapparel.my/katalog</span>
        </div>

        <div className="space-y-1">
          <h4 className="text-base text-blue-700 hover:underline cursor-pointer font-medium leading-snug">
            {creative.headline || 'Kilang Cetak Jersi Sublimasi & DTF Malaysia'}
          </h4>
          {creative.secondaryHeadline && (
            <span className="text-sm text-blue-800 block -mt-0.5">
              {creative.secondaryHeadline}
            </span>
          )}
          <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
            {creative.primaryText || 'Tempah jersi sublimasi berkualiti tinggi dari kilang. Kain selesa, warna tajam, rekaan percuma.'}
          </p>
        </div>

        {/* Extensions */}
        <div className="pt-2 flex flex-wrap gap-2 text-xs border-t border-slate-100 text-blue-600">
          <span className="bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer">
            Katalog Jersi 2026
          </span>
          <span className="bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer">
            Sebut Harga Pantas
          </span>
          <span className="bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 cursor-pointer">
            Hubungi WhatsApp
          </span>
        </div>
      </div>
    );
  }

  if (platform === 'meta') {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs font-sans text-left max-w-sm mx-auto">
        {/* Post Header */}
        <div className="p-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              SFV
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-xs font-semibold text-slate-900">SVF Apparel</span>
                <span className="text-[10px] text-blue-600 font-bold">✓</span>
              </div>
              <span className="text-[10px] text-slate-400 block">Tajaan · Bersama Facebook & Instagram</span>
            </div>
          </div>
          <MoreHorizontal className="w-4 h-4 text-slate-400" />
        </div>

        {/* Primary Text */}
        <div className="px-3.5 pb-2.5 text-xs text-slate-800 whitespace-pre-line leading-relaxed">
          {creative.primaryText}
        </div>

        {/* Ad Image */}
        <div className="relative aspect-square w-full bg-slate-100 overflow-hidden border-y border-slate-100">
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
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">SVFAPPAREL.MY</span>
            <h5 className="text-xs font-bold text-slate-900 truncate">{creative.headline}</h5>
          </div>
          <button
            type="button"
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold shrink-0"
          >
            {creative.callToAction || 'Kirim Mesej'}
          </button>
        </div>

        {/* Social Metrics */}
        <div className="px-3.5 py-2 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1">
            <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-[11px]">342 sukaan</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span>48 komen</span>
            <span>19 perkongsian</span>
          </div>
        </div>
      </div>
    );
  }

  if (platform === 'tiktok') {
    return (
      <div className="relative aspect-[9/16] max-w-[260px] mx-auto rounded-3xl overflow-hidden bg-slate-900 text-white shadow-lg flex flex-col justify-between p-4">
        {/* Background mockup image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={creative.imageUrl || '/images/prod_sportswear.jpg'}
          alt="TikTok Ad"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

        <div className="relative z-10 flex justify-between items-center text-xs">
          <span className="text-[10px] font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded">Tajaan</span>
        </div>

        {/* Bottom Ad overlay */}
        <div className="relative z-10 space-y-2 text-left">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-white text-slate-900 flex items-center justify-center font-bold text-[10px]">
              SFV
            </div>
            <span className="text-xs font-semibold">@svfapparel</span>
          </div>

          <p className="text-[11px] text-white/90 line-clamp-3 leading-snug">
            {creative.primaryText}
          </p>

          <button
            type="button"
            className="w-full py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-md transition-colors"
          >
            {creative.callToAction || 'Tempah Sekarang'}
          </button>
        </div>
      </div>
    );
  }

  // WhatsApp
  return (
    <div className="bg-[#EFEAE2] rounded-3xl border border-slate-200 p-4 max-w-sm mx-auto shadow-xs text-left font-sans space-y-3">
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

        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
          <div className="flex items-center space-x-1.5 font-semibold text-emerald-800">
            <Phone className="w-3.5 h-3.5" />
            <span>Mesej WhatsApp Autogrip:</span>
          </div>
          <p className="text-[11px] italic font-mono text-emerald-950">
            &ldquo;{creative.whatsappMessage || 'Salam SVF, saya berminat untuk tempahan jersi.'}&rdquo;
          </p>
        </div>
      </div>

      <div className="text-center">
        <span className="text-[10px] text-slate-400">
          Pelanggan akan dibawa terus ke perbualan WhatsApp rasmi SVF APPAREL.
        </span>
      </div>
    </div>
  );
}
