'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { 
  Play,
  Plus,
  ChevronLeft,
  ChevronRight, 
  ChevronDown,
  ShieldCheck,
  Truck,
  Clock,
  CheckCircle2,
  Quote,
  Building2,
  Zap,
  PackageCheck,
  ZoomIn,
  Maximize2,
  X,
  Star,
  Sparkles,
  Award,
  ThumbsUp,
  MapPin,
  Navigation,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { FaWhatsapp, FaTiktok, FaFacebookF, FaInstagram, FaTelegram } from 'react-icons/fa6';
import { formatWhatsAppLink } from '@/lib/whatsapp/dynamic-link';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import { useAppStore } from '@/lib/store/app-store';
import { 
  CmsHeroBanner, 
  CmsService, 
  CmsProductionVideo, 
  CmsProductionGalleryItem, 
  CmsTestimonial, 
  CmsPolicy,
  CmsTrustBadge
} from '@/types/database';
import { INITIAL_CMS_TRUST_BADGES, INITIAL_CMS_HERO_BANNERS } from '@/lib/store/seed-data';
import { BADGE_THEMES, getTrustIconComponent } from '@/lib/cms/trust-badge-utils';

interface StepDetail {
  step: string;
  title: string;
  desc: string;
  detailTitle: string;
  detailDesc: string;
  points: string[];
}

const ORDER_STEPS: StepDetail[] = [
  {
    step: '01',
    title: 'Pilih Rekaan & Fabrik',
    desc: 'Pilih templat katalog atau muat naik fail rekaan khas anda.',
    detailTitle: 'Langkah 1: Rekaan & Jenis Fabrik',
    detailDesc: 'Pilih mana-mana templat sedia ada dari galeri katalog kami, atau muat naik fail rekaan anda sendiri (AI/PDF). Pereka kami sedia membantu menghasilkan visual awal.',
    points: [
      'Pilihan fabrik Microfiber Mini Eyelet, Interlock, atau Cotton Combed',
      'Penyesuaian warna Pantone & penjenamaan percuma',
      'Pilihan pelbagai jenis kolar (V-Neck, Roundneck, Polo Button)'
    ]
  },
  {
    step: '02',
    title: 'Tetapkan Saiz & Nama',
    desc: 'Senarai pecahan saiz pasukan dari saiz kanak-kanak hingga 7XL.',
    detailTitle: 'Langkah 2: Senarai Nama & Saiz',
    detailDesc: 'Masukkan senarai nama pemain, saiz, dan nombor jersi dengan mudah melalui borang digital atau muat naik fail senarai pasukan anda.',
    points: [
      'Saiz lengkap kanak-kanak (24-32) hingga dewasa (XS-7XL)',
      'Cetakan nama dan nombor jersi percuma tanpa had huruf',
      'Pilihan potongan lengan pendek, lengan panjang, atau Muslimah'
    ]
  },
  {
    step: '03',
    title: 'Pembayaran Downpayment (DP)',
    desc: 'Buat bayaran deposit untuk pengesahan slot produksi kilang.',
    detailTitle: 'Langkah 3: Pembayaran Downpayment (DP)',
    detailDesc: 'Selepas perincian pesanan dipersetujui, buat bayaran deposit (DownPayment) untuk mengesahkan slot pengeluaran kilang serta penyediaan fabrik dan bahan cetakan.',
    points: [
      'Pembayaran selamat melalui FPX Online Banking, DuitNow QR, atau Kad Bank',
      'Invois rasmi dan resit pembayaran digital dijana serta-merta',
      'Baki bayaran hanya perlu dijelaskan setelah jersi siap sebelum urusan pos'
    ]
  },
  {
    step: '04',
    title: 'Pengeluaran & Pos Pantas',
    desc: 'Pesanan diproses kilang, lulus QC dan dihantar terus kepada anda.',
    detailTitle: 'Langkah 4: Pengeluaran Kilang & Penghantaran',
    detailDesc: 'Pesanan anda terus memasuki barisan cetakan dan jahitan kilang berteknologi tinggi, melalui semakan kualiti (QC) rapi sebelum dipos terus ke alamat anda.',
    points: [
      'Tempoh siap standard 5 hingga 9 hari bekerja',
      'Pemeriksaan kualiti setiap helai pakaian (QC Pass)',
      'Nombor penjejakan kurier (tracking number) masa nyata disediakan'
    ]
  },
];

const renderPlatformIcon = (platform: CmsTestimonial['platform']) => {
  switch (platform) {
    case 'google':
      return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.02 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <circle cx="12" cy="12" r="12" fill="#000000"/>
          <path d="M16.5 8.5a3.5 3.5 0 0 1-2.5-2.5V5h-2v9a2 2 0 1 1-2-2c.3 0 .6.1.8.2V10a4 4 0 1 0 3.2 3.9V9.2a5.5 5.5 0 0 0 2.5.8V8.5z" fill="#FFFFFF"/>
          <path d="M15 7.5a3.5 3.5 0 0 1-1-.5V6h-1v8a2 2 0 1 1-2-2c.2 0 .4 0 .6.1V11a3 3 0 1 0 2.4 2.9V9a4.5 4.5 0 0 0 2 .5V7.5z" fill="#25F4EE"/>
          <path d="M16 8a3.5 3.5 0 0 1-2-.5V7h-1v8a2 2 0 1 1-2-2c.2 0 .4 0 .6.1V11.5a3 3 0 1 0 2.4 2.9V9.5a4.5 4.5 0 0 0 2 .5V8z" fill="#FE2C55"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
          <path d="M16.67 15.543l.532-3.47h-3.328v-2.25c0-.949.465-1.874 1.956-1.874h1.514V4.996s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.643H7.078v3.47h3.047v8.385a12.1 12.1 0 003.875 0v-8.385h2.67z" fill="#FFFFFF"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            <radialGradient id="ig-radial-logo" cx="30%" cy="107%" r="130%" fx="30%" fy="107%">
              <stop offset="0%" stopColor="#fdf497" />
              <stop offset="5%" stopColor="#fdf497" />
              <stop offset="45%" stopColor="#fd5949" />
              <stop offset="60%" stopColor="#d6249f" />
              <stop offset="90%" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#ig-radial-logo)" />
          <rect x="5" y="5" width="14" height="14" rx="4" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="3.3" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
          <circle cx="15.8" cy="8.2" r="1.05" fill="#FFFFFF" />
        </svg>
      );
  }
};

