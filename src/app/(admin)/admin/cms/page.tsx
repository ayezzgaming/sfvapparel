'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Image as ImageIcon, 
  Layers, 
  Video, 
  Quote, 
  Star, 
  Building2, 
  FileText, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  ExternalLink,
  Eye,
  Save,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  LayoutGrid,
  List,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Search,
  PackageCheck,
  Truck,
  Zap,
  Award,
  ThumbsUp,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { 
  CmsHeroBanner, 
  CmsService, 
  CmsProductionVideo, 
  CmsProductionGalleryItem, 
  CmsTestimonial,
  CmsTrustBadge
} from '@/types/database';
import ImageUploadField from '@/components/admin/ImageUploadField';
import { BADGE_THEMES, getTrustIconComponent } from '@/lib/cms/trust-badge-utils';

type CmsTabKey = 'hero' | 'badges' | 'services' | 'slogan' | 'videos' | 'gallery' | 'testimonials' | 'company' | 'policies';

export default function AdminCmsPage() {
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
    refreshAllDb,
    addHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
    addTrustBadge,
    updateTrustBadge,
    deleteTrustBadge,
    reorderTrustBadges,
    addService,
    updateService,
    deleteService,
    addProductionVideo,
    updateProductionVideo,
    deleteProductionVideo,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    addTestimonial,
    updateTestimonial,
    deleteTestimonial,
    updateSloganQuote,
    updateCompanySettings,
    updatePolicy,
    resetToSeedData,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<CmsTabKey>('hero');
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Sub-tab toggles for complex sections
  const [companySubTab, setCompanySubTab] = useState<'basic' | 'location' | 'contact' | 'social' | 'developer'>('basic');
  const [policySubTab, setPolicySubTab] = useState<'privacy' | 'terms' | 'warranty' | 'shipping'>('privacy');

  const triggerToast = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // -------------------------------------------------------------
  // HERO BANNER MODAL STATE
  // -------------------------------------------------------------
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<CmsHeroBanner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    image_url: '',
    status_pill: '',
    tag_text: '',
    title: '',
    button_text: '',
    button_link: '',
    is_active: true,
  });

  const handleOpenBannerModal = (banner?: CmsHeroBanner) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        image_url: banner.image_url,
        status_pill: banner.status_pill,
        tag_text: banner.tag_text,
        title: banner.title,
        button_text: banner.button_text,
        button_link: banner.button_link,
        is_active: banner.is_active,
      });
    } else {
      setEditingBanner(null);
      setBannerForm({
        image_url: '',
        status_pill: '',
        tag_text: '',
        title: '',
        button_text: '',
        button_link: '',
        is_active: true,
      });
    }
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title || !bannerForm.image_url) return;
    if (editingBanner) {
      updateHeroBanner(editingBanner.id, bannerForm);
      triggerToast('Slide banner berjaya dikemaskini!');
    } else {
      addHeroBanner({
        ...bannerForm,
        sort_order: heroBanners.length + 1,
      });
      triggerToast('Slide banner baharu berjaya ditambah!');
    }
    setIsBannerModalOpen(false);
  };

  // -------------------------------------------------------------
  // TRUST BADGES (KELEBIHAN & JAMINAN KILANG) MODAL STATE
  // -------------------------------------------------------------
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<CmsTrustBadge | null>(null);
  const [badgeForm, setBadgeForm] = useState({
    title: '',
    desc: '',
    pill: '',
    icon_name: 'Building2',
    color_theme: 'sky',
    is_active: true,
  });

  const handleOpenBadgeModal = (badge?: CmsTrustBadge) => {
    if (badge) {
      setEditingBadge(badge);
      setBadgeForm({
        title: badge.title,
        desc: badge.desc,
        pill: badge.pill,
        icon_name: badge.icon_name || 'Building2',
        color_theme: badge.color_theme || 'sky',
        is_active: badge.is_active,
      });
    } else {
      setEditingBadge(null);
      setBadgeForm({
        title: '',
        desc: '',
        pill: '',
        icon_name: 'Building2',
        color_theme: 'sky',
        is_active: true,
      });
    }
    setIsBadgeModalOpen(true);
  };

  const handleSaveBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeForm.title) return;
    if (editingBadge) {
      updateTrustBadge(editingBadge.id, badgeForm);
      triggerToast('Sorotan kelebihan berjaya dikemaskini!');
    } else {
      addTrustBadge({
        ...badgeForm,
        sort_order: (trustBadges || []).length + 1,
      });
      triggerToast('Sorotan kelebihan baharu berjaya ditambah!');
    }
    setIsBadgeModalOpen(false);
  };

  // -------------------------------------------------------------
  // SERVICE MODAL STATE
  // -------------------------------------------------------------
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<CmsService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    category: 'Sublimasi HD',
    title: '',
    headline: '',
    highlight: '',
    price_prefix: 'Bermula',
    price_amount: 'RM28',
    price_unit: '/ helai',
    image_url: '',
    href: '/catalog',
    is_active: true,
    details: [
      { title: 'Kualiti Cetakan', description: 'Cetakan resolusi tinggi tidak luntur' },
      { title: 'Material Fabrik', description: 'Kain microfiber sukan bernafas' },
    ],
  });

  const handleOpenServiceModal = (service?: CmsService) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        category: service.category,
        title: service.title,
        headline: service.headline,
        highlight: service.highlight,
        price_prefix: service.price_prefix,
        price_amount: service.price_amount,
        price_unit: service.price_unit,
        image_url: service.image_url,
        href: service.href,
        is_active: service.is_active,
        details: service.details || [],
      });
    } else {
      setEditingService(null);
      setServiceForm({
        category: 'Sublimasi HD',
        title: '',
        headline: 'Jersi Penuh Warna & Kustom Nama',
        highlight: 'Minima tempahan 5 helai',
        price_prefix: 'Bermula',
        price_amount: 'RM28',
        price_unit: '/ helai',
        image_url: '/images/prod_sublimation.jpg',
        href: '/catalog',
        is_active: true,
        details: [
          { title: 'Kualiti Cetakan', description: 'Cetakan resolusi tinggi tidak luntur' },
          { title: 'Material Fabrik', description: 'Kain microfiber sukan bernafas' },
        ],
      });
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title || !serviceForm.image_url) return;
    if (editingService) {
      updateService(editingService.id, serviceForm);
      triggerToast('Servis berjaya dikemaskini!');
    } else {
      addService({
        ...serviceForm,
        sort_order: services.length + 1,
      });
      triggerToast('Servis baharu berjaya ditambah!');
    }
    setIsServiceModalOpen(false);
  };

  // -------------------------------------------------------------
  // PRODUCTION VIDEO MODAL STATE
  // -------------------------------------------------------------
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<CmsProductionVideo | null>(null);
  const [videoForm, setVideoForm] = useState({
    category: 'Proses Cetakan',
    title: '',
    youtube_id: '',
    thumbnail_url: '',
    is_active: true,
  });

  const handleOpenVideoModal = (video?: CmsProductionVideo) => {
    if (video) {
      setEditingVideo(video);
      setVideoForm({
        category: video.category,
        title: video.title,
        youtube_id: video.youtube_id,
        thumbnail_url: video.thumbnail_url,
        is_active: video.is_active,
      });
    } else {
      setEditingVideo(null);
      setVideoForm({
        category: 'Proses Cetakan',
        title: '',
        youtube_id: 'dQw4w9WgXcQ',
        thumbnail_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
        is_active: true,
      });
    }
    setIsVideoModalOpen(true);
  };

  const handleSaveVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.title || !videoForm.youtube_id) return;
    if (editingVideo) {
      updateProductionVideo(editingVideo.id, videoForm);
      triggerToast('Video produksi berjaya dikemaskini!');
    } else {
      addProductionVideo({
        ...videoForm,
        sort_order: productionVideos.length + 1,
      });
      triggerToast('Video produksi baharu berjaya ditambah!');
    }
    setIsVideoModalOpen(false);
  };

  // -------------------------------------------------------------
  // GALLERY ITEM MODAL STATE
  // -------------------------------------------------------------
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<CmsProductionGalleryItem | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: 'Jersi Bola',
    fabric: 'Microfiber Eyelet',
    client: 'Kelab Tempatan',
    tag: 'Hasil Kilang',
    image_url: '',
    is_active: true,
  });

  const handleOpenGalleryModal = (item?: CmsProductionGalleryItem) => {
    if (item) {
      setEditingGallery(item);
      setGalleryForm({
        title: item.title,
        category: item.category,
        fabric: item.fabric,
        client: item.client,
        tag: item.tag,
        image_url: item.image_url,
        is_active: item.is_active,
      });
    } else {
      setEditingGallery(null);
      setGalleryForm({
        title: '',
        category: 'Jersi Sukan',
        fabric: 'Microfiber Eyelet 160gsm',
        client: 'Tempahan Rasmi',
        tag: 'Hasil Kilang',
        image_url: '/images/prod_sportswear.webp',
        is_active: true,
      });
    }
    setIsGalleryModalOpen(true);
  };

  const handleSaveGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galleryForm.title || !galleryForm.image_url) return;
    if (editingGallery) {
      updateGalleryItem(editingGallery.id, galleryForm);
      triggerToast('Item galeri berjaya dikemaskini!');
    } else {
      addGalleryItem({
        ...galleryForm,
        sort_order: productionGallery.length + 1,
      });
      triggerToast('Item galeri baharu berjaya ditambah!');
    }
    setIsGalleryModalOpen(false);
  };

  // -------------------------------------------------------------
  // TESTIMONIAL MODAL STATE
  // -------------------------------------------------------------
  const [isTestiModalOpen, setIsTestiModalOpen] = useState(false);
  const [editingTesti, setEditingTesti] = useState<CmsTestimonial | null>(null);
  const [testiForm, setTestiForm] = useState({
    name: '',
    location: 'Kuala Lumpur',
    initial: 'A',
    avatar_bg: '#E0F2FE',
    avatar_text: '#0369A1',
    platform: 'google' as 'google' | 'tiktok' | 'facebook' | 'instagram',
    rating: 5,
    review: '',
    is_active: true,
  });

  const handleOpenTestiModal = (testi?: CmsTestimonial) => {
    if (testi) {
      setEditingTesti(testi);
      setTestiForm({
        name: testi.name,
        location: testi.location,
        initial: testi.initial,
        avatar_bg: testi.avatar_bg,
        avatar_text: testi.avatar_text,
        platform: testi.platform,
        rating: testi.rating,
        review: testi.review,
        is_active: testi.is_active,
      });
    } else {
      setEditingTesti(null);
      setTestiForm({
        name: '',
        location: 'Shah Alam, Selangor',
        initial: 'S',
        avatar_bg: '#E0F2FE',
        avatar_text: '#0369A1',
        platform: 'google',
        rating: 5,
        review: 'Kualiti jersi sangat memuaskan, kain selesa dan cetakan tajam. Siap tepat pada masanya!',
        is_active: true,
      });
    }
    setIsTestiModalOpen(true);
  };

  const handleSaveTesti = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testiForm.name || !testiForm.review) return;
    const initial = testiForm.name.trim().charAt(0).toUpperCase() || 'U';
    if (editingTesti) {
      updateTestimonial(editingTesti.id, { ...testiForm, initial });
      triggerToast('Testimoni berjaya dikemaskini!');
    } else {
      addTestimonial({
        ...testiForm,
        initial,
      });
      triggerToast('Testimoni baharu berjaya ditambah!');
    }
    setIsTestiModalOpen(false);
  };

  // Helper for quick contextual add button
  const renderAddButton = () => {
    switch (activeTab) {
      case 'hero':
        return (
          <button
            type="button"
            onClick={() => handleOpenBannerModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Slide Banner</span>
          </button>
        );
      case 'badges':
        return (
          <button
            type="button"
            onClick={() => handleOpenBadgeModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Kelebihan</span>
          </button>
        );
      case 'services':
        return (
          <button
            type="button"
            onClick={() => handleOpenServiceModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Servis</span>
          </button>
        );
      case 'videos':
        return (
          <button
            type="button"
            onClick={() => handleOpenVideoModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Video</span>
          </button>
        );
      case 'gallery':
        return (
          <button
            type="button"
            onClick={() => handleOpenGalleryModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Hasil Kilang</span>
          </button>
        );
      case 'testimonials':
        return (
          <button
            type="button"
            onClick={() => handleOpenTestiModal()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Testimoni</span>
          </button>
        );
      default:
        return null;
    }
  };

  const SECTIONS: { id: CmsTabKey; label: string; desc: string; icon: React.ElementType; count?: number }[] = [
    { id: 'hero', label: 'Banner Utama', desc: 'Slide promosi & muka depan', icon: ImageIcon, count: (heroBanners || []).length },
    { id: 'badges', label: 'Sorotan & Kelebihan', desc: 'Kad nilai kilang (Direct Kilang, MOQ, QC)', icon: ShieldCheck, count: (trustBadges || []).length },
    { id: 'services', label: 'Servis Kilang', desc: 'Pakej servis & cetakan', icon: Layers, count: (services || []).length },
    { id: 'slogan', label: 'Slogan & CTA', desc: 'Tajuk inspirasi & WhatsApp', icon: Quote },
    { id: 'videos', label: 'Video Produksi', desc: 'Pautan video YouTube kilang', icon: Video, count: (productionVideos || []).length },
    { id: 'gallery', label: 'Hasil Kilang', desc: 'Portfolio jersi pelanggan', icon: Sparkles, count: (productionGallery || []).length },
    { id: 'testimonials', label: 'Testimoni', desc: 'Ulasan & penilaian bintang', icon: Star, count: (testimonials || []).length },
    { id: 'company', label: 'Profil Syarikat', desc: 'SSM, WhatsApp & Alamat', icon: Building2 },
    { id: 'policies', label: 'Polisi & Terma', desc: 'Privasi, Jaminan & Terma', icon: FileText },
  ];

  const filteredSections = SECTIONS.filter(
    (s) => s.label.toLowerCase().includes(searchFilter.toLowerCase()) || s.desc.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="w-full h-full overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950 flex flex-col p-4 gap-3 text-slate-900 dark:text-zinc-100 font-sans select-none">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* ----------------- TOP TOOLBAR BAR ----------------- */}
      <div className="shrink-0 flex items-center justify-between gap-3 min-h-[38px]">
        {/* Title & Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 tracking-tight">
              Pengurus Kandungan Web
            </span>
            <span className="text-[10px] font-semibold text-[#00BDFF] bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 rounded-full border border-sky-200/60 dark:border-sky-900">
              CMS Awam
            </span>
          </div>
        </div>

        {/* Toolbar Kanan */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 text-slate-700 dark:text-zinc-200 text-xs font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Pangkalan Data Supabase Aktif</span>
          </div>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-200 text-xs font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Lihat Web Awam</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          {/* Contextual Add Button */}
          {renderAddButton()}
        </div>
      </div>

      {/* ----------------- SPLIT PANEL BODY ----------------- */}
      <div className="flex-1 min-h-0 overflow-hidden flex items-stretch gap-4 relative animate-in fade-in">
        
        {/* =========================================================================
            SISI KIRI: PANEL NAVIGASI PENGURUSAN CMS
           ========================================================================= */}
        <div
          className={`flex flex-col h-full shrink-0 transition-all duration-300 ease-in-out select-none ${
            isLeftPanelCollapsed
              ? 'w-0 opacity-0 overflow-hidden pointer-events-none'
              : 'w-[280px] xl:w-[320px] opacity-100'
          }`}
        >
          {/* Search / Filter */}
          <div className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-2xs mb-2.5 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Cari modul CMS..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-zinc-800 text-xs text-slate-800 dark:text-zinc-100 placeholder-slate-400 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF] font-medium"
              />
            </div>
          </div>

          {/* Module Nav Items List */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1 pb-2 sparkle-scroll">
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeTab === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setActiveTab(sec.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sky-50/80 dark:bg-sky-950/40 border-2 border-[#00BDFF] ring-2 ring-[#00BDFF]/20 shadow-xs'
                      : 'bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 hover:bg-slate-50/70 dark:hover:bg-zinc-800/60 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#00BDFF] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs truncate ${isActive ? 'font-bold text-sky-950 dark:text-sky-100' : 'font-semibold text-slate-800 dark:text-zinc-200'}`}>
                        {sec.label}
                      </p>
                      <p className={`text-[10.5px] truncate mt-0.5 ${isActive ? 'text-[#00BDFF] dark:text-sky-300 font-medium' : 'text-slate-400 dark:text-zinc-500'}`}>
                        {sec.desc}
                      </p>
                    </div>
                  </div>

                  {sec.count !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                        isActive
                          ? 'bg-[#00BDFF] text-white'
                          : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      {sec.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            SISI KANAN: KAD UTAMA KANDUNGAN & EDITOR DENGAN TUAS TOGGLE
           ========================================================================= */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 shadow-sm flex flex-col h-full relative overflow-hidden transition-all duration-300 ease-in-out flex-1 min-w-0 mr-0">
          
          {/* Gagang Toggle Kapsul Sisi Kiri (Tuas Pengatur Luas Panel) */}
          <button
            type="button"
            onClick={() => setIsLeftPanelCollapsed((v) => !v)}
            title={isLeftPanelCollapsed ? 'Buka Panel Navigasi' : 'Sembunyikan Panel Navigasi'}
            className={`absolute left-[5px] top-1/2 -translate-y-1/2 h-12 rounded-full flex items-center justify-center cursor-pointer select-none z-40 transition-all duration-200 ease-out group p-0 border-0 outline-none origin-left ${
              isLeftPanelCollapsed
                ? 'w-5 bg-[#f0f4f9] hover:bg-[#e2e7ee] dark:bg-zinc-700'
                : 'w-1.5 hover:w-5 bg-[#f0f4f9] hover:bg-[#e2e7ee] dark:bg-zinc-700'
            }`}
          >
            <span
              className={`transition-opacity duration-150 flex items-center justify-center text-slate-500 dark:text-zinc-300 ${
                isLeftPanelCollapsed ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {isLeftPanelCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
            </span>
          </button>

          {/* ----------------- INTERNAL CARD HEADER WITH SUB-TOGGLES ----------------- */}
          <div className="shrink-0 px-6 py-3.5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-zinc-900/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                {activeTab === 'hero' && 'Pengurusan Slide Banner Utama'}
                {activeTab === 'badges' && 'Pengurusan Sorotan Kelebihan & Jaminan Kilang'}
                {activeTab === 'services' && 'Pengurusan Pilihan Servis Kilang'}
                {activeTab === 'slogan' && 'Slogan Utama & Ajakan Tindakan'}
                {activeTab === 'videos' && 'Rakaman Video Proses Produksi'}
                {activeTab === 'gallery' && 'Galeri Hasil Tempahan Sebenar'}
                {activeTab === 'testimonials' && 'Ulasan & Testimoni Pelanggan'}
                {activeTab === 'company' && 'Identiti Syarikat & Maklumat Rasmi'}
                {activeTab === 'policies' && 'Dasar, Jaminan & Polisi Kilang'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeTab === 'hero' && 'Susun imej banner, tajuk, tag dan pautan butang katalog muka depan'}
                {activeTab === 'badges' && 'Urus kad slaid nilai (Harga Direct Kilang, Tiada MOQ, QC, Siap Pantas) pada muka depan awam'}
                {activeTab === 'services' && 'Katalog kad servis, jenis cetakan dan penentuan harga'}
                {activeTab === 'slogan' && 'Sesuaikan teks tajuk inspirasi dan mesej templat WhatsApp'}
                {activeTab === 'videos' && 'Pautan rakaman YouTube untuk tatapan pelanggan'}
                {activeTab === 'gallery' && 'Pameran portfolio jersi siap dengan spesifikasi fabrik'}
                {activeTab === 'testimonials' && 'Koleksi maklum balas dan ulasan bintang daripada pelanggan'}
                {activeTab === 'company' && 'Maklumat rasmi SSM, nombor telefon, alamat, dan pautan media sosial'}
                {activeTab === 'policies' && 'Fasal jaminan kualiti, dasar pemulangan, dan terma tempahan'}
              </p>
            </div>

            {/* Contextual Internal Sub-Toggles */}
            <div className="flex items-center gap-2 shrink-0">
              {(activeTab === 'hero' || activeTab === 'badges' || activeTab === 'services' || activeTab === 'videos' || activeTab === 'gallery' || activeTab === 'testimonials') && (
                <div className="flex items-center bg-slate-100/90 dark:bg-zinc-800/90 p-1 rounded-full border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    title="Paparan Grid"
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-[#00BDFF] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('list')}
                    title="Paparan Senarai"
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-[#00BDFF] text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {activeTab === 'company' && (
                <div className="flex items-center space-x-1 bg-slate-100/90 dark:bg-zinc-800/90 p-1 rounded-full border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
                  {[
                    { id: 'basic', label: 'Asas & Jenama' },
                    { id: 'location', label: 'Alamat & Peta Lokasi' },
                    { id: 'contact', label: 'Telefon & Emel' },
                    { id: 'social', label: 'Pautan Sosial' },
                    { id: 'developer', label: 'Pembangun' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setCompanySubTab(sub.id as any)}
                      className={`px-3.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                        companySubTab === sub.id
                          ? 'bg-[#00BDFF] text-white shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900 font-medium'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'policies' && (
                <div className="flex items-center space-x-1 bg-slate-100/90 dark:bg-zinc-800/90 p-1 rounded-full border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
                  {[
                    { id: 'privacy', label: 'Privasi' },
                    { id: 'terms', label: 'Terma' },
                    { id: 'warranty', label: 'Jaminan' },
                    { id: 'shipping', label: 'Penghantaran' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setPolicySubTab(sub.id as any)}
                      className={`px-3.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                        policySubTab === sub.id
                          ? 'bg-[#00BDFF] text-white shadow-xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900 font-medium'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ----------------- SCROLLABLE CARD BODY ----------------- */}
          <div className="flex-1 overflow-y-auto sparkle-scroll p-5 sm:p-6 space-y-6">

            {/* =========================================================================
                TAB 1: BANNER UTAMA (HERO)
               ========================================================================= */}
            {activeTab === 'hero' && (
              <div className="space-y-4">
                {isLoadingCms ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden animate-pulse">
                        <div className="aspect-video bg-slate-200 dark:bg-zinc-700" />
                        <div className="p-3.5 space-y-2">
                          <div className="h-2.5 bg-slate-200 dark:bg-zinc-700 rounded w-1/3" />
                          <div className="h-3 bg-slate-200 dark:bg-zinc-700 rounded w-3/4" />
                          <div className="h-2 bg-slate-100 dark:bg-zinc-800 rounded w-1/2 mt-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : heroBanners.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 dark:bg-zinc-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 p-6">
                    <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-600 dark:text-zinc-300">Tiada slide banner aktif</p>
                    <button
                      type="button"
                      onClick={() => handleOpenBannerModal()}
                      className="mt-3 text-xs text-[#00BDFF] font-semibold hover:underline cursor-pointer"
                    >
                      + Tambah Slide Banner Sekarang
                    </button>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {heroBanners.map((banner) => (
                      <div
                        key={banner.id}
                        className={`group bg-white dark:bg-zinc-900 rounded-2xl border transition-all overflow-hidden flex flex-col ${
                          banner.is_active
                            ? 'border-slate-200/90 dark:border-zinc-800 shadow-2xs hover:shadow-md'
                            : 'border-slate-200/50 opacity-60 bg-slate-50/50'
                        }`}
                      >
                        <div className="relative aspect-video w-full bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={banner.image_url}
                            alt={banner.title}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white/90 text-slate-800 backdrop-blur-md border border-white/70 shadow-xs">
                              {banner.status_pill}
                            </span>
                          </div>
                          <div className="absolute top-2 right-2">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                banner.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {banner.is_active ? 'Aktif' : 'Nyahaktif'}
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <span className="text-[10px] text-[#00BDFF] font-bold uppercase tracking-wider block">
                              {banner.tag_text}
                            </span>
                            <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 line-clamp-1 mt-0.5">
                              {banner.title}
                            </h3>
                            <p className="text-[11px] text-slate-500 mt-1">
                              Butang: <span className="font-semibold text-slate-700 dark:text-zinc-300">{banner.button_text}</span> → <span className="font-mono text-slate-400">{banner.button_link}</span>
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                            <button
                              type="button"
                              onClick={() => updateHeroBanner(banner.id, { is_active: !banner.is_active })}
                              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              {banner.is_active ? 'Tukar ke Nyahaktif' : 'Aktifkan'}
                            </button>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenBannerModal(banner)}
                                className="p-1.5 rounded-full text-slate-500 hover:text-[#00BDFF] hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Padam banner ini?')) {
                                    deleteHeroBanner(banner.id);
                                    triggerToast('Banner dipadam');
                                  }
                                }}
                                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Padam"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
                    {heroBanners.map((banner) => (
                      <div key={banner.id} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50/50">
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-14 h-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={banner.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">{banner.title}</p>
                            <p className="text-[10.5px] text-slate-400">{banner.tag_text} · {banner.button_text} ({banner.button_link})</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${banner.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {banner.is_active ? 'Aktif' : 'Nyahaktif'}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenBannerModal(banner)}
                            className="p-1.5 rounded-full text-slate-500 hover:text-[#00BDFF] hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteHeroBanner(banner.id)}
                            className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 1.5: SOROTAN & KELEBIHAN KILANG (TRUST BADGES)
               ========================================================================= */}
            {activeTab === 'badges' && (
              <div className="space-y-4">
                {/* Info Card */}
                <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900/60 flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#00BDFF] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-sky-950 dark:text-sky-100">
                      Sorotan Nilai & Jaminan Terus Dari Kilang (Public Slider)
                    </p>
                    <p className="text-sky-800/80 dark:text-sky-300 text-[11px] leading-relaxed">
                      Kad ini dipaparkan betul-betul di bawah Banner Utama pada halaman depan pelanggan. Ia bertukar secara auto-slide untuk meyakinkan pelanggan tentang kelebihan kilang anda (Harga Direct Kilang, Tiada MOQ, Siap Pantas, QC Guarantee).
                    </p>
                  </div>
                </div>

                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(trustBadges || []).map((badge, idx) => {
                      const theme = BADGE_THEMES[badge.color_theme] || BADGE_THEMES.sky;
                      const Icon = getTrustIconComponent(badge.icon_name);
                      return (
                        <div
                          key={badge.id}
                          className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                        >
                          {/* Live Preview Header */}
                          <div className={`p-3.5 bg-gradient-to-r ${theme.gradient} border-b ${theme.border}`}>
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <span className="text-[10px] font-bold text-slate-400 font-mono">
                                #{idx + 1}
                              </span>
                              <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md border ${theme.pillStyle}`}>
                                {badge.pill || 'Status'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                                <Icon className="w-5 h-5 stroke-[2.2]" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                                  {badge.title}
                                </h4>
                                <p className="text-[10.5px] text-slate-500 font-medium truncate mt-0.5">
                                  {badge.desc}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Controls Footer */}
                          <div className="p-3 bg-white dark:bg-zinc-900 flex items-center justify-between border-t border-slate-100 dark:border-zinc-800">
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => updateTrustBadge(badge.id, { is_active: !badge.is_active })}
                                className={`text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full transition-colors cursor-pointer ${
                                  badge.is_active
                                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                }`}
                              >
                                {badge.is_active ? 'Aktif' : 'Nyahaktif'}
                              </button>
                              <span className="text-[10px] text-slate-400 capitalize">
                                Tema: {badge.color_theme || 'sky'}
                              </span>
                            </div>

                            <div className="flex items-center space-x-1">
                              {/* Reorder buttons */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => {
                                  if (idx === 0) return;
                                  const next = [...trustBadges];
                                  const temp = next[idx - 1];
                                  next[idx - 1] = next[idx];
                                  next[idx] = temp;
                                  reorderTrustBadges(next);
                                }}
                                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Gerak Ke Atas"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === (trustBadges || []).length - 1}
                                onClick={() => {
                                  if (idx === (trustBadges || []).length - 1) return;
                                  const next = [...trustBadges];
                                  const temp = next[idx + 1];
                                  next[idx + 1] = next[idx];
                                  next[idx] = temp;
                                  reorderTrustBadges(next);
                                }}
                                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                                title="Gerak Ke Bawah"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenBadgeModal(badge)}
                                className="p-1.5 rounded-full text-slate-500 hover:text-[#00BDFF] hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Padam sorotan "${badge.title}"?`)) {
                                    deleteTrustBadge(badge.id);
                                    triggerToast('Sorotan dipadam');
                                  }
                                }}
                                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                title="Padam"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden divide-y divide-slate-100 dark:divide-zinc-800">
                    {(trustBadges || []).map((badge, idx) => {
                      const theme = BADGE_THEMES[badge.color_theme] || BADGE_THEMES.sky;
                      const Icon = getTrustIconComponent(badge.icon_name);
                      return (
                        <div key={badge.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/50">
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <div className={`w-9 h-9 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0`}>
                              <Icon className="w-4.5 h-4.5 stroke-[2.2]" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-bold text-slate-800 dark:text-zinc-100 truncate">{badge.title}</p>
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${theme.pillStyle}`}>
                                  {badge.pill}
                                </span>
                              </div>
                              <p className="text-[10.5px] text-slate-400 truncate mt-0.5">{badge.desc}</p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold ${badge.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {badge.is_active ? 'Aktif' : 'Nyahaktif'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenBadgeModal(badge)}
                              className="p-1.5 rounded-full text-slate-500 hover:text-[#00BDFF] hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTrustBadge(badge.id)}
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 2: SERVIS KILANG
               ========================================================================= */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                {isLoadingCms ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 p-4 space-y-3 animate-pulse">
                        <div className="h-3 bg-slate-200 rounded w-1/3" />
                        <div className="h-4 bg-slate-200 rounded w-2/3" />
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-4 bg-slate-200 rounded w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : services.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                    <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-600">Tiada servis dikonfigurasikan</p>
                  </div>
                ) : viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((svc) => (
                      <div
                        key={svc.id}
                        className={`bg-white dark:bg-zinc-900 rounded-2xl border p-4 flex flex-col justify-between space-y-3 transition-all ${
                          svc.is_active ? 'border-slate-200/90 shadow-2xs hover:shadow-md' : 'border-slate-200/50 opacity-60'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-[#00BDFF] bg-sky-50 dark:bg-sky-950/50 px-2.5 py-0.5 rounded-full border border-sky-100 dark:border-sky-900">
                              {svc.category}
                            </span>
                            <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${svc.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {svc.is_active ? 'Aktif' : 'Nyahaktif'}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100">{svc.title}</h3>
                          <p className="text-[11px] text-slate-500 line-clamp-2">{svc.headline}</p>
                          <div className="pt-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-zinc-100">
                              {svc.price_prefix} <span className="text-[#00BDFF] text-sm font-extrabold">{svc.price_amount}</span> {svc.price_unit}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                          <button
                            type="button"
                            onClick={() => updateService(svc.id, { is_active: !svc.is_active })}
                            className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                          >
                            {svc.is_active ? 'Nyahaktif' : 'Aktifkan'}
                          </button>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenServiceModal(svc)}
                              className="p-1.5 rounded-full text-slate-500 hover:text-[#00BDFF] hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Padam servis ini?')) {
                                  deleteService(svc.id);
                                  triggerToast('Servis dipadam');
                                }
                              }}
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
                    {services.map((svc) => (
                      <div key={svc.id} className="p-3 flex items-center justify-between gap-4 hover:bg-slate-50/50">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{svc.title} <span className="text-slate-400 font-normal">({svc.category})</span></p>
                          <p className="text-[10.5px] text-slate-500">{svc.price_prefix} {svc.price_amount} {svc.price_unit} · {svc.highlight}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => handleOpenServiceModal(svc)}
                            className="p-1.5 rounded-full text-slate-500 hover:text-[#00BDFF] hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteService(svc.id)}
                            className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 3: SLOGAN & CTA
               ========================================================================= */}
            {activeTab === 'slogan' && (
              <div className="max-w-2xl space-y-4">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tajuk Utama Slogan</label>
                    <input
                      type="text"
                      value={sloganQuote?.headline || ''}
                      onChange={(e) => updateSloganQuote({ headline: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Teks Sorotan (Highlight Gradient)</label>
                    <input
                      type="text"
                      value={sloganQuote?.highlight_text || ''}
                      onChange={(e) => updateSloganQuote({ highlight_text: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Soalan Ajakan Tindakan</label>
                    <input
                      type="text"
                      value={sloganQuote?.question_text || ''}
                      onChange={(e) => updateSloganQuote({ question_text: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Penerangan Ringkas</label>
                    <textarea
                      rows={2}
                      value={sloganQuote?.description_text || ''}
                      onChange={(e) => updateSloganQuote({ description_text: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Teks Butang WhatsApp</label>
                      <input
                        type="text"
                        value={sloganQuote?.button_text || ''}
                        onChange={(e) => updateSloganQuote({ button_text: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Mesej Autofill WhatsApp</label>
                      <input
                        type="text"
                        value={sloganQuote?.whatsapp_message || ''}
                        onChange={(e) => updateSloganQuote({ whatsapp_message: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => triggerToast('Slogan & CTA berjaya disimpan!')}
                    className="px-5 py-2.5 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    Simpan Slogan & CTA
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 4: VIDEO PRODUKSI
               ========================================================================= */}
            {activeTab === 'videos' && (
              <div className="space-y-4">
                {isLoadingCms ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse">
                        <div className="aspect-video bg-slate-200" />
                        <div className="p-3.5 space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-1/2" />
                          <div className="h-2.5 bg-slate-100 rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : productionVideos.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                    <Video className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-600">Tiada video produksi aktif</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {productionVideos.map((vid) => (
                      <div
                        key={vid.id}
                        className={`bg-white dark:bg-zinc-900 rounded-2xl border overflow-hidden flex flex-col justify-between ${
                          vid.is_active ? 'border-slate-200/90 shadow-2xs' : 'border-slate-200/50 opacity-60'
                        }`}
                      >
                        <div className="relative aspect-video bg-slate-100 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={vid.thumbnail_url} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg">
                              ▶
                            </div>
                          </div>
                        </div>
                        <div className="p-3.5 space-y-2">
                          <span className="text-[10px] font-bold text-[#00BDFF] uppercase">{vid.category}</span>
                          <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">{vid.title}</h3>
                          <p className="text-[10.5px] font-mono text-slate-400">ID: {vid.youtube_id}</p>
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                            <button
                              type="button"
                              onClick={() => updateProductionVideo(vid.id, { is_active: !vid.is_active })}
                              className="text-[11px] font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
                            >
                              {vid.is_active ? 'Nyahaktif' : 'Aktifkan'}
                            </button>
                            <div className="flex items-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenVideoModal(vid)}
                                className="p-1.5 rounded-full text-slate-500 hover:text-[#00BDFF] hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteProductionVideo(vid.id)}
                                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 5: HASIL KILANG (GALLERY)
               ========================================================================= */}
            {activeTab === 'gallery' && (
              <div className="space-y-4">
                {isLoadingCms ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 overflow-hidden animate-pulse">
                        <div className="aspect-square bg-slate-200" />
                        <div className="p-2.5 space-y-2">
                          <div className="h-3 bg-slate-200 rounded w-2/3" />
                          <div className="h-2 bg-slate-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : productionGallery.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                    <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-600">Tiada portfolio galeri aktif</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
                    {productionGallery.map((gal) => (
                      <div
                        key={gal.id}
                        className={`bg-white dark:bg-zinc-900 rounded-2xl border overflow-hidden flex flex-col ${
                          gal.is_active ? 'border-slate-200/90 shadow-2xs' : 'border-slate-200/50 opacity-60'
                        }`}
                      >
                        <div className="relative aspect-square bg-slate-100 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={gal.image_url} alt="" className="w-full h-full object-cover" />
                          <span className="absolute top-2 left-2 text-[9.5px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 text-white backdrop-blur-xs">
                            {gal.tag}
                          </span>
                        </div>
                        <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                          <div>
                            <h4 className="text-[11.5px] font-bold text-slate-900 dark:text-zinc-100 truncate">{gal.title}</h4>
                            <p className="text-[10px] text-slate-400 truncate">{gal.fabric} · {gal.client}</p>
                          </div>
                          <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 dark:border-zinc-800">
                            <button
                              type="button"
                              onClick={() => handleOpenGalleryModal(gal)}
                              className="p-1.5 rounded-full text-slate-500 hover:text-[#00BDFF] hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteGalleryItem(gal.id)}
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 6: TESTIMONI
               ========================================================================= */}
            {activeTab === 'testimonials' && (
              <div className="space-y-4">
                {isLoadingCms ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 p-4 space-y-3 animate-pulse">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-slate-200" />
                          <div className="h-3 bg-slate-200 rounded w-24" />
                        </div>
                        <div className="h-3 bg-slate-100 rounded w-full" />
                        <div className="h-3 bg-slate-100 rounded w-3/4" />
                      </div>
                    ))}
                  </div>
                ) : testimonials.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                    <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-600">Tiada testimoni pelanggan</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {testimonials.map((testi) => (
                      <div
                        key={testi.id}
                        className={`bg-white dark:bg-zinc-900 rounded-2xl border p-4 flex flex-col justify-between space-y-3 ${
                          testi.is_active ? 'border-slate-200/90 shadow-2xs' : 'border-slate-200/50 opacity-60'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                                style={{ backgroundColor: testi.avatar_bg, color: testi.avatar_text }}
                              >
                                {testi.initial}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100">{testi.name}</h4>
                                <p className="text-[10px] text-slate-400">{testi.location}</p>
                              </div>
                            </div>
                            <div className="flex items-center text-amber-400">
                              {Array.from({ length: testi.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-zinc-300 italic line-clamp-3">
                            &ldquo;{testi.review}&rdquo;
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-zinc-800">
                          <span className="text-[10px] font-semibold uppercase text-slate-400">
                            {testi.platform}
                          </span>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenTestiModal(testi)}
                              className="p-1.5 rounded-full text-slate-500 hover:text-[#00BDFF] hover:bg-sky-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTestimonial(testi.id)}
                              className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* =========================================================================
                TAB 7: PROFIL SYARIKAT
               ========================================================================= */}
            {activeTab === 'company' && (
              <div className="max-w-3xl space-y-6">
                {companySubTab === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Nama Syarikat (Perniagaan Rasmi)</label>
                        <input
                          type="text"
                          value={companySettings.company_name}
                          onChange={(e) => updateCompanySettings({ company_name: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Nama Jenama / Brand</label>
                        <input
                          type="text"
                          value={companySettings.brand_name}
                          onChange={(e) => updateCompanySettings({ brand_name: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">No. Pendaftaran Syarikat (SSM)</label>
                        <input
                          type="text"
                          value={companySettings.registration_number}
                          onChange={(e) => updateCompanySettings({ registration_number: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Slogan Rasmi Jenama</label>
                        <input
                          type="text"
                          value={companySettings.tagline}
                          onChange={(e) => updateCompanySettings({ tagline: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {companySubTab === 'location' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Alamat Penuh Kilang / Pejabat Utama <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        rows={2}
                        value={companySettings.address}
                        onChange={(e) => updateCompanySettings({ address: e.target.value })}
                        placeholder="No 28-1, Jalan Prima Saujana 2/D, Taman Prima Saujana, 43000 Kajang, Selangor..."
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#00BDFF] focus:border-[#00BDFF] outline-none"
                      />
                      <p className="text-[10.5px] text-slate-400">
                        Alamat ini dipaparkan di footer pelanggan, resit pesanan, dan digunakan secara automatik untuk penjanaan peta Google Maps & Waze.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        Jadual Waktu Operasi Kilang <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={companySettings.working_hours}
                        onChange={(e) => updateCompanySettings({ working_hours: e.target.value })}
                        placeholder="Isnin - Jumaat: 9.00 AM - 6.00 PM | Sabtu: 9.00 AM - 1.00 PM"
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-[#00BDFF] focus:border-[#00BDFF] outline-none"
                      />
                      <p className="text-[10.5px] text-slate-400">
                        Format ringkas dan kemas untuk paparan kad footer dan bottom sheet pelanggan.
                      </p>
                    </div>

                    {/* Live Map Preview & Direct Test Navigation */}
                    <div className="pt-2 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#00BDFF]" />
                          <span>Pratonton Peta Lokasi Semasa:</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(companySettings.address || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00BDFF] hover:underline"
                          >
                            <span>Uji Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <span className="text-slate-300">·</span>
                          <a
                            href={`https://waze.com/ul?q=${encodeURIComponent(companySettings.address || '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#00BDFF] hover:underline"
                          >
                            <span>Uji Waze</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>

                      <div className="w-full aspect-[16/9] max-h-[260px] rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-700 shadow-inner bg-slate-100">
                        <iframe
                          title="Pratonton Peta CMS"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(companySettings.address || 'No 28-1, Jalan Prima Saujana 2/D, Taman Prima Saujana, 43000 Kajang, Selangor')}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                          width="100%"
                          height="100%"
                          style={{ border: 0 }}
                          loading="lazy"
                          className="w-full h-full"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {companySubTab === 'contact' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">No. WhatsApp Utama</label>
                        <input
                          type="text"
                          value={companySettings.whatsapp_number}
                          onChange={(e) => updateCompanySettings({ whatsapp_number: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">No. Telefon Pejabat</label>
                        <input
                          type="text"
                          value={companySettings.phone}
                          onChange={(e) => updateCompanySettings({ phone: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Emel Rasmi Sokongan</label>
                        <input
                          type="email"
                          value={companySettings.email}
                          onChange={(e) => updateCompanySettings({ email: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Mesej Asal WhatsApp (Default)</label>
                        <input
                          type="text"
                          value={companySettings.whatsapp_default_message || ''}
                          onChange={(e) => updateCompanySettings({ whatsapp_default_message: e.target.value })}
                          placeholder="cth: Hai SFV Apparel, saya ingin bertanya tentang tempahan..."
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {companySubTab === 'social' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Telegram URL</label>
                      <input
                        type="text"
                        value={companySettings.telegram_catalog_url}
                        onChange={(e) => updateCompanySettings({ telegram_catalog_url: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Facebook URL</label>
                      <input
                        type="text"
                        value={companySettings.facebook_url}
                        onChange={(e) => updateCompanySettings({ facebook_url: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Instagram URL</label>
                      <input
                        type="text"
                        value={companySettings.instagram_url}
                        onChange={(e) => updateCompanySettings({ instagram_url: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">TikTok URL</label>
                      <input
                        type="text"
                        value={companySettings.tiktok_url}
                        onChange={(e) => updateCompanySettings({ tiktok_url: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                      />
                    </div>
                  </div>
                )}

                {companySubTab === 'developer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Nama Pembangun Web</label>
                      <input
                        type="text"
                        value={companySettings.developer_name || ''}
                        onChange={(e) => updateCompanySettings({ developer_name: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Pautan Laman Pembangun</label>
                      <input
                        type="text"
                        value={companySettings.developer_url || ''}
                        onChange={(e) => updateCompanySettings({ developer_url: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => triggerToast('Profil syarikat berjaya disimpan!')}
                    className="px-5 py-2.5 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    Simpan Profil Syarikat
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================================
                TAB 8: POLISI & TERMA
               ========================================================================= */}
            {activeTab === 'policies' && (
              <div className="max-w-3xl space-y-6">
                {(() => {
                  const policy = policies[policySubTab];
                  return (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tajuk Polisi</label>
                        <input
                          type="text"
                          value={policy?.title || ''}
                          onChange={(e) => updatePolicy(policySubTab, { title: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Penerangan Ringkas</label>
                        <textarea
                          rows={2}
                          value={policy?.description || ''}
                          onChange={(e) => updatePolicy(policySubTab, { description: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                        />
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Seksyen Fasal</span>
                          <button
                            type="button"
                            onClick={() => {
                              const newSecs = [...(policy?.sections || []), { heading: 'Fasal Baru', text: 'Keterangan fasal...' }];
                              updatePolicy(policySubTab, { sections: newSecs });
                            }}
                            className="text-xs font-semibold text-[#00BDFF] hover:underline cursor-pointer"
                          >
                            + Tambah Fasal
                          </button>
                        </div>

                        {policy?.sections?.map((sec, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200/80 dark:border-zinc-700 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={sec.heading}
                                onChange={(e) => {
                                  const updated = [...policy.sections];
                                  updated[idx].heading = e.target.value;
                                  updatePolicy(policySubTab, { sections: updated });
                                }}
                                className="w-full px-2.5 py-1 text-xs font-bold bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = policy.sections.filter((_, i) => i !== idx);
                                  updatePolicy(policySubTab, { sections: updated });
                                }}
                                className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <textarea
                              rows={2}
                              value={sec.text}
                              onChange={(e) => {
                                  const updated = [...policy.sections];
                                  updated[idx].text = e.target.value;
                                  updatePolicy(policySubTab, { sections: updated });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => triggerToast('Polisi berjaya disimpan!')}
                          className="px-5 py-2.5 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
                        >
                          Simpan Polisi Ini
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: BANNER UTAMA
         ========================================================================= */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingBanner ? 'Kemaskini Slide Banner' : 'Tambah Slide Banner Baharu'}
              </h3>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveBanner} className="p-6 space-y-4">
              <ImageUploadField
                label="Imej Slide Banner (Disyorkan 16:9 atau 1200x675)"
                value={bannerForm.image_url}
                onChange={(url) => setBannerForm({ ...bannerForm, image_url: url })}
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Pill Status</label>
                  <input
                    type="text"
                    value={bannerForm.status_pill}
                    onChange={(e) => setBannerForm({ ...bannerForm, status_pill: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tag / Kategori</label>
                  <input
                    type="text"
                    value={bannerForm.tag_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, tag_text: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tajuk Utama Banner</label>
                <input
                  type="text"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="cth: Tempahan Jersi Sublimasi & DTF Kustom"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Teks Butang</label>
                  <input
                    type="text"
                    value={bannerForm.button_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Pautan Butang</label>
                  <input
                    type="text"
                    value={bannerForm.button_link}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_link: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-mono focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="bannerActive"
                  checked={bannerForm.is_active}
                  onChange={(e) => setBannerForm({ ...bannerForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-[#00BDFF] accent-[#00BDFF] focus:ring-[#00BDFF] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="bannerActive" className="text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Aktifkan slide banner ini di halaman web awam
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-5 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  Simpan Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1.5: SOROTAN & KELEBIHAN KILANG (TRUST BADGES)
         ========================================================================= */}
      {isBadgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingBadge ? 'Kemaskini Sorotan Kelebihan' : 'Tambah Sorotan Baharu'}
              </h3>
              <button
                type="button"
                onClick={() => setIsBadgeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBadge} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto sparkle-scroll">
              {/* Live Preview Inside Modal */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Pratonton Langsung Kad:</label>
                {(() => {
                  const theme = BADGE_THEMES[badgeForm.color_theme] || BADGE_THEMES.sky;
                  const Icon = getTrustIconComponent(badgeForm.icon_name);
                  return (
                    <div className={`p-3.5 rounded-2xl bg-gradient-to-r ${theme.gradient} border ${theme.border} shadow-xs flex items-center gap-3`}>
                      <div className={`w-10 h-10 rounded-xl ${theme.iconBg} flex items-center justify-center shrink-0 shadow-xs`}>
                        <Icon className="w-5 h-5 stroke-[2.2]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
                            {badgeForm.title || 'Tajuk Kelebihan'}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${theme.pillStyle}`}>
                            {badgeForm.pill || 'Status Pill'}
                          </span>
                        </div>
                        <p className="text-[10.5px] text-slate-500 font-medium truncate mt-0.5">
                          {badgeForm.desc || 'Penerangan ringkas kelebihan kilang...'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Title & Status Pill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Tajuk Sorotan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={badgeForm.title}
                    onChange={(e) => setBadgeForm({ ...badgeForm, title: e.target.value })}
                    placeholder="cth: Harga Direct Kilang"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-[#00BDFF] focus:border-[#00BDFF] outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Teks Tag / Status Pill <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={badgeForm.pill}
                    onChange={(e) => setBadgeForm({ ...badgeForm, pill: e.target.value })}
                    placeholder="cth: Direct Kilang"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-[#00BDFF] focus:border-[#00BDFF] outline-none"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Penerangan Ringkas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={badgeForm.desc}
                  onChange={(e) => setBadgeForm({ ...badgeForm, desc: e.target.value })}
                  placeholder="cth: Tanpa orang tengah · Lebih jimat & telus"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-2 focus:ring-[#00BDFF] focus:border-[#00BDFF] outline-none"
                  required
                />
              </div>

              {/* Icon Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Pilih Ikon Simbol:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {[
                    { name: 'Building2', label: 'Kilang' },
                    { name: 'PackageCheck', label: 'MOQ' },
                    { name: 'Clock', label: 'Pantas' },
                    { name: 'ShieldCheck', label: 'QC' },
                    { name: 'Truck', label: 'Pos' },
                    { name: 'Zap', label: 'Kilat' },
                    { name: 'CheckCircle2', label: 'Sahih' },
                    { name: 'Star', label: 'Bintang' },
                    { name: 'Sparkles', label: 'HD' },
                    { name: 'Award', label: 'Pakar' },
                    { name: 'ThumbsUp', label: 'Puas' },
                  ].map((ic) => {
                    const IcComponent = getTrustIconComponent(ic.name);
                    const isSelected = badgeForm.icon_name === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setBadgeForm({ ...badgeForm, icon_name: ic.name })}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50 dark:bg-sky-950/50 border-[#00BDFF] text-[#00BDFF] ring-2 ring-[#00BDFF]/20'
                            : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:border-slate-300'
                        }`}
                      >
                        <IcComponent className="w-4 h-4" />
                        <span className="text-[9px] font-medium truncate w-full text-center">{ic.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Theme Picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Pilih Tema Warna:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: 'sky', label: 'Biru Sky', bg: 'bg-[#00BDFF]', border: 'border-sky-300' },
                    { key: 'indigo', label: 'Indigo', bg: 'bg-indigo-600', border: 'border-indigo-300' },
                    { key: 'emerald', label: 'Hijau QC', bg: 'bg-emerald-600', border: 'border-emerald-300' },
                    { key: 'amber', label: 'Kuning Emas', bg: 'bg-amber-500', border: 'border-amber-300' },
                    { key: 'blue', label: 'Biru Royal', bg: 'bg-blue-600', border: 'border-blue-300' },
                    { key: 'rose', label: 'Merah Rose', bg: 'bg-rose-500', border: 'border-rose-300' },
                    { key: 'purple', label: 'Ungu Kreatif', bg: 'bg-purple-600', border: 'border-purple-300' },
                  ].map((thm) => {
                    const isSelected = badgeForm.color_theme === thm.key;
                    return (
                      <button
                        key={thm.key}
                        type="button"
                        onClick={() => setBadgeForm({ ...badgeForm, color_theme: thm.key })}
                        className={`p-2 rounded-xl border flex items-center space-x-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-sky-50/80 dark:bg-sky-950/40 border-[#00BDFF] ring-2 ring-[#00BDFF]/20'
                            : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 hover:border-slate-300'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full ${thm.bg} shrink-0 shadow-2xs`} />
                        <span className="text-[11px] font-medium text-slate-800 dark:text-zinc-200 truncate">
                          {thm.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="badge_active_check"
                  checked={badgeForm.is_active}
                  onChange={(e) => setBadgeForm({ ...badgeForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-[#00BDFF] accent-[#00BDFF] focus:ring-[#00BDFF] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="badge_active_check" className="text-xs font-semibold text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Aktifkan paparan sorotan ini pada halaman pelanggan
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBadgeModalOpen(false)}
                  className="px-5 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  Simpan Sorotan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: SERVIS KILANG
         ========================================================================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingService ? 'Kemaskini Servis Kilang' : 'Tambah Servis Baharu'}
              </h3>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveService} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Kategori</label>
                  <input
                    type="text"
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tajuk Servis</label>
                  <input
                    type="text"
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Penerangan / Headline</label>
                <input
                  type="text"
                  value={serviceForm.headline}
                  onChange={(e) => setServiceForm({ ...serviceForm, headline: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Awalan Harga</label>
                  <input
                    type="text"
                    value={serviceForm.price_prefix}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_prefix: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Harga (RM)</label>
                  <input
                    type="text"
                    value={serviceForm.price_amount}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_amount: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold text-[#00BDFF] focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Unit</label>
                  <input
                    type="text"
                    value={serviceForm.price_unit}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_unit: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  />
                </div>
              </div>

              <ImageUploadField
                label="Imej Servis"
                value={serviceForm.image_url}
                onChange={(url) => setServiceForm({ ...serviceForm, image_url: url })}
                required
              />

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="serviceActive"
                  checked={serviceForm.is_active}
                  onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-[#00BDFF] accent-[#00BDFF] focus:ring-[#00BDFF] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="serviceActive" className="text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Aktifkan servis ini di halaman utama
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-5 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  Simpan Servis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: VIDEO PRODUKSI
         ========================================================================= */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingVideo ? 'Kemaskini Video Produksi' : 'Tambah Video Baharu'}
              </h3>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveVideo} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Kategori Video</label>
                <input
                  type="text"
                  value={videoForm.category}
                  onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tajuk Video</label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">YouTube Video ID (cth: dQw4w9WgXcQ)</label>
                <input
                  type="text"
                  value={videoForm.youtube_id}
                  onChange={(e) => setVideoForm({ ...videoForm, youtube_id: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-mono focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  required
                />
              </div>

              <ImageUploadField
                label="Imej Thumbnail Video"
                value={videoForm.thumbnail_url}
                onChange={(url) => setVideoForm({ ...videoForm, thumbnail_url: url })}
                required
              />

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="videoActive"
                  checked={videoForm.is_active}
                  onChange={(e) => setVideoForm({ ...videoForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-[#00BDFF] accent-[#00BDFF] focus:ring-[#00BDFF] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="videoActive" className="text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Aktifkan video ini di galeri web awam
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-5 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  Simpan Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: HASIL KILANG
         ========================================================================= */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingGallery ? 'Kemaskini Hasil Kilang' : 'Tambah Portfolio Baharu'}
              </h3>
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveGallery} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tajuk Portfolio</label>
                  <input
                    type="text"
                    value={galleryForm.title}
                    onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Kategori</label>
                  <input
                    type="text"
                    value={galleryForm.category}
                    onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Fabrik</label>
                  <input
                    type="text"
                    value={galleryForm.fabric}
                    onChange={(e) => setGalleryForm({ ...galleryForm, fabric: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Pelanggan / Kelab</label>
                  <input
                    type="text"
                    value={galleryForm.client}
                    onChange={(e) => setGalleryForm({ ...galleryForm, client: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  />
                </div>
              </div>

              <ImageUploadField
                label="Imej Hasil Jersi"
                value={galleryForm.image_url}
                onChange={(url) => setGalleryForm({ ...galleryForm, image_url: url })}
                required
              />

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="galleryActive"
                  checked={galleryForm.is_active}
                  onChange={(e) => setGalleryForm({ ...galleryForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-[#00BDFF] accent-[#00BDFF] focus:ring-[#00BDFF] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="galleryActive" className="text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Pamerkan di galeri hasil kilang muka depan
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="px-5 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  Simpan Portfolio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: TESTIMONI
         ========================================================================= */}
      {isTestiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200 dark:border-zinc-800 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingTesti ? 'Kemaskini Testimoni' : 'Tambah Testimoni Baharu'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTestiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveTesti} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Nama Pelanggan</label>
                  <input
                    type="text"
                    value={testiForm.name}
                    onChange={(e) => setTestiForm({ ...testiForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Lokasi / Negeri</label>
                  <input
                    type="text"
                    value={testiForm.location}
                    onChange={(e) => setTestiForm({ ...testiForm, location: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Platform</label>
                  <select
                    value={testiForm.platform}
                    onChange={(e) => setTestiForm({ ...testiForm, platform: e.target.value as any })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  >
                    <option value="google">Google Review</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Penilaian Bintang (1 - 5)</label>
                  <select
                    value={testiForm.rating}
                    onChange={(e) => setTestiForm({ ...testiForm, rating: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Bintang)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Bintang)</option>
                    <option value={3}>⭐⭐⭐ (3 Bintang)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Ulasan Pelanggan</label>
                <textarea
                  rows={3}
                  value={testiForm.review}
                  onChange={(e) => setTestiForm({ ...testiForm, review: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs focus:ring-1 focus:ring-[#00BDFF] focus:border-[#00BDFF]"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="testiActive"
                  checked={testiForm.is_active}
                  onChange={(e) => setTestiForm({ ...testiForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-[#00BDFF] accent-[#00BDFF] focus:ring-[#00BDFF] w-4 h-4 cursor-pointer"
                />
                <label htmlFor="testiActive" className="text-xs text-slate-700 dark:text-zinc-300 cursor-pointer">
                  Pamerkan ulasan ini di web awam
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTestiModalOpen(false)}
                  className="px-5 py-2 rounded-full border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 cursor-pointer active:scale-95 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#00BDFF] hover:bg-[#00a6e0] text-white text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-all"
                >
                  Simpan Testimoni
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
