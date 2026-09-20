'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Play,
  Plus,
  ChevronRight, 
  ShieldCheck,
  Truck,
  Clock,
  CheckCircle2,
  Quote,
  Building2,
  Zap,
  PackageCheck
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import SwipeableBottomSheet from '@/components/ui/SwipeableBottomSheet';
import { useAppStore } from '@/lib/store/app-store';
import { 
  CmsHeroBanner, 
  CmsService, 
  CmsProductionVideo, 
  CmsProductionGalleryItem, 
  CmsTestimonial, 
  CmsPolicy
} from '@/types/database';

interface TrustBadgeItem {
  id: string;
  title: string;
  desc: string;
  pill: string;
  icon: React.ElementType;
  gradient: string;
  border: string;
  iconBg: string;
  iconColor: string;
  pillStyle: string;
  dotActive: string;
}

const TRUST_BADGES: TrustBadgeItem[] = [
  {
    id: 'direct-kilang',
    title: 'Harga Direct Kilang',
    desc: 'Tanpa orang tengah · Lebih jimat & telus',
    pill: 'Direct Kilang',
    icon: Building2,
    gradient: 'from-white via-slate-50/50 to-sky-50/30',
    border: 'border-slate-200/90 dark:border-zinc-800',
    iconBg: 'bg-[#00BDFF]/10 text-[#00BDFF]',
    iconColor: 'text-[#00BDFF]',
    pillStyle: 'bg-sky-50 text-[#00BDFF] border-sky-100',
    dotActive: 'bg-[#00BDFF]',
  },
  {
    id: 'no-moq',
    title: 'Tiada Minimum Order',
    desc: 'Kustom & DTF · 1 helai pun kami buat',
    pill: 'Bebas MOQ',
    icon: PackageCheck,
    gradient: 'from-white via-slate-50/50 to-indigo-50/30',
    border: 'border-slate-200/90 dark:border-zinc-800',
    iconBg: 'bg-indigo-500/10 text-indigo-600',
    iconColor: 'text-indigo-600',
    pillStyle: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    dotActive: 'bg-indigo-600',
  },
  {
    id: 'siap-pantas',
    title: 'Siap Pantas 5-7 Hari',
    desc: 'Produksi pantas · Penghantaran tepat masa',
    pill: 'Express Siap',
    icon: Clock,
    gradient: 'from-white via-slate-50/50 to-sky-50/30',
    border: 'border-slate-200/90 dark:border-zinc-800',
    iconBg: 'bg-sky-500/10 text-sky-600',
    iconColor: 'text-sky-600',
    pillStyle: 'bg-sky-50 text-sky-700 border-sky-100',
    dotActive: 'bg-sky-600',
  },
  {
    id: 'qc-guarantee',
    title: 'Jaminan 1-to-1 QC',
    desc: 'Pemeriksaan kualiti rapi · Ganti jika rosak',
    pill: '100% QC Pass',
    icon: ShieldCheck,
    gradient: 'from-white via-slate-50/50 to-emerald-50/30',
    border: 'border-slate-200/90 dark:border-zinc-800',
    iconBg: 'bg-emerald-500/10 text-emerald-600',
    iconColor: 'text-emerald-600',
    pillStyle: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    dotActive: 'bg-emerald-600',
  },
];

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
            <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f09433" />
              <stop offset="25%" stopColor="#e6683c" />
              <stop offset="50%" stopColor="#dc2743" />
              <stop offset="75%" stopColor="#cc2366" />
              <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="6" fill="url(#ig-grad)"/>
          <path d="M12 7.02c-2.75 0-4.98 2.23-4.98 4.98s2.23 4.98 4.98 4.98 4.98-2.23 4.98-4.98-2.23-4.98-4.98-4.98zm0 8.24c-1.8 0-3.26-1.46-3.26-3.26s1.46-3.26 3.26-3.26 3.26 1.46 3.26 3.26-1.46 3.26-3.26 3.26zm6.34-8.42c0 .64-.52 1.16-1.16 1.16-.64 0-1.16-.52-1.16-1.16 0-.64.52-1.16 1.16-1.16.64 0 1.16.52 1.16 1.16zm2.66 1.18c-.06-1.26-.35-2.38-1.27-3.3-.92-.92-2.04-1.21-3.3-1.27C15.15 3.4 11.85 3.4 10.57 3.45c-1.26.06-2.38.35-3.3 1.27-.92.92-1.21 2.04-1.27 3.3C3.95 9.3 3.95 12.6 4 13.88c.06 1.26.35 2.38 1.27 3.3.92.92 2.04 1.21 3.3 1.27 1.28.05 4.58.05 5.86 0 1.26-.06 2.38-.35 3.3-1.27.92-.92 1.21-2.04 1.27-3.3.05-1.28.05-4.58 0-5.86zm-1.88 9.08c-.28.7-.82 1.24-1.52 1.52-1.01.4-3.41.31-4.6.31s-3.59.09-4.6-.31c-.7-.28-1.24-.82-1.52-1.52-.4-1.01-.31-3.41-.31-4.6s-.09-3.59.31-4.6c.28-.7.82-1.24 1.52-1.52 1.01-.4 3.41-.31 4.6-.31s3.59-.09 4.6.31c.7.28 1.24.82 1.52 1.52.4 1.01.31 3.41.31 4.6s.09 3.59-.31 4.6z" fill="#FFFFFF"/>
        </svg>
      );
  }
};