export default function HomePage() {
  const {
    isLoadingCms,
    heroBanners,
    trustBadges,
    services,
    productionVideos,
    productionGallery,
    testimonials,
    sloganQuote,
    companySettings,
    policies,
  } = useAppStore();

  const activeBanners = heroBanners.filter((b) => b.is_active);
  const activeServices = services.filter((s) => s.is_active);
  const activeVideos = productionVideos.filter((v) => v.is_active);
  const activeGallery = productionGallery.filter((g) => g.is_active);
  const activeTestimonials = testimonials.filter((t) => t.is_active);

  const [selectedProduct, setSelectedProduct] = useState<CmsService | null>(null);
  const [isProductSheetOpen, setIsProductSheetOpen] = useState(false);

  const [selectedGalleryItem, setSelectedGalleryItem] = useState<CmsProductionGalleryItem | null>(null);
  const [isGallerySheetOpen, setIsGallerySheetOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [selectedStep, setSelectedStep] = useState<StepDetail>(ORDER_STEPS[0]);
  const [isStepSheetOpen, setIsStepSheetOpen] = useState(false);

  const [selectedPolicyKey, setSelectedPolicyKey] = useState<'privacy' | 'terms' | 'warranty' | 'shipping'>('privacy');
  const [isPolicySheetOpen, setIsPolicySheetOpen] = useState(false);

  const [isLocationSheetOpen, setIsLocationSheetOpen] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);

  const handleCopyAddress = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2500);
    }
  };

  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // -------------------------------------------------------------
  // HERO BANNER AUTO-SWAP SLIDER STATE & TIMER
  // -------------------------------------------------------------
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  // -------------------------------------------------------------
  // PRODUCTION GALLERY AUTO-SWAP STATE & TIMER
  // -------------------------------------------------------------
  const galleryScrollRef = useRef<HTMLDivElement>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [isGalleryPaused, setIsGalleryPaused] = useState(false);

  useEffect(() => {
    if (isGalleryPaused || activeGallery.length <= 1) return;

    const interval = setInterval(() => {
      if (!galleryScrollRef.current) return;
      const container = galleryScrollRef.current;
      const nextIndex = (activeGalleryIndex + 1) % activeGallery.length;
      const child = container.children[nextIndex] as HTMLElement;
      if (child) {
        const scrollLeft = child.offsetLeft - (container.clientWidth - child.offsetWidth) / 2;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
      setActiveGalleryIndex(nextIndex);
    }, 3800);

    return () => clearInterval(interval);
  }, [isGalleryPaused, activeGalleryIndex, activeGallery.length]);

  const scrollToGallery = (index: number) => {
    if (!galleryScrollRef.current) return;
    const container = galleryScrollRef.current;
    const child = container.children[index] as HTMLElement;
    if (child) {
      const scrollLeft = child.offsetLeft - (container.clientWidth - child.offsetWidth) / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
    setActiveGalleryIndex(index);
  };

  const handleGalleryScroll = () => {
    if (!galleryScrollRef.current) return;
    const container = galleryScrollRef.current;
    const scrollCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child, index) => {
      const el = child as HTMLElement;
      const childCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(scrollCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeGalleryIndex) {
      setActiveGalleryIndex(closestIndex);
    }
  };

  // -------------------------------------------------------------
  // TESTIMONIAL AUTO-SWAP STATE & TIMER
  // -------------------------------------------------------------
  const testimonialScrollRef = useRef<HTMLDivElement>(null);
  const [activeTestiIndex, setActiveTestiIndex] = useState(0);
  const [isTestiPaused, setIsTestiPaused] = useState(false);

  useEffect(() => {
    if (isTestiPaused || activeTestimonials.length <= 1) return;

    const interval = setInterval(() => {
      if (!testimonialScrollRef.current) return;
      const container = testimonialScrollRef.current;
      const nextIndex = (activeTestiIndex + 1) % activeTestimonials.length;
      const child = container.children[nextIndex] as HTMLElement;
      if (child) {
        const scrollLeft = child.offsetLeft - (container.clientWidth - child.offsetWidth) / 2;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
      }
      setActiveTestiIndex(nextIndex);
    }, 4200);

    return () => clearInterval(interval);
  }, [isTestiPaused, activeTestiIndex, activeTestimonials.length]);

  const scrollToTestimonial = (index: number) => {
    if (!testimonialScrollRef.current) return;
    const container = testimonialScrollRef.current;
    const child = container.children[index] as HTMLElement;
    if (child) {
      const scrollLeft = child.offsetLeft - (container.clientWidth - child.offsetWidth) / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
    setActiveTestiIndex(index);
  };

  const handleTestiScroll = () => {
    if (!testimonialScrollRef.current) return;
    const container = testimonialScrollRef.current;
    const scrollCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    Array.from(container.children).forEach((child, index) => {
      const el = child as HTMLElement;
      const childCenter = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(scrollCenter - childCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    if (closestIndex !== activeTestiIndex) {
      setActiveTestiIndex(closestIndex);
    }
  };

  const handleOpenProduct = (product: CmsService) => {
    setSelectedProduct(product);
    setIsProductSheetOpen(true);
  };

  const handleOpenGalleryItem = (item: CmsProductionGalleryItem) => {
    setSelectedGalleryItem(item);
    setIsGallerySheetOpen(true);
  };

  const handleOpenStep = (step: StepDetail) => {
    setSelectedStep(step);
    setIsStepSheetOpen(true);
  };

  const handleOpenPolicy = (policyKey: 'privacy' | 'terms' | 'warranty' | 'shipping') => {
    setSelectedPolicyKey(policyKey);
    setIsPolicySheetOpen(true);
  };

  // -------------------------------------------------------------
  // TRUST BADGES AUTO-SLIDE CARD SWAP STATE & TIMER
  // -------------------------------------------------------------
  const [activeTrustIndex, setActiveTrustIndex] = useState(0);
  const [isTrustPaused, setIsTrustPaused] = useState(false);

  const activeBadges = (trustBadges && trustBadges.length > 0)
    ? trustBadges.filter((b) => b.is_active)
    : INITIAL_CMS_TRUST_BADGES;
  const safeTrustBadges = activeBadges.length > 0 ? activeBadges : INITIAL_CMS_TRUST_BADGES;

  useEffect(() => {
    if (isTrustPaused || safeTrustBadges.length <= 1) return;
    const interval = setInterval(() => {
      setActiveTrustIndex((prev) => (prev + 1) % safeTrustBadges.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isTrustPaused, safeTrustBadges.length]);

  const currentTrust = safeTrustBadges[activeTrustIndex] || safeTrustBadges[0] || INITIAL_CMS_TRUST_BADGES[0];
  const TrustIcon = getTrustIconComponent(currentTrust.icon_name);
  const currentTheme = BADGE_THEMES[currentTrust.color_theme] || BADGE_THEMES.sky;

  const bannersToRender = (activeBanners && activeBanners.length > 0)
    ? activeBanners
    : INITIAL_CMS_HERO_BANNERS;

  return (
    <div className="w-full select-none font-ios">
      {/* Primary Semantic H1 for Search Engine Crawlers */}
      <h1 className="sr-only">Kilang Cetak Jersi Sublimasi &amp; Baju DTF | SFV APPAREL Malaysia</h1>

      {/* =========================================================================
          SECTION 1: HERO & PILIHAN SERVIS (iOS Canvas Tint - Kad Putih Timbul & Jelas)
         ========================================================================= */}
      <div className="w-full bg-[#F2F2F7] pt-3 pb-8 px-4 space-y-6">
        {/* 1. DYNAMIC HERO SECTION WITH MULTI-SLIDE BANNER (Liquid Frosted Glass Design) */}
        <div className="relative w-full h-[255px] sm:h-[280px] rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-md shadow-slate-200/60 border border-white/80 bg-slate-100 group">
          {/* Stacked All Banner Layers for Silky Smooth Cross-Fade */}
          {bannersToRender.map((banner, index) => {
            const isActive = index === activeBannerIndex;
            const isFirst = index === 0;
            return (
              <div
                key={banner.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                {/* Full-bleed Natural Photo (No dark overlay) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.image_url}
                  alt={banner.title}
                  width={540}
                  height={304}
                  loading={isFirst ? 'eager' : 'lazy'}
                  decoding="async"
                  {...(isFirst ? { fetchPriority: 'high' } : {})}
                  className="w-full h-full object-cover object-[center_20%] transform-gpu will-change-transform"
                />

                {/* Top Status Pill - Clean Light Frosted Glass */}
                <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2">
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-white/80 text-slate-900 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold tracking-tight text-slate-900">
                      {banner.status_pill}
                    </span>
                  </div>
                </div>

                {/* Bottom Frosted Glass Panel - Light iOS Liquid Glass Theme */}
                <div className="absolute inset-x-0 bottom-0 z-20 bg-white/85 backdrop-blur-xl border-t border-white/80 px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-xs">
                  <div className="space-y-0.5 pr-3 min-w-0">
                    <h2 className="text-[15px] sm:text-[17px] font-bold text-slate-900 tracking-tight leading-tight truncate">
                      {banner.title}
                    </h2>
                    <p className="text-[11px] sm:text-xs font-semibold text-slate-600 truncate">
                      {banner.tag_text}
                    </p>
                  </div>

                  {/* Action Capsule Button */}
                  <Link
                    href={banner.button_link || '/catalog'}
                    className="px-3.5 py-1.5 sm:px-4 sm:py-2 min-h-[36px] rounded-full bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 active:scale-95 text-white text-xs font-bold tracking-tight shadow-sm transition-all flex items-center space-x-1 shrink-0"
                  >
                    <span>{banner.button_text}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-white/90" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Hero Banner Auto-Timer / Play Loading Glassmorphic Ring */}
          {bannersToRender.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveBannerIndex((prev) => (prev + 1) % bannersToRender.length);
              }}
              aria-label="Slaid seterusnya"
              className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-white/80 shadow-xs flex items-center justify-center text-slate-900 hover:bg-white active:scale-90 transition-all cursor-pointer group"
              title="Slaid seterusnya"
            >
              <svg className="w-5 h-5 -rotate-90 pointer-events-none" viewBox="0 0 24 24">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="2"
                />
                <circle
                  key={`banner-ring-${activeBannerIndex}`}
                  cx="12"
                  cy="12"
                  r="9"
                  fill="none"
                  stroke="#0052FF"
                  strokeWidth="2"
                  strokeDasharray="56.54"
                  strokeDashoffset="56.54"
                  strokeLinecap="round"
                  className="animate-banner-progress"
                />
              </svg>
              <Play className="w-2.5 h-2.5 fill-[#0052FF] text-[#0052FF] ml-0.5 absolute pointer-events-none group-hover:scale-110 transition-transform" />
            </button>
          )}
        </div>

        {/* 1.5 VALUE PROPOSITION / TRUST CARD SWAP (Compact, Soft Color & Auto-Slide) */}
        <div 
          className={`relative overflow-hidden rounded-2xl border ${currentTheme.border} bg-gradient-to-r ${currentTheme.gradient} p-3 sm:p-3.5 shadow-xs transition-all duration-500 cursor-pointer select-none group`}
          onMouseEnter={() => setIsTrustPaused(true)}
          onMouseLeave={() => setIsTrustPaused(false)}
          onClick={() => setActiveTrustIndex((prev) => (prev + 1) % safeTrustBadges.length)}
          role="button"
          tabIndex={0}
          aria-label={`Jaminan: ${currentTrust.title}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Soft Animated Icon with smooth swap entrance */}
              <div 
                key={`icon-${currentTrust.id}-${activeTrustIndex}`}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${currentTheme.iconBg} flex items-center justify-center shrink-0 shadow-xs transition-all duration-300 group-hover:scale-105 animate-trust-swap`}
              >
                <TrustIcon className="w-5 h-5 stroke-[2.2]" />
              </div>

              {/* Text content with smooth crossfade typography */}
              <div key={`text-${currentTrust.id}-${activeTrustIndex}`} className="min-w-0 flex-1 animate-trust-swap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[12px] sm:text-[13px] font-bold text-slate-900 tracking-tight leading-tight">
                    {currentTrust.title}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${currentTheme.pillStyle} tracking-wide`}>
                    {currentTrust.pill}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[10.5px] text-slate-600 font-medium mt-0.5 truncate">
                  {currentTrust.desc}
                </p>
              </div>
            </div>

            {/* Chevron Right subtle affordance */}
            <div className="shrink-0 pl-1 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-200">
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 2. PILIHAN SERVIS HEADER & CARDS (DYNAMIC FROM CMS STORE) */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-end mb-1">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Pilihan Servis
              </h2>
              <p className="text-xs text-slate-600 font-normal tracking-wide mt-0.5">
                Cetakan & jahitan pakaian kustom terus dari kilang
              </p>
            </div>

            <Link
              href="/catalog"
              aria-label="Lihat Semua Servis"
              className="px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-[#0052FF] text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-xs border border-slate-200/80"
            >
              <span>Semua</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </Link>
          </div>

          {/* Card Produk Dinamik */}
          <div className="flex items-stretch gap-3.5 overflow-x-auto snap-x snap-mandatory scroll-pl-4 scroll-pr-4 scrollbar-none no-scrollbar -mx-4 px-4 pt-1 pb-4">
            {isLoadingCms && activeServices.length === 0 ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-[24px] overflow-hidden bg-white w-[235px] flex-shrink-0 border border-slate-200/80 shadow-xs p-4 space-y-3 animate-pulse"
                >
                  <div className="w-full h-44 bg-slate-200 rounded-2xl" />
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <div className="h-4 bg-slate-200 rounded w-16" />
                    <div className="w-9 h-9 rounded-full bg-slate-200" />
                  </div>
                </div>
              ))
            ) : (
              activeServices.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenProduct(item)}
                  className="group rounded-[24px] overflow-hidden bg-white w-[235px] flex-shrink-0 snap-start border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer select-none active:scale-[0.98] flex flex-col justify-between"
                >
                  {/* Bagian Gambar dengan Badge Khas */}
                  <div className="relative w-full h-44 bg-slate-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.title}
                      width={400}
                      height={300}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Floating Pill on Top-Left */}
                    <div className="absolute top-2.5 left-2.5 z-10">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-800 shadow-xs border border-white/80">
                        <span>{item.highlight || 'Kualiti Kilang'}</span>
                      </span>
                    </div>

                    {/* Subtle Index Pill on Top-Right */}
                    <div className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-black/30 backdrop-blur-md text-white text-[10px] font-bold flex items-center justify-center">
                      0{index + 1}
                    </div>
                  </div>

                  {/* Bagian Konten */}
                  <div className="p-3.5 flex flex-col justify-between flex-1 space-y-3">
                    <div>
                      <h3 className="font-bold text-[15px] text-slate-900 leading-snug group-hover:text-[#0052FF] transition-colors line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-slate-600 text-xs mt-0.5 line-clamp-2 leading-relaxed">
                        {item.headline || item.highlight || 'Pilihan fabrik microfiber berkualiti tinggi dan cetakan tahan lasak.'}
                      </p>
                    </div>

                    {/* Baris Harga & Butang Interaktif */}
                    <div className="pt-2.5 border-t border-slate-100 flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-[9.5px] font-bold uppercase tracking-wider text-[#0052FF]">
                          {item.price_prefix || 'Bermula'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
                            {item.price_amount}
                          </span>
                          {item.price_unit && (
                            <span className="text-[10.5px] font-semibold text-slate-600">
                              {item.price_unit}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProduct(item);
                        }}
                        aria-label={`Pilih ${item.title}`}
                        className="px-3 py-1.5 rounded-full bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white text-[11px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-1 shrink-0"
                      >
                        <span>Pilih</span>
                        <ChevronRight className="w-3 h-3 text-white/90" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: CARA TEMPAHAN & INFO (Soft Ice-Blue Tint)
         ========================================================================= */}
      <div className="w-full bg-gradient-to-b from-[#F2F6FE] to-[#F8FAFC] pt-8 pb-10 px-4 space-y-5 border-y border-blue-100/60">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cara Tempahan</h2>
            <p className="text-xs text-slate-500 mt-0.5">4 langkah ringkas untuk memulakan pesanan anda</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-blue-900/5 border border-blue-100/70">
          {ORDER_STEPS.map((item, idx) => {
            const isLast = idx === ORDER_STEPS.length - 1;
            return (
              <div
                key={item.step}
                onClick={() => handleOpenStep(item)}
                className="group flex items-center pl-3.5 bg-white hover:bg-blue-50/40 active:bg-blue-50/70 transition-all duration-200 cursor-pointer select-none"
              >
                <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 group-hover:bg-[#00BDFF] group-hover:text-white group-hover:scale-105 group-hover:shadow-sm group-hover:shadow-blue-500/20 flex items-center justify-center text-[#00BDFF] font-bold text-xs transition-all duration-200">
                  {item.step}
                </div>

                <div className={`flex-1 ml-3 py-3.5 pr-3.5 ${!isLast ? 'border-b border-gray-100' : ''} flex items-center justify-between min-w-0`}>
                  <div className="min-w-0 pr-2">
                    <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-[#00BDFF] leading-snug transition-colors duration-200">
                      {item.title}
                    </h3>
                    <p className="text-[11.5px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#00BDFF] group-hover:translate-x-0.5 shrink-0 ml-1.5 transition-all duration-200" />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl py-2 px-2.5 grid grid-cols-3 gap-2 items-center shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-center gap-1.5 text-slate-700 font-semibold text-[11px] py-1.5 px-1 rounded-xl bg-slate-50/90 border border-slate-100/90 min-w-0">
            <Clock className="w-3.5 h-3.5 text-[#00BDFF] shrink-0" />
            <span className="truncate">5 - 9 Hari</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-slate-700 font-semibold text-[11px] py-1.5 px-1 rounded-xl bg-slate-50/90 border border-slate-100/90 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">Jaminan Kilang</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-slate-700 font-semibold text-[11px] py-1.5 px-1 rounded-xl bg-slate-50/90 border border-slate-100/90 min-w-0">
            <Truck className="w-3.5 h-3.5 text-[#00BDFF] shrink-0" />
            <span className="truncate">Pos Seluruh MY</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DYNAMIC SLOGAN / QUOTE CARD (Apple-Grade Clean Frosted Glass Hero)
         ========================================================================= */}
      <div className="w-full bg-white pt-6 pb-2 px-4">
        <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-white via-sky-50/40 to-blue-50/60 p-5 sm:p-6 text-slate-900 shadow-[0_4px_24px_rgba(0,189,255,0.06)] border border-blue-100/90">
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#00BDFF]/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />
          <Quote className="absolute top-4 right-4 w-12 h-12 text-[#00BDFF]/10 rotate-180 pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#00BDFF]/10 text-[#00BDFF] text-[10.5px] font-bold tracking-wide">
              <span>★</span>
              <span>Kualiti & Servis Kilang</span>
            </div>

            <h3 className="text-[19px] sm:text-[21px] font-extrabold text-slate-900 tracking-tight leading-snug">
              {sloganQuote.headline} <br />
              <span className="text-[#00BDFF]">
                {sloganQuote.highlight_text}
              </span>
            </h3>

            <div className="space-y-1.5 pt-1.5 border-t border-slate-200/60">
              <p className="text-xs sm:text-[13px] font-bold text-slate-800 tracking-tight">
                {sloganQuote.question_text}
              </p>
              <p className="text-[11.5px] sm:text-xs text-slate-500 leading-relaxed font-normal">
                {sloganQuote.description_text}
              </p>
            </div>

            <div className="pt-1.5">
              <a
                href={formatWhatsAppLink(companySettings?.whatsapp_number, sloganQuote.whatsapp_message)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#00BDFF] hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-400/20 active:scale-95 transition-all"
              >
                <FaWhatsapp className="w-4 h-4 text-white" />
                <span>{sloganQuote.button_text}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: PROSES PRODUKSI (DYNAMIC VIDEO REEL)
         ========================================================================= */}
      {(isLoadingCms || activeVideos.length > 0) && (
        <div className="w-full bg-white pt-6 pb-12 px-4 border-t border-gray-100">
          <div className="mb-5 flex justify-between items-end">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Proses Produksi</h2>
              <p className="text-xs text-slate-500 mt-0.5">Lihat kualiti cetakan & kemasan jersi anda dihasilkan</p>
            </div>
          </div>

          <div 
            className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 scrollbar-none no-scrollbar" 
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {isLoadingCms && activeVideos.length === 0 ? (
              [1, 2].map((i) => (
                <div
                  key={i}
                  className="shrink-0 w-[72vw] max-w-[270px] aspect-[9/15] rounded-[28px] bg-slate-200 animate-pulse flex flex-col justify-end p-4 space-y-2"
                >
                  <div className="h-3 bg-slate-300 rounded w-1/3" />
                  <div className="h-5 bg-slate-300 rounded w-3/4" />
                </div>
              ))
            ) : (
              activeVideos.map((video) => (
                <div 
                  key={video.id}
                  className="relative shrink-0 w-[72vw] max-w-[270px] aspect-[9/15] rounded-[28px] overflow-hidden bg-slate-900 snap-center shadow-lg shadow-slate-900/10 border border-slate-200/80 transition-transform active:scale-[0.98]"
                >
                  {activeVideo === video.id ? (
                    <iframe 
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${video.youtube_id}?autoplay=1&controls=1&modestbranding=1&rel=0&playsinline=1`} 
                      title={video.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <div 
                      className="relative w-full h-full cursor-pointer group"
                      onClick={() => setActiveVideo(video.id)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title} 
                        width={270}
                        height={450}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

                      {/* Play Button */}
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full bg-white/35 group-hover:bg-[#00BDFF] backdrop-blur-xl border border-white/70 shadow-[0_8px_30px_rgba(0,0,0,0.3)] flex items-center justify-center text-white transition-all duration-300 group-hover:scale-110">
                          <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1 fill-white text-white drop-shadow-md" />
                        </div>
                      </div>

                      <div className="absolute inset-x-0 bottom-0 p-4 pb-5 z-10">
                        <span className="bg-[#00BDFF] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider mb-1.5 inline-block shadow-sm">
                          {video.category}
                        </span>
                        <h3 className="text-white font-bold text-[15px] sm:text-[16px] leading-snug drop-shadow-md">
                          {video.title}
                        </h3>
                        <p className="text-white/80 text-[11px] font-medium mt-1 flex items-center gap-1 group-hover:text-white transition-colors">
                          <span>Tonton rakaman</span>
                          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SECTION 3.5: HASIL PRODUKSI KILANG (DYNAMIC SHOWCASE CAROUSEL)
         ========================================================================= */}
      <div className="w-full bg-[#F8FAFC] pt-10 pb-12 px-4 border-t border-slate-200/70">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Hasil Produksi Kilang</h2>
          <p className="text-xs text-slate-500 mt-0.5">Koleksi gambar sebenar tempahan jersi & pakaian siap</p>
        </div>

        <div 
          ref={galleryScrollRef}
          onScroll={handleGalleryScroll}
          onMouseEnter={() => setIsGalleryPaused(true)}
          onMouseLeave={() => setIsGalleryPaused(false)}
          onTouchStart={() => setIsGalleryPaused(true)}
          onTouchEnd={() => setIsGalleryPaused(false)}
          className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 scrollbar-none no-scrollbar" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {isLoadingCms && activeGallery.length === 0 ? (
            [1, 2].map((i) => (
              <div
                key={i}
                className="shrink-0 w-[82vw] max-w-[320px] bg-white rounded-3xl overflow-hidden border border-slate-200/80 p-4 space-y-3 animate-pulse"
              >
                <div className="w-full aspect-[4/3.2] bg-slate-200 rounded-2xl" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))
          ) : (
            activeGallery.slice(0, 10).map((item, idx) => {
              const isActive = idx === activeGalleryIndex;
              return (
                <div 
                  key={item.id}
                  onClick={() => {
                    scrollToGallery(idx);
                    handleOpenGalleryItem(item);
                  }}
                  className={`shrink-0 w-[82vw] max-w-[320px] bg-white rounded-3xl overflow-hidden snap-center border transition-all duration-300 cursor-pointer flex flex-col justify-between group ${
                    isActive 
                      ? 'border-[#00BDFF] shadow-md shadow-blue-500/10 ring-2 ring-blue-500/20' 
                      : 'border-slate-200/80 shadow-sm opacity-90'
                  }`}
                >
                  <div className="relative w-full aspect-[4/3.2] bg-slate-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={item.image_url} 
                      alt={item.title} 
                      width={320}
                      height={256}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-3 left-3">
                      <span className="bg-white/95 backdrop-blur-md text-[#00BDFF] font-bold text-[10px] px-2.5 py-1 rounded-full shadow-xs border border-blue-100/60">
                        {item.tag}
                      </span>
                    </div>

                    {/* Zoom / Preview Hint Badge */}
                    <div className="absolute top-3 right-3 bg-black/45 backdrop-blur-md text-white p-1.5 rounded-full shadow-xs group-hover:bg-[#00BDFF] transition-colors">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between bg-white">
                    <div>
                      <h3 className="font-bold text-[15px] text-slate-900 leading-snug group-hover:text-[#00BDFF] transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[12px] text-slate-500 mt-1 line-clamp-1">
                        {item.fabric}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-400">
                        {item.client}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenGalleryItem(item);
                        }}
                        className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#00BDFF] hover:text-blue-700 transition-colors"
                      >
                        <ZoomIn className="w-3.5 h-3.5 text-[#00BDFF]" />
                        <span>Lihat Perincian</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {activeGallery.length > 1 && (
          <div className="flex justify-between items-center px-1 pt-2">
            {/* Sleek Progress Bar Indicator */}
            <div className="flex-1 max-w-[130px] sm:max-w-[180px] h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00BDFF] rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.max(12, 100 / activeGallery.length)}%`,
                  transform: `translateX(${activeGalleryIndex * (100 / (activeGallery.length - 1 || 1)) * (1 - (Math.max(12, 100 / activeGallery.length) / 100))}%)`
                }}
              />
            </div>

            {/* Clean Compact Counter & Navigation Buttons */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2 py-1 rounded-full shadow-xs">
              <button
                type="button"
                onClick={() => scrollToGallery(Math.max(0, activeGalleryIndex - 1))}
                disabled={activeGalleryIndex === 0}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 disabled:opacity-25 disabled:pointer-events-none hover:bg-slate-100 active:scale-95 transition-all"
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-medium text-slate-400 px-1">
                <strong className="text-slate-800 font-bold">{activeGalleryIndex + 1}</strong> / {activeGallery.length}
              </span>
              <button
                type="button"
                onClick={() => scrollToGallery(Math.min(activeGallery.length - 1, activeGalleryIndex + 1))}
                disabled={activeGalleryIndex === activeGallery.length - 1}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 disabled:opacity-25 disabled:pointer-events-none hover:bg-slate-100 active:scale-95 transition-all"
                aria-label="Seterusnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 4: TESTIMONI / REVIEWS (DYNAMIC FROM CMS STORE)
         ========================================================================= */}
      <div className="w-full bg-[#F2F2F7] pt-10 pb-14 px-4 border-t border-gray-200/60">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Apa Kata Mereka</h2>
          <p className="text-xs text-slate-500 mt-0.5">Ribuan pelanggan telah mempercayai kualiti jersi kami</p>
        </div>

        <div 
          ref={testimonialScrollRef}
          onScroll={handleTestiScroll}
          onMouseEnter={() => setIsTestiPaused(true)}
          onMouseLeave={() => setIsTestiPaused(false)}
          onTouchStart={() => setIsTestiPaused(true)}
          onTouchEnd={() => setIsTestiPaused(false)}
          className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x snap-mandatory scroll-pl-4 scroll-pr-4 scrollbar-none no-scrollbar" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {activeTestimonials.map((t, idx) => {
            const isActive = idx === activeTestiIndex;
            return (
              <div 
                key={t.id}
                onClick={() => scrollToTestimonial(idx)}
                className={`shrink-0 w-[80vw] max-w-[320px] bg-white rounded-[24px] p-5 snap-center border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isActive 
                    ? 'border-blue-200 shadow-md shadow-blue-900/5 ring-1 ring-blue-500/20' 
                    : 'border-gray-100 shadow-sm opacity-90'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${t.avatar_bg} flex items-center justify-center ${t.avatar_text} font-bold text-base shrink-0 shadow-xs`}>
                      {t.initial}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-[14px] leading-tight">{t.name}</h3>
                      <p className="text-[11.5px] text-slate-600 mt-0.5">{t.location}</p>
                    </div>
                  </div>
                  
                  <div className="w-5 h-5 shrink-0">
                    {renderPlatformIcon(t.platform)}
                  </div>
                </div>

                <div className="flex gap-1 mb-2.5">
                  {Array.from({ length: t.rating }).map((_, star) => (
                    <svg key={star} className="w-3.5 h-3.5 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-[12.5px] text-slate-700 leading-relaxed font-normal">
                  {t.review}
                </p>
              </div>
            );
          })}
        </div>

        {activeTestimonials.length > 1 && (
          <div className="flex justify-between items-center px-1 pt-2">
            {/* Sleek Progress Bar Indicator */}
            <div className="flex-1 max-w-[130px] sm:max-w-[180px] h-1.5 bg-slate-200/80 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#00BDFF] rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.max(15, 100 / activeTestimonials.length)}%`,
                  transform: `translateX(${activeTestiIndex * (100 / (activeTestimonials.length - 1 || 1)) * (1 - (Math.max(15, 100 / activeTestimonials.length) / 100))}%)`
                }}
              />
            </div>

            {/* Clean Compact Counter & Navigation Buttons */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200/80 px-2 py-1 rounded-full shadow-xs">
              <button
                type="button"
                onClick={() => scrollToTestimonial(Math.max(0, activeTestiIndex - 1))}
                disabled={activeTestiIndex === 0}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 disabled:opacity-25 disabled:pointer-events-none hover:bg-slate-100 active:scale-95 transition-all"
                aria-label="Testimoni Sebelumnya"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-medium text-slate-400 px-1">
                <strong className="text-slate-800 font-bold">{activeTestiIndex + 1}</strong> / {activeTestimonials.length}
              </span>
              <button
                type="button"
                onClick={() => scrollToTestimonial(Math.min(activeTestimonials.length - 1, activeTestiIndex + 1))}
                disabled={activeTestiIndex === activeTestimonials.length - 1}
                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-500 disabled:opacity-25 disabled:pointer-events-none hover:bg-slate-100 active:scale-95 transition-all"
                aria-label="Testimoni Seterusnya"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 4.2: PANDUAN TEKNOLOGI CETAKAN & SPESIFIKASI KILANG (Clean Style)
         ========================================================================= */}
      <div className="w-full bg-[#F8FAFC] py-8 px-4 space-y-5 border-t border-slate-200/80">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Panduan Teknologi &amp; Spesifikasi</h2>
            <p className="text-xs text-slate-500 mt-0.5">Spesifikasi cetakan jersi &amp; piawaian saiz kilang SFV APPAREL</p>
          </div>
        </div>

        {/* Clean Stacked Cards List (Matching Cara Tempahan Style) */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm shadow-blue-900/5 border border-blue-100/70 divide-y divide-gray-100">
          {/* Item 1: Sublimasi */}
          <div className="group flex items-start pl-3.5 bg-white hover:bg-blue-50/40 transition-colors">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 text-[#00BDFF] font-bold text-xs flex items-center justify-center mt-3.5">
              01
            </div>
            <div className="flex-1 ml-3 py-3.5 pr-3.5 min-w-0">
              <h3 className="text-[13.5px] font-semibold text-slate-900">
                Cetak Jersi Sublimasi Penuh (Full Sublimation)
              </h3>
              <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                Pewarna meresap ke gentian fabrik Microfiber (Eyelet &amp; Interlock). Corak tanpa had warna, kalis luntur &amp; pengudaraan optimum sukan.
              </p>
            </div>
          </div>

          {/* Item 2: DTF */}
          <div className="group flex items-start pl-3.5 bg-white hover:bg-blue-50/40 transition-colors">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 text-[#00BDFF] font-bold text-xs flex items-center justify-center mt-3.5">
              02
            </div>
            <div className="flex-1 ml-3 py-3.5 pr-3.5 min-w-0">
              <h3 className="text-[13.5px] font-semibold text-slate-900">
                Cetakan Baju DTF Premium (Direct-to-Film)
              </h3>
              <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                Cetakan kualiti foto berdefinisi tinggi pada 100% Combed Cotton. Hasil cetakan sangat elastik, kemas, dan tiada had minimum tempahan.
              </p>
            </div>
          </div>

          {/* Item 3: Sulaman */}
          <div className="group flex items-start pl-3.5 bg-white hover:bg-blue-50/40 transition-colors">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 text-[#00BDFF] font-bold text-xs flex items-center justify-center mt-3.5">
              03
            </div>
            <div className="flex-1 ml-3 py-3.5 pr-3.5 min-w-0">
              <h3 className="text-[13.5px] font-semibold text-slate-900">
                Sulaman Berkomputer &amp; Logo Korporat
              </h3>
              <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                Jahitan berkepadatan tinggi untuk polo shirt &amp; uniform korporat. Kemasan timbul yang elegan, berwibawa, dan tahan lasak.
              </p>
            </div>
          </div>

          {/* Item 4: Carta Saiz Piawai Malaysia */}
          <div className="group flex items-start pl-3.5 bg-white hover:bg-blue-50/40 transition-colors">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 text-[#00BDFF] font-bold text-xs flex items-center justify-center mt-3.5">
              04
            </div>
            <div className="flex-1 ml-3 py-3.5 pr-3.5 min-w-0">
              <h3 className="text-[13.5px] font-semibold text-slate-900">
                Panduan Carta Saiz Piawaian Malaysia
              </h3>
              <p className="text-[11.5px] text-slate-500 mt-0.5 leading-relaxed">
                Ukuran Asian Regular Fit: Kanak-kanak (24–32), Dewasa Standard (XS–XL), Plus Size (2XL–7XL), dan Potongan Muslimah Labuh A-Cut.
              </p>
            </div>
          </div>
        </div>

        {/* 3-Pill Clean Feature Bar (Exact match with Cara Tempahan) */}
        <div className="bg-white rounded-2xl py-2 px-2.5 grid grid-cols-3 gap-2 items-center shadow-xs border border-slate-200/80">
          <div className="flex items-center justify-center gap-1.5 text-slate-700 font-semibold text-[11px] py-1.5 px-1 rounded-xl bg-slate-50/90 border border-slate-100/90 min-w-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00BDFF] shrink-0" />
            <span className="truncate">MOQ 1 Helai</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-slate-700 font-semibold text-[11px] py-1.5 px-1 rounded-xl bg-slate-50/90 border border-slate-100/90 min-w-0">
            <Clock className="w-3.5 h-3.5 text-[#00BDFF] shrink-0" />
            <span className="truncate">Siap 5 - 7 Hari</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-slate-700 font-semibold text-[11px] py-1.5 px-1 rounded-xl bg-slate-50/90 border border-slate-100/90 min-w-0">
            <Truck className="w-3.5 h-3.5 text-[#00BDFF] shrink-0" />
            <span className="truncate">Pos Seluruh MY</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 4.5: SOALAN KERAP DITANYA (FAQ - Clean Accordion Style)
         ========================================================================= */}
      <div className="w-full bg-[#F2F6FE] py-8 px-4 space-y-5 border-t border-blue-100/60">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Soalan Kerap Ditanya</h2>
            <p className="text-xs text-slate-500 mt-0.5">Jawapan ringkas mengenai tempahan jersi &amp; cetakan terus dari kilang</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-blue-100/70 divide-y divide-gray-100">
          {/* FAQ 1 */}
          <details className="group">
            <summary className="flex items-center px-4 py-3.5 bg-white hover:bg-blue-50/40 active:bg-blue-50/70 transition-all duration-200 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 group-hover:bg-[#00BDFF] group-hover:text-white flex items-center justify-center text-[#00BDFF] font-bold text-xs transition-colors duration-200">
                01
              </div>
              <div className="flex-1 ml-3 min-w-0 pr-2">
                <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-[#00BDFF] leading-snug transition-colors duration-200">
                  Berapakah minimum tempahan (MOQ) di SFV APPAREL?
                </h3>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#00BDFF] group-open:rotate-180 shrink-0 ml-1.5 transition-transform duration-200" />
            </summary>
            <div className="px-4 py-3.5 bg-slate-50/70 border-t border-gray-100 text-xs text-slate-600 leading-relaxed">
              Minimum tempahan adalah serendah <strong className="text-slate-800 font-semibold">5 helai (MOQ = 5 pcs)</strong> untuk jersi sublimasi kustom dan cetakan DTF. Kami juga menerima tempahan pukal kelab, sekolah, dan korporat sehingga ribuan helai dengan harga terus dari kilang.
            </div>
          </details>

          {/* FAQ 2 */}
          <details className="group">
            <summary className="flex items-center px-4 py-3.5 bg-white hover:bg-blue-50/40 active:bg-blue-50/70 transition-all duration-200 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 group-hover:bg-[#00BDFF] group-hover:text-white flex items-center justify-center text-[#00BDFF] font-bold text-xs transition-colors duration-200">
                02
              </div>
              <div className="flex-1 ml-3 min-w-0 pr-2">
                <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-[#00BDFF] leading-snug transition-colors duration-200">
                  Berapa hari tempoh siap produksi pesanan?
                </h3>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#00BDFF] group-open:rotate-180 shrink-0 ml-1.5 transition-transform duration-200" />
            </summary>
            <div className="px-4 py-3.5 bg-slate-50/70 border-t border-gray-100 text-xs text-slate-600 leading-relaxed">
              Tempoh standard siap produksi adalah <strong className="text-slate-800 font-semibold">5 hingga 7 hari bekerja</strong> selepas pengesahan rekaan akhir (Design Proof) dan deposit. Servis ekspres juga disediakan mengikut jadual kapasiti kilang.
            </div>
          </details>

          {/* FAQ 3 */}
          <details className="group">
            <summary className="flex items-center px-4 py-3.5 bg-white hover:bg-blue-50/40 active:bg-blue-50/70 transition-all duration-200 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 group-hover:bg-[#00BDFF] group-hover:text-white flex items-center justify-center text-[#00BDFF] font-bold text-xs transition-colors duration-200">
                03
              </div>
              <div className="flex-1 ml-3 min-w-0 pr-2">
                <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-[#00BDFF] leading-snug transition-colors duration-200">
                  Apakah format fail artwork yang diterima?
                </h3>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#00BDFF] group-open:rotate-180 shrink-0 ml-1.5 transition-transform duration-200" />
            </summary>
            <div className="px-4 py-3.5 bg-slate-50/70 border-t border-gray-100 text-xs text-slate-600 leading-relaxed">
              Kami menyokong format vektor seperti AI (Adobe Illustrator), PDF, EPS, SVG, serta gambar resolusi tinggi PNG/JPG (300 DPI). Pereka kami juga sedia membantu melakar artwork mockup anda secara percuma.
            </div>
          </details>

          {/* FAQ 4 */}
          <details className="group">
            <summary className="flex items-center px-4 py-3.5 bg-white hover:bg-blue-50/40 active:bg-blue-50/70 transition-all duration-200 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
              <div className="w-8 h-8 shrink-0 rounded-lg bg-blue-50 group-hover:bg-[#00BDFF] group-hover:text-white flex items-center justify-center text-[#00BDFF] font-bold text-xs transition-colors duration-200">
                04
              </div>
              <div className="flex-1 ml-3 min-w-0 pr-2">
                <h3 className="text-[13.5px] font-semibold text-slate-900 group-hover:text-[#00BDFF] leading-snug transition-colors duration-200">
                  Bagaimana pilihan penghantaran dan liputan kurier?
                </h3>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#00BDFF] group-open:rotate-180 shrink-0 ml-1.5 transition-transform duration-200" />
            </summary>
            <div className="px-4 py-3.5 bg-slate-50/70 border-t border-gray-100 text-xs text-slate-600 leading-relaxed">
              Penghantaran fleksibel melalui Lalamove (Klang Valley), J&amp;T Express, Pos Laju serta Bas Express ke seluruh Semenanjung Malaysia, Sabah, Sarawak dan Singapura bersama nombor penjejakan automatik.
            </div>
          </details>
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: FOOTER (DYNAMIC COMPANY SETTINGS FROM CMS STORE)
         ========================================================================= */}
      <footer className="w-full bg-[#F4F4F7] pt-10 pb-36 px-5 border-t border-gray-200/80 select-none space-y-7">
        <div className="flex flex-col space-y-3.5">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5 max-w-[240px]">
              <div className="inline-flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.svg" alt="SFV APPAREL" width={24} height={24} className="h-6 w-auto object-contain shrink-0" />
                <span className="text-sm tracking-tight text-slate-900 leading-none flex items-center">
                  <span className="font-extrabold tracking-normal">SFV</span>
                  <span className="font-light ml-1 text-slate-700 tracking-wide">APPAREL</span>
                </span>
              </div>
              <p className="text-[11.5px] text-slate-600 leading-snug">
                {companySettings.tagline}
              </p>
              <p className="text-[10.5px] text-slate-600 leading-snug">
                sfvapparel.my dimiliki & diuruskan oleh <span className="font-medium text-slate-800">{companySettings.company_name}</span> (No. Pendaftaran Syarikat: <span className="font-mono text-slate-700">{companySettings.registration_number}</span>).
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-2 pt-0.5">
              <a href={companySettings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white shadow-xs border border-gray-200/80 flex items-center justify-center text-slate-700 hover:text-blue-600 transition-colors active:scale-90 touch-manipulation">
                <FaFacebookF className="w-4 h-4" />
              </a>
              <a href={companySettings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white shadow-xs border border-gray-200/80 flex items-center justify-center text-slate-700 hover:text-pink-600 transition-colors active:scale-90 touch-manipulation">
                <FaInstagram className="w-4 h-4" />
              </a>
              <a href={companySettings.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white shadow-xs border border-gray-200/80 flex items-center justify-center text-slate-700 hover:text-black transition-colors active:scale-90 touch-manipulation">
                <FaTiktok className="w-4 h-4" />
              </a>
              <a href={companySettings.telegram_catalog_url} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white shadow-xs border border-gray-200/80 flex items-center justify-center text-slate-700 hover:text-sky-500 transition-colors active:scale-90 touch-manipulation">
                <FaTelegram className="w-4 h-4" />
              </a>
              <a href={formatWhatsAppLink(companySettings?.whatsapp_number)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full bg-white shadow-xs border border-gray-200/80 flex items-center justify-center text-slate-700 hover:text-emerald-600 transition-colors active:scale-90 touch-manipulation">
                <FaWhatsapp className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* 1.5 ALAMAT KILANG & WAKTU OPERASI (Airy & Structured Card with Mini Map Link Button) */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-gray-200/80 p-3.5 sm:p-4 shadow-2xs space-y-3">
          {/* Baris Alamat */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                <MapPin className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lokasi Kilang & Pejabat
                </span>
                <p className="text-[11.5px] text-slate-700 font-medium leading-relaxed">
                  {companySettings.address}
                </p>
              </div>
            </div>
            
            {/* Mini Link Button to open Map Bottom Sheet */}
            <button
              type="button"
              onClick={() => setIsLocationSheetOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-[11px] font-bold border border-blue-200/70 shadow-2xs shrink-0 active:scale-95 transition-all cursor-pointer"
              title="Buka Peta Lokasi"
            >
              <span>Peta</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Baris Waktu Operasi */}
          <div className="pt-2.5 border-t border-slate-100/90 flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 stroke-[2.2]" />
            </div>
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Waktu Operasi
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-md border border-emerald-200/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Buka Isnin - Sabtu</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                {companySettings.working_hours}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Link Columns */}
        <div className="grid grid-cols-2 gap-6 pt-5 border-t border-gray-200/70 text-xs">
          <div className="space-y-2.5">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
              Services
            </h3>
            <ul className="space-y-2 text-slate-600 text-[12px]">
              <li>
                <Link href="/customize/sublimation" className="hover:text-blue-600 transition-colors block">
                  Sublimation Jersey
                </Link>
              </li>
              <li>
                <Link href="/customize/dtf" className="hover:text-blue-600 transition-colors block">
                  DTF Printing
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="hover:text-blue-600 transition-colors block">
                  Katalog Rekaan &amp; Sulaman
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-blue-600 transition-colors block">
                  Track Order
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h3 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
              Policies & Help
            </h3>
            <ul className="space-y-2 text-slate-600 text-[12px]">
              <li>
                <Link
                  href="/privacypolicy"
                  className="hover:text-blue-600 transition-colors block text-left"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('terms')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <Link
                  href="/refundpolicy"
                  className="hover:text-blue-600 transition-colors block text-left"
                >
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/shippingpolicy"
                  className="hover:text-blue-600 transition-colors block text-left"
                >
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 3. Kaedah Pembayaran Selamat (Safe Payment Gateway Badges) */}
        <div className="pt-5 border-t border-gray-200/70 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
              <svg className="w-3.5 h-3.5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Kaedah Pembayaran Selamat & Terpelihara</span>
            </div>
            <span className="text-[10px] text-slate-400">Enkripsi 256-Bit SSL • Transaksi Disahkan</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 pt-0.5">
            {/* FPX */}
            <div className="h-7 sm:h-7.5 px-2.5 bg-white border border-slate-200/90 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 hover:border-slate-300 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payments/logobaru/FPX Logo Vector.svg"
                alt="FPX Online Banking"
                width={48}
                height={16}
                className="h-3.5 sm:h-4 w-auto max-w-[48px] object-contain block"
              />
            </div>

            {/* DuitNow */}
            <div className="h-7 sm:h-7.5 px-2.5 bg-white border border-slate-200/90 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 hover:border-slate-300 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payments/logobaru/duitnow.svg"
                alt="DuitNow QR"
                width={36}
                height={16}
                className="h-3.5 sm:h-4 w-auto max-w-[36px] object-contain block"
              />
            </div>

            {/* Touch 'n Go */}
            <div className="h-7 sm:h-7.5 px-2.5 bg-white border border-slate-200/90 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 hover:border-slate-300 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payments/logobaru/Touch_'n_Go_eWallet_logo.svg"
                alt="Touch 'n Go eWallet"
                width={36}
                height={16}
                className="h-3.5 sm:h-4 w-auto max-w-[36px] object-contain block"
              />
            </div>

            {/* Maybank */}
            <div className="h-7 sm:h-7.5 px-2.5 bg-white border border-slate-200/90 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 hover:border-slate-300 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payments/logobaru/maybank-vector-logo.svg"
                alt="Maybank"
                width={46}
                height={16}
                className="h-3.5 sm:h-4 w-auto max-w-[46px] object-contain block"
              />
            </div>

            {/* Visa */}
            <div className="h-7 sm:h-7.5 px-2.5 bg-white border border-slate-200/90 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 hover:border-slate-300 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payments/logobaru/Visa_Inc._logo_(2021–present).svg"
                alt="Visa"
                width={38}
                height={12}
                className="h-2.5 sm:h-3 w-auto max-w-[38px] object-contain block"
              />
            </div>

            {/* Mastercard */}
            <div className="h-7 sm:h-7.5 px-2.5 bg-white border border-slate-200/90 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 hover:border-slate-300 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payments/logobaru/Mastercard-logo.svg"
                alt="Mastercard"
                width={34}
                height={16}
                className="h-3.5 sm:h-4 w-auto max-w-[34px] object-contain block"
              />
            </div>
          </div>
        </div>

        {/* 4. Copyright & Developer Credit (Apple-grade Clean, Responsive & Beautiful) */}
        <div className="pt-6 border-t border-slate-200/80 flex flex-col items-center justify-center text-center space-y-2 select-none">
          <p className="text-[11.5px] text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} <span className="font-bold text-slate-700">{companySettings.brand_name || 'SFV APPAREL'}</span>. Hak Cipta Terpelihara.
          </p>
          
          {/* Developer Credit: AYEZZ Global */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <span>Dibangunkan oleh</span>
            <a
              href={companySettings.developer_url || 'https://ayezz.com'}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-slate-800 hover:text-[#00BDFF] bg-white px-3 py-1 rounded-full border border-slate-200/90 shadow-2xs hover:border-[#00BDFF]/40 active:scale-95 transition-all whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00BDFF] shrink-0" />
              <span className="tracking-tight text-slate-800 font-semibold">{(!companySettings.developer_name || companySettings.developer_name === 'AYEZZ Studio') ? 'AYEZZ Global' : companySettings.developer_name}</span>
            </a>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          DYNAMIC PRODUCT DETAILS BOTTOM SHEET MODAL
         ========================================================================= */}
      {selectedProduct && (
        <SwipeableBottomSheet
          isOpen={isProductSheetOpen}
          onClose={() => setIsProductSheetOpen(false)}
          title={selectedProduct.title}
        >
          <div className="space-y-5 select-none font-ios pb-2">
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 shadow-sm border border-slate-200/70">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedProduct.image_url}
                alt={selectedProduct.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-[#0052FF] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                {selectedProduct.category}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {selectedProduct.headline}
              </h3>
              <p className="text-xs text-[#0052FF] font-semibold mt-0.5">
                {selectedProduct.highlight}
              </p>
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-4">
              {selectedProduct.details?.map((detail, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0052FF] shrink-0" />
                    <span>{detail.title}</span>
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed pl-5">
                    {detail.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <Link
                href={selectedProduct.href}
                onClick={() => setIsProductSheetOpen(false)}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                <span>Lihat Templat {selectedProduct.title}</span>
                <ChevronRight className="w-4 h-4 text-white/90" />
              </Link>
            </div>
          </div>
        </SwipeableBottomSheet>
      )}

      {/* =========================================================================
          ORDER STEP DETAILS BOTTOM SHEET MODAL (CLEAN & SPACIOUS)
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isStepSheetOpen}
        onClose={() => setIsStepSheetOpen(false)}
        showCloseButton={false}
        badge={
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-[#0052FF] text-[11px] font-bold border border-blue-100">
            Langkah {selectedStep.step}
          </span>
        }
        title={selectedStep.title}
      >
        <div className="space-y-4 select-none font-ios pb-1">
          {/* Clean Description Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-[13px] text-slate-700 leading-relaxed">
            {selectedStep.detailDesc}
          </div>

          {/* Clean Key Points */}
          {selectedStep.points && selectedStep.points.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block px-0.5">
                Perincian Penting
              </span>
              <div className="space-y-2.5">
                {selectedStep.points.map((pt, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-white border border-slate-100 shadow-2xs text-[12.5px] text-slate-700 leading-relaxed"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-50 text-[#0052FF] border border-blue-100 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span className="font-medium">{pt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Button - Capsule SFV Brand Blue Gradient */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsStepSheetOpen(false)}
              className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs tracking-wide text-center active:scale-[0.98] transition-all shadow-md shadow-blue-500/20"
            >
              Faham & Tutup
            </button>
          </div>
        </div>
      </SwipeableBottomSheet>

      {/* =========================================================================
          DYNAMIC POLICY BOTTOM SHEET MODAL (FROM CMS STORE)
         ========================================================================= */}
      {policies[selectedPolicyKey] && (
        <SwipeableBottomSheet
          isOpen={isPolicySheetOpen}
          onClose={() => setIsPolicySheetOpen(false)}
          showCloseButton={false}
          title={policies[selectedPolicyKey].title}
        >
          <div className="space-y-4 select-none font-ios pb-1 text-xs">
            <div className="p-4 rounded-2xl bg-blue-50/80 text-slate-700 text-[12.5px] leading-relaxed border border-blue-100/70">
              {policies[selectedPolicyKey].description}
            </div>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {policies[selectedPolicyKey].sections?.map((sec, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-slate-100 shadow-2xs space-y-1.5">
                  <h4 className="font-bold text-slate-900 text-xs">{sec.heading}</h4>
                  <p className="text-slate-600 leading-relaxed text-[12.5px]">{sec.text}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPolicySheetOpen(false)}
                className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white font-bold text-xs text-center active:scale-[0.98] transition-all shadow-md shadow-blue-500/20"
              >
                Tutup Maklumat
              </button>
            </div>
          </div>
        </SwipeableBottomSheet>
      )}

      {/* =========================================================================
          DYNAMIC PRODUCTION GALLERY DETAIL & ZOOM PREVIEW SHEET MODAL
         ========================================================================= */}
      {selectedGalleryItem && (
        <SwipeableBottomSheet
          isOpen={isGallerySheetOpen}
          onClose={() => setIsGallerySheetOpen(false)}
          title={selectedGalleryItem.title}
        >
          <div className="space-y-4 select-none font-ios pb-2">
            {/* High-Res Image Preview Box with Zoom Hint */}
            <div 
              onClick={() => setIsLightboxOpen(true)}
              className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-900 shadow-md border border-slate-200/80 cursor-zoom-in group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedGalleryItem.image_url}
                alt={selectedGalleryItem.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md text-[#0052FF] text-[11px] font-bold px-3 py-1 rounded-full shadow-sm border border-sky-100">
                {selectedGalleryItem.tag}
              </div>

              <div className="absolute bottom-3 right-3 bg-black/65 backdrop-blur-md text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <ZoomIn className="w-3.5 h-3.5 text-white" />
                <span>Ketuk untuk Skrin Penuh</span>
              </div>
            </div>

            {/* Details Summary Card */}
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0052FF]">
                  Hasil Produksi Sebenar
                </span>
                <h3 className="text-base font-bold text-slate-900 tracking-tight leading-snug mt-0.5">
                  {selectedGalleryItem.title}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Jenis Fabrik & Kemasan</span>
                  <span className="font-bold text-slate-800">{selectedGalleryItem.fabric || 'Microfiber Sublimasi'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-medium block">Pelanggan / Kelab</span>
                  <span className="font-bold text-slate-800">{selectedGalleryItem.client || 'Tempahan Kustom'}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons - Capsule */}
            <div className="pt-1 space-y-2">
              <a
                href={formatWhatsAppLink(
                  companySettings?.whatsapp_number,
                  `Hai SFV Apparel, saya telah melihat hasil produksi *${selectedGalleryItem.title}* (${selectedGalleryItem.fabric}). Saya berminat untuk menempah seperti ini!`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-6 rounded-full bg-[#25D366] hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                <FaWhatsapp className="w-4 h-4 text-white" />
                <span>Tempah Rekaan Seperti Ini di WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => setIsGallerySheetOpen(false)}
                className="w-full py-3 px-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs text-center active:scale-[0.98] transition-all"
              >
                Tutup Maklumat
              </button>
            </div>
          </div>
        </SwipeableBottomSheet>
      )}

      {/* =========================================================================
          BOTTOM SHEET 5: LOKASI KILANG & PETA INTERAKTIF
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isLocationSheetOpen}
        onClose={() => setIsLocationSheetOpen(false)}
        title="Lokasi Kilang & Waktu Operasi"
        subtitle={`${companySettings.brand_name || 'SFV APPAREL'} · Lokasi & Navigasi`}
      >
        <div className="space-y-4 select-none pb-2">
          {/* Map Container */}
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
            {isLocationSheetOpen && (
              <iframe
                title="Peta Lokasi Kilang SFV Apparel"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(companySettings.address || 'No 28-1, Jalan Prima Saujana 2/D, Taman Prima Saujana, 43000 Kajang, Selangor')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              />
            )}
          </div>

          {/* Alamat Penuh Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{companySettings.company_name}</h4>
                  <p className="text-[10px] text-slate-500">Alamat Kilang / Pejabat Utama</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyAddress(companySettings.address)}
                className="px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-[11px] font-semibold tracking-tight shadow-2xs active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                {copiedAddress ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-600">Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-slate-500" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed pl-9">
              {companySettings.address}
            </p>
          </div>

          {/* Navigation Action Buttons (Capsule style) */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companySettings.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-full bg-gradient-to-r from-[#0052FF] to-[#00BDFF] hover:opacity-95 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>
            <a
              href={`https://waze.com/ul?q=${encodeURIComponent(companySettings.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition-all"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600" />
              <span>Navigasi Waze</span>
            </a>
          </div>

          {/* Waktu Operasi Jadual Kemas */}
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-900">Jadual Waktu Operasi Kilang</span>
              </div>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Waktu Standard</span>
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-700">Isnin – Jumaat</span>
                <span className="font-bold text-slate-900">9:00 AM – 6:00 PM</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-700">Sabtu</span>
                <span className="font-bold text-slate-900">9:00 AM – 1:00 PM</span>
              </div>
              <div className="flex items-center justify-between py-1 text-slate-400">
                <span>Ahad & Cuti Umum</span>
                <span className="font-semibold text-rose-500">Tutup (Online WhatsApp dibuka)</span>
              </div>
            </div>
          </div>
        </div>
      </SwipeableBottomSheet>

      {/* =========================================================================
          FULLSCREEN LIGHTBOX IMAGE ZOOM MODAL (PORTAL AT z-[2000] TO OVERLAY BOTTOM SHEET)
         ========================================================================= */}
      {mounted && isLightboxOpen && selectedGalleryItem && createPortal(
        <div 
          className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-4 animate-in fade-in duration-200 font-ios select-none touch-none"
          onClick={() => setIsLightboxOpen(false)}
          onTouchMove={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-center text-white pt-2 px-2 z-10">
            <div>
              <span className="text-[10px] font-bold text-[#00BDFF] uppercase tracking-wider block">
                {selectedGalleryItem.tag}
              </span>
              <h4 className="font-bold text-sm leading-tight text-white">{selectedGalleryItem.title}</h4>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLightboxOpen(false);
              }}
              aria-label="Tutup Skrin Penuh"
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Full Screen Image */}
          <div className="flex-1 flex items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedGalleryItem.image_url}
              alt={selectedGalleryItem.title}
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Footer note */}
          <div className="text-center pb-4 text-xs text-slate-400 z-10 font-medium">
            Ketuk di luar gambar atau tekan &times; untuk kembali ke maklumat
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