export default function HomePage() {
  const {
    heroBanners,
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

  const [selectedStep, setSelectedStep] = useState<StepDetail>(ORDER_STEPS[0]);
  const [isStepSheetOpen, setIsStepSheetOpen] = useState(false);

  const [selectedPolicyKey, setSelectedPolicyKey] = useState<'privacy' | 'terms' | 'warranty' | 'shipping'>('privacy');
  const [isPolicySheetOpen, setIsPolicySheetOpen] = useState(false);

  const [activeVideo, setActiveVideo] = useState<string | null>(null);

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

  useEffect(() => {
    if (isTrustPaused) return;
    const interval = setInterval(() => {
      setActiveTrustIndex((prev) => (prev + 1) % TRUST_BADGES.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isTrustPaused]);

  const currentTrust = TRUST_BADGES[activeTrustIndex];
  const TrustIcon = currentTrust.icon;

  const currentBanner = activeBanners[activeBannerIndex] || activeBanners[0] || {
    id: 'default',
    image_url: '/hero1.png',
    status_pill: 'Kilang Beroperasi',
    tag_text: 'Koleksi Rasmi 2026',
    title: 'Studio Jersi & DTF',
    button_text: 'Katalog',
    button_link: '/catalog',
    sort_order: 1,
    is_active: true,
  };

  return (
    <div className="w-full select-none font-ios">
      {/* =========================================================================
          SECTION 1: HERO & PILIHAN SERVIS (iOS Canvas Tint - Kad Putih Timbul & Jelas)
         ========================================================================= */}
      <div className="w-full bg-[#F2F2F7] pt-3 pb-8 px-4 space-y-6">
        {/* 1. DYNAMIC HERO SECTION WITH MULTI-SLIDE BANNER */}
        <div className="relative w-full h-[240px] rounded-3xl overflow-hidden shadow-md shadow-slate-300/40 group">
          {/* Full-bleed Natural Photo */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentBanner.image_url}
            alt={currentBanner.title}
            key={currentBanner.id}
            className="w-full h-full object-cover object-[center_22%] group-hover:scale-103 transition-all duration-700 animate-in fade-in"
          />

          {/* Clean Subtle Bottom-Only Gradient */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

          {/* Top Status Pill */}
          <div className="absolute top-3.5 left-3.5 z-10 flex items-center gap-2">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-black/35 backdrop-blur-md text-white shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10.5px] font-medium tracking-wide text-white/95">
                {currentBanner.status_pill}
              </span>
            </div>
          </div>

          {/* Banner Carousel Indicator Dots (if multi-slide) */}
          {activeBanners.length > 1 && (
            <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-1.5 bg-black/35 backdrop-blur-md px-2 py-1 rounded-full">
              {activeBanners.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveBannerIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeBannerIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Bottom Content Directly Over Gradient */}
          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between z-10">
            <div className="space-y-0.5 pr-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block font-semibold">
                {currentBanner.tag_text}
              </span>
              <h1 className="text-[17px] font-bold text-white tracking-tight leading-tight drop-shadow-xs">
                {currentBanner.title}
              </h1>
            </div>

            {/* Action Capsule Button */}
            <Link
              href={currentBanner.button_link}
              className="px-4 py-2 rounded-full bg-white hover:bg-slate-100 active:scale-95 text-slate-900 text-xs font-semibold tracking-tight shadow-md transition-all flex items-center space-x-1 shrink-0"
            >
              <span>{currentBanner.button_text}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-700" />
            </Link>
          </div>
        </div>

        {/* 1.5 VALUE PROPOSITION / TRUST CARD SWAP (Compact, Soft Color & Auto-Slide) */}
        <div 
          className={`relative overflow-hidden rounded-2xl border ${currentTrust.border} bg-gradient-to-r ${currentTrust.gradient} p-3 sm:p-3.5 shadow-xs transition-all duration-500 cursor-pointer select-none group`}
          onMouseEnter={() => setIsTrustPaused(true)}
          onMouseLeave={() => setIsTrustPaused(false)}
          onClick={() => setActiveTrustIndex((prev) => (prev + 1) % TRUST_BADGES.length)}
          role="button"
          tabIndex={0}
          aria-label={`Jaminan: ${currentTrust.title}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {/* Soft Animated Icon */}
              <div 
                key={`icon-${currentTrust.id}`}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${currentTrust.iconBg} flex items-center justify-center shrink-0 shadow-xs transition-transform duration-300 group-hover:scale-105`}
              >
                <TrustIcon className="w-5 h-5 stroke-[2.2]" />
              </div>

              {/* Text content with soft typography & tag */}
              <div key={`text-${currentTrust.id}`} className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[12px] sm:text-[13px] font-bold text-slate-900 tracking-tight leading-tight">
                    {currentTrust.title}
                  </span>
                  <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md border ${currentTrust.pillStyle} tracking-wide`}>
                    {currentTrust.pill}
                  </span>
                </div>
                <p className="text-[10px] sm:text-[10.5px] text-slate-500 font-medium mt-0.5 truncate">
                  {currentTrust.desc}
                </p>
              </div>
            </div>

            {/* Slide Navigation & Mini Soft Indicator Dots */}
            <div className="flex items-center gap-1 shrink-0 pl-1">
              {TRUST_BADGES.map((badge, idx) => {
                const isActive = idx === activeTrustIndex;
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTrustIndex(idx);
                    }}
                    aria-label={`Slide ke ${badge.title}`}
                    className={`transition-all duration-300 rounded-full ${
                      isActive 
                        ? `w-4 h-1.5 ${badge.dotActive} shadow-xs` 
                        : 'w-1.5 h-1.5 bg-slate-300/80 hover:bg-slate-400'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. PILIHAN SERVIS HEADER & CARDS (DYNAMIC FROM CMS STORE) */}
        <div className="space-y-3.5">
          <div className="flex justify-between items-end mb-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Pilihan Servis
              </h2>
              <p className="text-xs text-slate-500 font-normal tracking-wide mt-0.5">
                Cetakan & jahitan pakaian kustom terus dari kilang
              </p>
            </div>

            <Link
              href="/catalog"
              aria-label="Lihat Semua Servis"
              className="w-8 h-8 rounded-full bg-white hover:bg-gray-100 text-slate-700 hover:text-[#00BDFF] flex items-center justify-center transition-all active:scale-90 shadow-sm border border-black/[0.04]"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.2]" />
            </Link>
          </div>

          {/* Card Produk Dinamik */}
          <div className="flex items-stretch gap-4 overflow-x-auto snap-x snap-mandatory scroll-pl-4 scroll-pr-4 scrollbar-none no-scrollbar -mx-4 px-4 pt-1 pb-4">
            {activeServices.map((item) => (
              <div
                key={item.id}
                onClick={() => handleOpenProduct(item)}
                className="rounded-3xl overflow-hidden bg-white w-[235px] flex-shrink-0 snap-start border border-black/[0.07] shadow-md shadow-slate-300/40 cursor-pointer select-none active:scale-[0.98] hover:shadow-lg transition-all flex flex-col justify-between"
              >
                {/* Bagian Gambar */}
                <div className="relative w-full h-48 bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Bagian Konten */}
                <div className="p-4 flex flex-col justify-between flex-1">
                  <div>
                    <h3 className="font-bold text-[17px] text-slate-900 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 text-[13px] mt-1 line-clamp-1">
                      {item.highlight}
                    </p>
                  </div>

                  {/* Baris Harga & Butang Interaktif */}
                  <div className="mt-4 pt-2.5 border-t border-slate-100 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#00BDFF]">
                        {item.price_prefix || 'Bermula'}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-[17px] font-black text-slate-900 tracking-tight leading-none">
                          {item.price_amount}
                        </span>
                        {item.price_unit && (
                          <span className="text-[11px] font-medium text-slate-400">
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
                      className="w-9 h-9 rounded-full bg-blue-50 hover:bg-[#00BDFF] text-[#00BDFF] hover:text-white flex items-center justify-center transition-all active:scale-90 shadow-xs border border-blue-100"
                    >
                      <Plus className="w-5 h-5 stroke-[2.2]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
                href={`https://wa.me/${companySettings.whatsapp_number}?text=${encodeURIComponent(sloganQuote.whatsapp_message)}`}
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
          {activeVideos.map((video) => (
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
          ))}
        </div>
      </div>

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
          {activeGallery.map((item, idx) => {
            const isActive = idx === activeGalleryIndex;
            return (
              <div 
                key={item.id}
                onClick={() => scrollToGallery(idx)}
                className={`shrink-0 w-[82vw] max-w-[320px] bg-white rounded-3xl overflow-hidden snap-center border transition-all duration-300 cursor-pointer flex flex-col justify-between ${
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
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 left-3">
                    <span className="bg-white/95 backdrop-blur-md text-[#00BDFF] font-bold text-[10px] px-2.5 py-1 rounded-full shadow-xs border border-blue-100/60">
                      {item.tag}
                    </span>
                  </div>
                </div>

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between bg-white">
                  <div>
                    <h3 className="font-bold text-[15px] text-slate-900 leading-snug">
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
                    <a
                      href={`https://wa.me/${companySettings.whatsapp_number}?text=Hai%20SFV%20Apparel,%20saya%20berminat%20dengan%20hasil%20produksi%20*${encodeURIComponent(item.title)}*`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11.5px] font-bold text-[#00BDFF] hover:text-blue-700 transition-colors"
                    >
                      <FaWhatsapp className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>Tempah Seperti Ini</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-center items-center gap-1.5 pt-2">
          {activeGallery.map((_, idx) => {
            const isActive = idx === activeGalleryIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToGallery(idx)}
                aria-label={`Lihat hasil produksi ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'w-6 bg-[#00BDFF]' 
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            );
          })}
        </div>
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
                      <h4 className="font-bold text-slate-900 text-[14px] leading-tight">{t.name}</h4>
                      <p className="text-[11.5px] text-slate-500 mt-0.5">{t.location}</p>
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

        <div className="flex justify-center items-center gap-1.5 pt-3">
          {activeTestimonials.map((_, idx) => {
            const isActive = idx === activeTestiIndex;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToTestimonial(idx)}
                aria-label={`Lihat testimoni ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'w-6 bg-[#00BDFF]' 
                    : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          SECTION 5: FOOTER (DYNAMIC COMPANY SETTINGS FROM CMS STORE)
         ========================================================================= */}
      <footer className="w-full bg-[#F4F4F7] pt-10 pb-36 px-5 border-t border-gray-200/80 select-none space-y-7">
        <div className="flex flex-col space-y-3.5">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5 max-w-[240px]">
              <div className="inline-flex items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo/SVFapparel-logo.svg" alt="SVF Apparel" className="h-6 w-auto object-contain shrink-0" />
              </div>
              <p className="text-[11.5px] text-slate-500 leading-snug">
                {companySettings.tagline}
              </p>
              <p className="text-[10.5px] text-slate-400 leading-snug">
                sfvapparel.my dimiliki & diuruskan oleh <span className="font-medium text-slate-600">{companySettings.company_name}</span> (No. Pendaftaran Syarikat: <span className="font-mono">{companySettings.registration_number}</span>).
              </p>
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <a href={companySettings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200/60 flex items-center justify-center text-slate-600 hover:text-blue-600 transition-colors active:scale-90">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href={companySettings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200/60 flex items-center justify-center text-slate-600 hover:text-pink-600 transition-colors active:scale-90">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
              <a href={companySettings.tiktok_url} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200/60 flex items-center justify-center text-slate-600 hover:text-black transition-colors active:scale-90">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.89 2.88 2.89 2.89 0 0 1-2.89-2.88 2.89 2.89 0 0 1 2.89-2.88c.49 0 .94.12 1.34.34V9.75a6.22 6.22 0 0 0-1.34-.15A6.24 6.24 0 0 0 3.24 15.83a6.24 6.24 0 0 0 6.24-6.23 6.24 6.24 0 0 0 6.24-6.23V9a8.16 8.16 0 0 0 4.77 1.52v-3.35a4.83 4.83 0 0 1-.9-.48z"/></svg>
              </a>
              <a href={companySettings.telegram_catalog_url} target="_blank" rel="noopener noreferrer" aria-label="Telegram" className="w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200/60 flex items-center justify-center text-slate-600 hover:text-sky-500 transition-colors active:scale-90">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.943z"/></svg>
              </a>
              <a href={`https://wa.me/${companySettings.whatsapp_number}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="w-7 h-7 rounded-full bg-white shadow-xs border border-gray-200/60 flex items-center justify-center text-slate-600 hover:text-emerald-600 transition-colors active:scale-90">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.122.553 4.179 1.603 5.996L0 24l6.167-1.617a12.01 12.01 0 0 0 5.864 1.516h.005c6.645 0 12.03-5.385 12.03-12.031A12.03 12.03 0 0 0 12.031 0zm0 22.028h-.004a9.99 9.99 0 0 1-5.093-1.392l-.365-.217-3.784.992 1.01-3.69-.237-.378a9.97 9.97 0 0 1-1.529-5.312C2.029 6.502 6.506 2.025 12.031 2.025c2.671 0 5.182 1.04 7.07 2.928a9.94 9.94 0 0 1 2.93 7.078c0 5.526-4.477 9.997-10 9.997zm5.485-7.496c-.3-.15-1.776-.877-2.051-.977-.276-.1-.476-.15-.676.15-.2.3-.776.977-.951 1.177-.175.2-.35.226-.651.075s-1.27-.468-2.42-1.493c-.895-.798-1.5-1.784-1.675-2.084-.175-.3-.019-.463.131-.612.135-.135.3-.35.45-.526.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.63-.926-2.232-.244-.587-.492-.507-.676-.516l-.576-.01c-.2 0-.525.075-.8.375s-1.05 1.026-1.05 2.502 1.076 2.903 1.226 3.103c.15.2 2.117 3.232 5.13 4.533.717.31 1.277.495 1.713.633.72.229 1.375.197 1.894.119.579-.087 1.776-.726 2.026-1.427.25-.701.25-1.302.175-1.427-.075-.125-.275-.2-.575-.35z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* 2. Link Columns */}
        <div className="grid grid-cols-2 gap-6 pt-5 border-t border-gray-200/70 text-xs">
          <div className="space-y-2.5">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
              Perkhidmatan
            </h4>
            <ul className="space-y-2 text-slate-600 text-[12px]">
              <li>
                <Link href="/catalog?type=sublimation" className="hover:text-blue-600 transition-colors block">
                  Jersi Sublimasi Penuh
                </Link>
              </li>
              <li>
                <Link href="/catalog?type=dtf" className="hover:text-blue-600 transition-colors block">
                  Cetakan DTF Premium
                </Link>
              </li>
              <li>
                <Link href="/catalog?type=embroidery" className="hover:text-blue-600 transition-colors block">
                  Sulaman Berkomputer
                </Link>
              </li>
              <li>
                <Link href="/history" className="hover:text-blue-600 transition-colors block">
                  Semak Status Pesanan
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <h4 className="font-bold text-[11px] uppercase tracking-wider text-slate-900">
              Polisi & Bantuan
            </h4>
            <ul className="space-y-2 text-slate-600 text-[12px]">
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('privacy')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Dasar Privasi (Privacy)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('terms')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Terma & Syarat (Terms)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('warranty')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Jaminan & Pemulangan
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleOpenPolicy('shipping')}
                  className="hover:text-blue-600 transition-colors text-left"
                >
                  Polisi Penghantaran
                </button>
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
                className="h-3.5 sm:h-4 w-auto max-w-[48px] object-contain block"
              />
            </div>

            {/* DuitNow */}
            <div className="h-7 sm:h-7.5 px-2.5 bg-white border border-slate-200/90 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 hover:border-slate-300 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payments/logobaru/duitnow.svg"
                alt="DuitNow QR"
                className="h-3.5 sm:h-4 w-auto max-w-[36px] object-contain block"
              />
            </div>

            {/* Touch 'n Go */}
            <div className="h-7 sm:h-7.5 px-2.5 bg-white border border-slate-200/90 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 hover:border-slate-300 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payments/logobaru/Touch_'n_Go_eWallet_logo.svg"
                alt="Touch 'n Go eWallet"
                className="h-3.5 sm:h-4 w-auto max-w-[36px] object-contain block"
              />
            </div>

            {/* Maybank */}
            <div className="h-7 sm:h-7.5 px-2.5 bg-white border border-slate-200/90 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 hover:border-slate-300 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payments/logobaru/maybank-vector-logo.svg"
                alt="Maybank"
                className="h-3.5 sm:h-4 w-auto max-w-[46px] object-contain block"
              />
            </div>

            {/* Visa */}
            <div className="h-7 sm:h-7.5 px-2.5 bg-white border border-slate-200/90 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 hover:border-slate-300 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payments/logobaru/Visa_Inc._logo_(2021–present).svg"
                alt="Visa"
                className="h-2.5 sm:h-3 w-auto max-w-[38px] object-contain block"
              />
            </div>

            {/* Mastercard */}
            <div className="h-7 sm:h-7.5 px-2.5 bg-white border border-slate-200/90 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-center shrink-0 hover:border-slate-300 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/payments/logobaru/Mastercard-logo.svg"
                alt="Mastercard"
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
              <div className="absolute top-3 left-3 bg-[#00BDFF] text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
                {selectedProduct.category}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                {selectedProduct.headline}
              </h3>
              <p className="text-xs text-[#00BDFF] font-semibold mt-0.5">
                {selectedProduct.highlight}
              </p>
            </div>

            <div className="space-y-3.5 border-t border-slate-100 pt-4">
              {selectedProduct.details?.map((detail, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00BDFF] shrink-0" />
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
                className="w-full py-3 px-4 rounded-xl bg-[#00BDFF] hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all"
              >
                <span>Lihat Templat {selectedProduct.title}</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </SwipeableBottomSheet>
      )}

      {/* =========================================================================
          ORDER STEP DETAILS BOTTOM SHEET MODAL
         ========================================================================= */}
      <SwipeableBottomSheet
        isOpen={isStepSheetOpen}
        onClose={() => setIsStepSheetOpen(false)}
        title={`Langkah ${selectedStep.step}: ${selectedStep.title}`}
      >
        <div className="space-y-5 select-none font-ios pb-2">
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100/80 space-y-1.5">
            <h3 className="text-sm font-bold text-slate-900">
              {selectedStep.detailTitle}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedStep.detailDesc}
            </p>
          </div>

          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Perincian Penting
            </h4>
            <div className="space-y-2">
              {selectedStep.points.map((pt, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-blue-100 text-[#00BDFF] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <span className="leading-snug">{pt}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsStepSheetOpen(false)}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs text-center active:scale-[0.98] transition-all shadow-sm"
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
          title={policies[selectedPolicyKey].title}
        >
          <div className="space-y-4 select-none font-ios pb-2 text-xs">
            <div className="p-3 rounded-xl bg-blue-50 text-slate-700 leading-relaxed border border-blue-100/60">
              {policies[selectedPolicyKey].description}
            </div>

            <div className="space-y-3.5 max-h-[50vh] overflow-y-auto pr-1">
              {policies[selectedPolicyKey].sections?.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <h4 className="font-bold text-slate-900 text-xs">{sec.heading}</h4>
                  <p className="text-slate-600 leading-relaxed">{sec.text}</p>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPolicySheetOpen(false)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs text-center"
              >
                Tutup Maklumat
              </button>
            </div>
          </div>
        </SwipeableBottomSheet>
      )}

    </div>
  );
}
