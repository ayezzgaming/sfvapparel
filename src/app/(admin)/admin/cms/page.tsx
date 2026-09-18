'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Palette,
  Globe, 
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
  Smartphone,
  CheckCircle2,
  LayoutGrid,
  List
} from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { 
  CmsHeroBanner, 
  CmsService, 
  CmsProductionVideo, 
  CmsProductionGalleryItem, 
  CmsTestimonial, 
  CmsCompanySettings, 
  CmsSloganQuote,
  CmsPolicy,
  CmsThemeSettings,
  CmsThemePresetKey
} from '@/types/database';
import { THEME_PRESETS } from '@/lib/store/seed-data';
import ImageUploadField from '@/components/admin/ImageUploadField';

export default function AdminCmsPage() {
  const {
    heroBanners,
    services,
    productionVideos,
    productionGallery,
    testimonials,
    sloganQuote,
    companySettings,
    policies,
    themeSettings,
    addHeroBanner,
    updateHeroBanner,
    deleteHeroBanner,
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
    updateThemeSettings,
    applyThemePreset,
    resetToSeedData,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'theme' | 'hero' | 'services' | 'slogan' | 'videos' | 'gallery' | 'testimonials' | 'company' | 'policies'>('theme');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [saveToast, setSaveToast] = useState<string | null>(null);

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
    status_pill: 'Kilang Beroperasi',
    tag_text: 'Koleksi Rasmi 2026',
    title: '',
    button_text: 'Katalog',
    button_link: '/catalog',
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
        image_url: '/hero1.png',
        status_pill: 'Kilang Beroperasi',
        tag_text: 'Koleksi Rasmi 2026',
        title: 'Studio Jersi & DTF Kustom',
        button_text: 'Katalog',
        button_link: '/catalog',
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
  // SERVICE MODAL STATE
  // -------------------------------------------------------------
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<CmsService | null>(null);
  const [serviceForm, setServiceForm] = useState<Omit<CmsService, 'id' | 'sort_order'>>({
    category: 'Sublimasi Penuh',
    title: '',
    headline: '',
    highlight: '',
    price_prefix: 'Bermula',
    price_amount: 'RM28',
    price_unit: '/ helai',
    image_url: '/images/prod_sportswear.jpg',
    href: '/catalog?type=sublimation',
    is_active: true,
    details: [
      { title: 'Ciri Utama', description: 'Keterangan ringkas mengenai ciri produk ini.' }
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
        category: 'Sublimasi Penuh',
        title: 'Jersi Sukan & Korporat',
        headline: 'Warna Tajam, Tahan Lasak',
        highlight: 'Cetakan sublimasi berkualiti tinggi tanpa had warna.',
        price_prefix: 'Bermula',
        price_amount: 'RM28',
        price_unit: '/ helai',
        image_url: '/images/prod_sportswear.jpg',
        href: '/catalog?type=sublimation',
        is_active: true,
        details: [
          { title: 'Material', description: 'Microfiber Eyelet 160 GSM' },
          { title: 'Teknologi', description: 'Full Sublimation High-Definition' }
        ],
      });
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title || !serviceForm.category) return;
    if (editingService) {
      updateService(editingService.id, serviceForm);
      triggerToast('Pilihan servis berjaya dikemaskini!');
    } else {
      addService({
        ...serviceForm,
        sort_order: services.length + 1,
      });
      triggerToast('Pilihan servis baharu berjaya ditambah!');
    }
    setIsServiceModalOpen(false);
  };

  // -------------------------------------------------------------
  // VIDEO MODAL STATE
  // -------------------------------------------------------------
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<CmsProductionVideo | null>(null);
  const [videoForm, setVideoForm] = useState({
    title: '',
    category: 'Proses Sublimasi',
    youtube_id: 'q6U_y9-pX_4',
    thumbnail_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80',
    is_active: true,
  });

  const handleOpenVideoModal = (video?: CmsProductionVideo) => {
    if (video) {
      setEditingVideo(video);
      setVideoForm({
        title: video.title,
        category: video.category,
        youtube_id: video.youtube_id,
        thumbnail_url: video.thumbnail_url,
        is_active: video.is_active,
      });
    } else {
      setEditingVideo(null);
      setVideoForm({
        title: 'Rakaman Proses Cetakan Kilang',
        category: 'Proses Sublimasi',
        youtube_id: 'q6U_y9-pX_4',
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
  // GALLERY MODAL STATE
  // -------------------------------------------------------------
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGallery, setEditingGallery] = useState<CmsProductionGalleryItem | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    category: 'Sublimasi Penuh',
    fabric: 'Drifit Milano 165 GSM • Kolar V-Pro',
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=80',
    client: '50 helai • FC Harimau Selangor',
    tag: 'Full Sublimation',
    is_active: true,
  });

  const handleOpenGalleryModal = (item?: CmsProductionGalleryItem) => {
    if (item) {
      setEditingGallery(item);
      setGalleryForm({
        title: item.title,
        category: item.category,
        fabric: item.fabric,
        image_url: item.image_url,
        client: item.client,
        tag: item.tag,
        is_active: item.is_active,
      });
    } else {
      setEditingGallery(null);
      setGalleryForm({
        title: 'Jersi Tempahan Siap',
        category: 'Sublimasi Penuh',
        fabric: 'Microfiber Eyelet 160 GSM',
        image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1000&auto=format&fit=crop&q=80',
        client: '30 helai • Team Cyberjaya',
        tag: 'Sublimation',
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
      triggerToast('Hasil produksi berjaya dikemaskini!');
    } else {
      addGalleryItem({
        ...galleryForm,
        sort_order: productionGallery.length + 1,
      });
      triggerToast('Hasil produksi baharu berjaya ditambah!');
    }
    setIsGalleryModalOpen(false);
  };

  // -------------------------------------------------------------
  // TESTIMONIAL MODAL STATE
  // -------------------------------------------------------------
  const [isTestiModalOpen, setIsTestiModalOpen] = useState(false);
  const [editingTesti, setEditingTesti] = useState<CmsTestimonial | null>(null);
  const [testiForm, setTestiForm] = useState<{
    name: string;
    location: string;
    initial: string;
    avatar_bg: string;
    avatar_text: string;
    platform: 'google' | 'tiktok' | 'facebook' | 'instagram';
    rating: number;
    review: string;
    is_active: boolean;
  }>({
    name: '',
    location: '',
    initial: 'A',
    avatar_bg: 'bg-blue-100',
    avatar_text: 'text-blue-600',
    platform: 'google',
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
        name: 'Ahmad Faiz',
        location: 'Shah Alam, Selangor',
        initial: 'A',
        avatar_bg: 'bg-blue-100',
        avatar_text: 'text-blue-600',
        platform: 'google',
        rating: 5,
        review: 'Kualiti jersi dan jahitan memang kemas. Warna cetakan sangat tajam dan penghantaran tepat pada masa yang dijanjikan.',
        is_active: true,
      });
    }
    setIsTestiModalOpen(true);
  };

  const handleSaveTesti = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testiForm.name || !testiForm.review) return;
    const initial = testiForm.name.charAt(0).toUpperCase() || 'A';
    if (editingTesti) {
      updateTestimonial(editingTesti.id, { ...testiForm, initial });
      triggerToast('Testimoni berjaya dikemaskini!');
    } else {
      addTestimonial({ ...testiForm, initial });
      triggerToast('Testimoni baharu berjaya ditambah!');
    }
    setIsTestiModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* ----------------- TOP HEADER BAR ----------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-slate-800 tracking-tight">
            Kandungan & Tema
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pengurusan tema warna, hero banner, senarai servis, galeri kilang, dan maklumat syarikat
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {saveToast && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-in fade-in">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{saveToast}</span>
            </div>
          )}

          <button
            onClick={() => {
              if (confirm('Tetapkan semula semua data CMS dan Tema ke nilai asal?')) {
                resetToSeedData();
                triggerToast('Semua tetapan dikembalikan ke nilai lalai asal');
              }
            }}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium border border-slate-200 shadow-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Lalai</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Lihat Laman Awam</span>
            <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
          </Link>
        </div>
      </div>

      {/* ----------------- CMS SECTION TABS ----------------- */}
      <div className="bg-slate-100 p-1 rounded-full border border-slate-200 flex items-center space-x-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'theme', label: 'Tema & Warna', icon: Palette },
          { id: 'hero', label: 'Hero Banner', icon: ImageIcon, count: heroBanners.length },
          { id: 'services', label: 'Servis', icon: Layers, count: services.length },
          { id: 'slogan', label: 'Slogan & CTA', icon: Quote },
          { id: 'videos', label: 'Video', icon: Video, count: productionVideos.length },
          { id: 'gallery', label: 'Galeri Kilang', icon: ImageIcon, count: productionGallery.length },
          { id: 'testimonials', label: 'Testimoni', icon: Star, count: testimonials.length },
          { id: 'company', label: 'Syarikat', icon: Building2 },
          { id: 'policies', label: 'Polisi', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-medium ${isActive ? 'bg-slate-100 text-slate-700' : 'text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ----------------- MAIN TAB CONTENT AREA ----------------- */}
      <div className="space-y-6">

        {/* =========================================================================
            TAB 0: TEMA & WARNA (THEME STUDIO)
           ========================================================================= */}
        {activeTab === 'theme' && (
          <div className="space-y-6 max-w-6xl">
            {/* 1-Click Presets */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Pilihan Tema Pratetap (1-Click Presets)</h2>
                <p className="text-xs text-slate-500">Pilih skema warna standard identiti jenama yang telah dioptimumkan</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Preset 1: Hybrid */}
                <div 
                  onClick={() => {
                    applyThemePreset('hybrid');
                    triggerToast('Tema "Royal Blue Hybrid" telah digunakan!');
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    themeSettings?.preset === 'hybrid'
                      ? 'border-[#0052FF] bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">Royal Blue Hybrid</span>
                      {themeSettings?.preset === 'hybrid' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0052FF] text-white flex items-center gap-1">
                          <Check className="w-3 h-3" /> Dipilih
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Header Royal Blue pekat dengan logo putih. Bottom Nav warna putih berkabut (frosted) dengan ikon Royal Blue.
                    </p>
                    {/* Visual representation */}
                    <div className="rounded-lg border border-slate-200 overflow-hidden text-[10px]">
                      <div className="bg-[#0052FF] text-white px-3 py-2 flex items-center justify-between font-bold">
                        <span>SFV APPAREL</span>
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-white/80" />
                          <span className="w-2 h-2 rounded-full bg-white/80" />
                        </div>
                      </div>
                      <div className="bg-slate-100 p-3 text-center text-slate-400">Kandungan Utama</div>
                      <div className="bg-white border-t border-slate-200 px-3 py-1.5 flex justify-around text-[#0052FF] font-semibold">
                        <span>Utama</span>
                        <span className="text-slate-400">Katalog</span>
                        <span className="text-slate-400">Pesanan</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preset 2: Clean Minimal White */}
                <div 
                  onClick={() => {
                    applyThemePreset('clean_white');
                    triggerToast('Tema "Clean Minimal White" telah digunakan!');
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    themeSettings?.preset === 'clean_white'
                      ? 'border-[#0052FF] bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">Clean Minimal White</span>
                      {themeSettings?.preset === 'clean_white' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0052FF] text-white flex items-center gap-1">
                          <Check className="w-3 h-3" /> Dipilih
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Header putih bersih dengan logo biru asal. Bottom Nav putih minimalis.
                    </p>
                    {/* Visual representation */}
                    <div className="rounded-lg border border-slate-200 overflow-hidden text-[10px]">
                      <div className="bg-white border-b border-slate-200 text-[#0052FF] px-3 py-2 flex items-center justify-between font-bold">
                        <span>SFV APPAREL</span>
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                          <span className="w-2 h-2 rounded-full bg-slate-400" />
                        </div>
                      </div>
                      <div className="bg-slate-100 p-3 text-center text-slate-400">Kandungan Utama</div>
                      <div className="bg-white border-t border-slate-200 px-3 py-1.5 flex justify-around text-[#0052FF] font-semibold">
                        <span>Utama</span>
                        <span className="text-slate-400">Katalog</span>
                        <span className="text-slate-400">Pesanan</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preset 3: Full Royal Blue */}
                <div 
                  onClick={() => {
                    applyThemePreset('full_blue');
                    triggerToast('Tema "Full Royal Blue" telah digunakan!');
                  }}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    themeSettings?.preset === 'full_blue'
                      ? 'border-[#0052FF] bg-blue-50/40 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">Full Royal Blue</span>
                      {themeSettings?.preset === 'full_blue' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0052FF] text-white flex items-center gap-1">
                          <Check className="w-3 h-3" /> Dipilih
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      Header dan Bottom Navigation keduanya berwarna Royal Blue penuh dengan teks & ikon putih.
                    </p>
                    {/* Visual representation */}
                    <div className="rounded-lg border border-slate-200 overflow-hidden text-[10px]">
                      <div className="bg-[#0052FF] text-white px-3 py-2 flex items-center justify-between font-bold">
                        <span>SFV APPAREL</span>
                        <div className="flex gap-1">
                          <span className="w-2 h-2 rounded-full bg-white/80" />
                          <span className="w-2 h-2 rounded-full bg-white/80" />
                        </div>
                      </div>
                      <div className="bg-slate-100 p-3 text-center text-slate-400">Kandungan Utama</div>
                      <div className="bg-[#0052FF] border-t border-blue-600 px-3 py-1.5 flex justify-around text-white font-semibold">
                        <span>Utama</span>
                        <span className="text-blue-200">Katalog</span>
                        <span className="text-blue-200">Pesanan</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Color Settings Grid & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Controls Column */}
              <div className="lg:col-span-2 space-y-6">
                {/* Header Customizer */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-sm text-slate-900">Kustomisasi Header / Bar Atas</h3>
                    <p className="text-xs text-slate-500">Kawal warna latar, mod warna logo dan gaya header</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Header BG */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Warna Latar Header</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={themeSettings?.header_bg?.startsWith('#') ? themeSettings.header_bg : '#0052FF'}
                          onChange={(e) => updateThemeSettings({ header_bg: e.target.value, preset: 'custom' })}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={themeSettings?.header_bg || '#0052FF'}
                          onChange={(e) => updateThemeSettings({ header_bg: e.target.value, preset: 'custom' })}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white"
                        />
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        {['#0052FF', '#FFFFFF', '#0F172A', '#1E293B', '#2563EB', '#4F46E5'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateThemeSettings({ header_bg: color, preset: 'custom' })}
                            className="w-6 h-6 rounded-md border border-slate-200 shadow-xs transition-transform active:scale-95"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Logo Mode */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Mod Warna Logo Header</label>
                      <select
                        value={themeSettings?.header_logo_mode || 'inverted_white'}
                        onChange={(e) => updateThemeSettings({ header_logo_mode: e.target.value as any, preset: 'custom' })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white"
                      >
                        <option value="inverted_white">Putih Bersih (Invert - Untuk Latar Gelap/Biru)</option>
                        <option value="original_blue">Biru Asal Jenama (Untuk Latar Putih/Terang)</option>
                      </select>
                      <p className="text-[11px] text-slate-400">
                        Gunakan mod Putih jika header anda berwarna biru atau gelap.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation Customizer */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-sm text-slate-900">Kustomisasi Navigasi Bawah (Bottom Tab Bar)</h3>
                    <p className="text-xs text-slate-500">Kawal warna tab bar, warna ikon aktif dan tab pasif</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Bottom Nav BG */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Warna Latar Tab Bar</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={themeSettings?.bottom_nav_bg?.startsWith('#') ? themeSettings.bottom_nav_bg : '#FFFFFF'}
                          onChange={(e) => updateThemeSettings({ bottom_nav_bg: e.target.value, preset: 'custom' })}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={themeSettings?.bottom_nav_bg || 'rgba(255, 255, 255, 0.95)'}
                          onChange={(e) => updateThemeSettings({ bottom_nav_bg: e.target.value, preset: 'custom' })}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white"
                        />
                      </div>
                      <div className="flex gap-1.5 pt-1">
                        {['rgba(255, 255, 255, 0.95)', '#FFFFFF', '#0052FF', '#0F172A', '#F8FAFC'].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => updateThemeSettings({ bottom_nav_bg: color, preset: 'custom' })}
                            className="w-6 h-6 rounded-md border border-slate-200 shadow-xs transition-transform active:scale-95"
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Active Color */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Warna Tab / Ikon Aktif</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={themeSettings?.bottom_nav_active_color || '#0052FF'}
                          onChange={(e) => updateThemeSettings({ bottom_nav_active_color: e.target.value, preset: 'custom' })}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={themeSettings?.bottom_nav_active_color || '#0052FF'}
                          onChange={(e) => updateThemeSettings({ bottom_nav_active_color: e.target.value, preset: 'custom' })}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Inactive Color */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Warna Tab Tidak Aktif</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={themeSettings?.bottom_nav_inactive_color || '#94A3B8'}
                          onChange={(e) => updateThemeSettings({ bottom_nav_inactive_color: e.target.value, preset: 'custom' })}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={themeSettings?.bottom_nav_inactive_color || '#94A3B8'}
                          onChange={(e) => updateThemeSettings({ bottom_nav_inactive_color: e.target.value, preset: 'custom' })}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* WhatsApp FAB Color */}
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Warna Butang Terapung WhatsApp</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={themeSettings?.whatsapp_fab_bg || '#25D366'}
                          onChange={(e) => updateThemeSettings({ whatsapp_fab_bg: e.target.value, preset: 'custom' })}
                          className="w-10 h-10 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={themeSettings?.whatsapp_fab_bg || '#25D366'}
                          onChange={(e) => updateThemeSettings({ whatsapp_fab_bg: e.target.value, preset: 'custom' })}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => triggerToast('Tetapan tema dan warna berjaya disimpan!')}
                      className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Tetapan Tema</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Live Mini Mobile Preview Frame */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-[#0052FF]" />
                    Pratonton Langsung Mobile
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Masa Nyata
                  </span>
                </div>

                <div className="w-full rounded-3xl border-4 border-slate-800 bg-white overflow-hidden shadow-xl flex flex-col h-[520px]">
                  {/* Mock Header */}
                  <div 
                    className="p-3.5 flex items-center justify-between border-b transition-colors"
                    style={{ 
                      backgroundColor: themeSettings?.header_bg || '#0052FF',
                      borderColor: themeSettings?.header_bg === '#FFFFFF' ? '#E2E8F0' : 'rgba(255,255,255,0.15)'
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`w-5 h-5 rounded flex items-center justify-center font-black text-[10px] ${
                        themeSettings?.header_logo_mode === 'inverted_white' || themeSettings?.header_bg === '#0052FF'
                          ? 'bg-white text-[#0052FF]'
                          : 'bg-[#0052FF] text-white'
                      }`}>
                        S
                      </div>
                      <span className={`font-black text-xs tracking-tight ${
                        themeSettings?.header_logo_mode === 'inverted_white' || themeSettings?.header_bg === '#0052FF'
                          ? 'text-white'
                          : 'text-[#0052FF]'
                      }`}>
                        SFV APPAREL
                      </span>
                    </div>
                    <div className="flex space-x-1">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                        themeSettings?.header_bg === '#0052FF' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>♥</span>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${
                        themeSettings?.header_bg === '#0052FF' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>🛍</span>
                    </div>
                  </div>

                  {/* Mock Content */}
                  <div className="flex-1 p-3 bg-slate-100/70 space-y-3 overflow-hidden text-xs">
                    <div className="h-28 rounded-xl bg-slate-800 text-white p-3 flex flex-col justify-end">
                      <span className="text-[9px] uppercase font-bold text-blue-300">Koleksi 2026</span>
                      <span className="font-extrabold text-sm">Studio Jersi & DTF</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-1">
                      <span className="font-bold text-[11px] text-slate-800 block">Pilihan Servis Utama</span>
                      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                        <div className="p-2 rounded bg-slate-50 border border-slate-100 font-semibold text-slate-700">Sublimasi Jersi</div>
                        <div className="p-2 rounded bg-slate-50 border border-slate-100 font-semibold text-slate-700">Cetak DTF Baju</div>
                      </div>
                    </div>
                  </div>

                  {/* Mock Bottom Nav */}
                  <div 
                    className="p-2 border-t flex items-center justify-around transition-colors"
                    style={{ 
                      backgroundColor: themeSettings?.bottom_nav_bg || 'rgba(255, 255, 255, 0.95)',
                      borderColor: themeSettings?.bottom_nav_bg === '#0052FF' ? '#0044D6' : '#E2E8F0'
                    }}
                  >
                    <div className="flex flex-col items-center" style={{ color: themeSettings?.bottom_nav_active_color || '#0052FF' }}>
                      <span className="text-xs">⌂</span>
                      <span className="text-[9px] font-bold">Utama</span>
                    </div>
                    <div className="flex flex-col items-center" style={{ color: themeSettings?.bottom_nav_inactive_color || '#94A3B8' }}>
                      <span className="text-xs">▦</span>
                      <span className="text-[9px]">Katalog</span>
                    </div>
                    <div className="flex flex-col items-center" style={{ color: themeSettings?.bottom_nav_inactive_color || '#94A3B8' }}>
                      <span className="text-xs">⏱</span>
                      <span className="text-[9px]">Pesanan</span>
                    </div>
                    <div className="flex flex-col items-center" style={{ color: themeSettings?.bottom_nav_inactive_color || '#94A3B8' }}>
                      <span className="text-xs">👤</span>
                      <span className="text-[9px]">Profil</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 1: HERO BANNERS
           ========================================================================= */}
        {activeTab === 'hero' && (
          <div className="space-y-4 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Slide Banner Utama (Hero Slider)</h2>
                <p className="text-xs text-slate-500">Uruskan gambar banner di bahagian atas halaman utama</p>
              </div>
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-white text-[#0052FF] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Grid"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-[#0052FF] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Senarai / Jadual"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenBannerModal()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Slide Banner</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {heroBanners.map((banner, index) => (
                  <div key={banner.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="relative h-44 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10.5px] font-semibold text-white">
                        Slide #{index + 1}
                      </div>
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <span className="text-[10px] font-bold uppercase text-blue-200 block">{banner.tag_text}</span>
                        <h3 className="text-sm font-bold truncate drop-shadow">{banner.title}</h3>
                      </div>
                    </div>

                    <div className="p-4 space-y-3 bg-white flex-1 flex flex-col justify-between">
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between text-slate-500">
                          <span>Pill Status:</span>
                          <span className="text-slate-900 font-medium">{banner.status_pill}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Butang Pautan:</span>
                          <span className="text-[#0052FF] font-mono text-[11px]">{banner.button_link}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${banner.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                          {banner.is_active ? 'AKTIF' : 'TIDAK AKTIF'}
                        </span>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenBannerModal(banner)}
                            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Edit Banner"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {heroBanners.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm('Padam slide banner ini?')) {
                                  deleteHeroBanner(banner.id);
                                  triggerToast('Banner berjaya dipadam.');
                                }
                              }}
                              className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                              title="Padam Banner"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List Mode Table */
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Susunan & Imej</th>
                      <th className="p-3.5">Tajuk Banner</th>
                      <th className="p-3.5">Tag & Status Pill</th>
                      <th className="p-3.5">Pautan Butang</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {heroBanners.map((banner, idx) => (
                      <tr key={banner.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-slate-400 font-mono">#{idx + 1}</span>
                            <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{banner.title}</td>
                        <td className="p-3.5">
                          <span className="text-slate-600 block">{banner.tag_text}</span>
                          <span className="text-[10px] text-slate-400 font-normal">{banner.status_pill}</span>
                        </td>
                        <td className="p-3.5 font-mono text-[#0052FF]">{banner.button_text} ({banner.button_link})</td>
                        <td className="p-3.5">
                          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${banner.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                            {banner.is_active ? 'AKTIF' : 'TIDAK AKTIF'}
                          </span>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenBannerModal(banner)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {heroBanners.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm('Padam slide banner ini?')) {
                                    deleteHeroBanner(banner.id);
                                    triggerToast('Banner berjaya dipadam.');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: PILIHAN SERVIS
           ========================================================================= */}
        {activeTab === 'services' && (
          <div className="space-y-4 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Kad Pilihan Servis</h2>
                <p className="text-xs text-slate-500">Ubah tajuk servis, gambar, harga bermula dan butiran penerangan</p>
              </div>
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-white text-[#0052FF] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Grid"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-[#0052FF] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Senarai / Jadual"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenServiceModal()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Servis Baru</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="relative h-40 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-[#0052FF] text-white text-[10px] font-bold px-2.5 py-0.5 rounded shadow-sm">
                        {item.category}
                      </div>
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{item.highlight}</p>
                        <div className="mt-2 text-xs font-bold text-[#0052FF]">
                          {item.price_prefix} {item.price_amount} {item.price_unit}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">{item.details?.length || 0} Perenggan Info</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenServiceModal(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {services.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm('Padam servis ini?')) {
                                  deleteService(item.id);
                                  triggerToast('Servis berjaya dipadam.');
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View Table */
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Imej & Kategori</th>
                      <th className="p-3.5">Tajuk Servis</th>
                      <th className="p-3.5">Sorotan / Highlight</th>
                      <th className="p-3.5">Harga Bermula</th>
                      <th className="p-3.5 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {services.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-[#0052FF]">{item.category}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{item.title}</td>
                        <td className="p-3.5 text-slate-500 max-w-[240px] truncate">{item.highlight}</td>
                        <td className="p-3.5 font-mono font-bold text-[#0052FF]">
                          {item.price_prefix} {item.price_amount} {item.price_unit}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenServiceModal(item)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {services.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm('Padam servis ini?')) {
                                    deleteService(item.id);
                                    triggerToast('Servis berjaya dipadam.');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: KAD SLOGAN & CTA
           ========================================================================= */}
        {activeTab === 'slogan' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Tetapan Kad Slogan & Ajakan WhatsApp</h2>
                <p className="text-xs text-slate-500">Ubah teks slogan rasmi, keterangan, dan mesej templat WhatsApp</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Baris Utama Slogan</label>
                    <input
                      type="text"
                      value={sloganQuote.headline}
                      onChange={(e) => updateSloganQuote({ headline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Teks Sorotan (Highlight)</label>
                    <input
                      type="text"
                      value={sloganQuote.highlight_text}
                      onChange={(e) => updateSloganQuote({ highlight_text: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Ayat Soalan</label>
                  <input
                    type="text"
                    value={sloganQuote.question_text}
                    onChange={(e) => updateSloganQuote({ question_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Keterangan Ajakan</label>
                  <textarea
                    rows={3}
                    value={sloganQuote.description_text}
                    onChange={(e) => updateSloganQuote({ description_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Label Butang WhatsApp</label>
                    <input
                      type="text"
                      value={sloganQuote.button_text}
                      onChange={(e) => updateSloganQuote({ button_text: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Mesej Templat WhatsApp</label>
                    <input
                      type="text"
                      value={sloganQuote.whatsapp_message}
                      onChange={(e) => updateSloganQuote({ whatsapp_message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => triggerToast('Slogan & ajakan WhatsApp berjaya disimpan!')}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Slogan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-[#0052FF] via-[#0044D6] to-[#0A1847] text-white shadow-md space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">Pratonton Langsung di Web</span>
              <h3 className="text-lg font-extrabold leading-snug">
                {sloganQuote.headline} <br />
                <span className="text-blue-200 underline underline-offset-4">{sloganQuote.highlight_text}</span>
              </h3>
              <p className="text-xs font-bold text-white/95">{sloganQuote.question_text}</p>
              <p className="text-xs text-blue-100/90">{sloganQuote.description_text}</p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#0052FF] text-xs font-bold shadow-xs">
                  {sloganQuote.button_text}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: VIDEO PROSES PRODUKSI
           ========================================================================= */}
        {activeTab === 'videos' && (
          <div className="space-y-4 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Video Proses Produksi (YouTube Reel)</h2>
                <p className="text-xs text-slate-500">Tukar ID YouTube, gambar thumbnail dan label kategori rakaman kilang</p>
              </div>
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-white text-[#0052FF] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Grid"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-[#0052FF] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Senarai / Jadual"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenVideoModal()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Video Baru</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {productionVideos.map((video) => (
                  <div key={video.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="relative aspect-[9/14] bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-3.5">
                        <span className="self-start bg-[#0052FF] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                          {video.category}
                        </span>
                        <div>
                          <h3 className="font-bold text-white text-sm drop-shadow">{video.title}</h3>
                          <p className="text-[11px] text-slate-200 font-mono mt-0.5">ID: {video.youtube_id}</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-500">YouTube Embed</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenVideoModal(video)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        {productionVideos.length > 1 && (
                          <button
                            onClick={() => {
                              if (confirm('Padam video ini?')) {
                                deleteProductionVideo(video.id);
                                triggerToast('Video berjaya dipadam.');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View Table */
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Thumbnail & Kategori</th>
                      <th className="p-3.5">Tajuk Video</th>
                      <th className="p-3.5">YouTube ID</th>
                      <th className="p-3.5">Pautan Semakan</th>
                      <th className="p-3.5 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {productionVideos.map((video) => (
                      <tr key={video.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-[#0052FF]">{video.category}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{video.title}</td>
                        <td className="p-3.5 font-mono text-slate-700">{video.youtube_id}</td>
                        <td className="p-3.5">
                          <a
                            href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0052FF] hover:underline flex items-center space-x-1"
                          >
                            <span>Buka YouTube</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenVideoModal(video)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {productionVideos.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm('Padam video ini?')) {
                                    deleteProductionVideo(video.id);
                                    triggerToast('Video berjaya dipadam.');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 5: HASIL PRODUKSI KILANG
           ========================================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-4 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Galeri Hasil Produksi Kilang</h2>
                <p className="text-xs text-slate-500">Tambah foto jersi siap, perincian fabrik, nama klien dan kuantiti</p>
              </div>
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-white text-[#0052FF] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Grid"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-[#0052FF] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Senarai / Jadual"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenGalleryModal()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Hasil Produksi</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {productionGallery.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
                    <div className="relative h-44 bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-white/95 text-[#0052FF] text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                        {item.tag}
                      </div>
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{item.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{item.fabric}</p>
                        <p className="text-[11.5px] text-[#0052FF] font-medium mt-1">{item.client}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{item.category}</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenGalleryModal(item)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          {productionGallery.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm('Padam item galeri ini?')) {
                                  deleteGalleryItem(item.id);
                                  triggerToast('Item galeri berjaya dipadam.');
                                }
                              }}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View Table */
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Foto & Tag</th>
                      <th className="p-3.5">Tajuk Tempahan</th>
                      <th className="p-3.5">Spesifikasi Fabrik</th>
                      <th className="p-3.5">Klien & Kuantiti</th>
                      <th className="p-3.5 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {productionGallery.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-3">
                            <div className="w-14 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-bold text-[#0052FF]">{item.tag}</span>
                          </div>
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">{item.title}</td>
                        <td className="p-3.5 text-slate-600">{item.fabric}</td>
                        <td className="p-3.5 font-semibold text-slate-800">{item.client}</td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenGalleryModal(item)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {productionGallery.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm('Padam item galeri ini?')) {
                                    deleteGalleryItem(item.id);
                                    triggerToast('Item galeri berjaya dipadam.');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 6: TESTIMONI PELANGGAN
           ========================================================================= */}
        {activeTab === 'testimonials' && (
          <div className="space-y-4 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Ulasan & Testimoni Pelanggan</h2>
                <p className="text-xs text-slate-500">Uruskan ulasan di bahagian Apa Kata Mereka di Halaman Utama</p>
              </div>
              <div className="flex items-center space-x-2 self-end sm:self-auto">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'grid' ? 'bg-white text-[#0052FF] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Grid"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-[#0052FF] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Senarai / Jadual"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenTestiModal()}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Testimoni</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {testimonials.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col justify-between space-y-3 shadow-xs">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full ${t.avatar_bg} ${t.avatar_text} font-bold text-xs flex items-center justify-center`}>
                            {t.initial}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">{t.name}</h4>
                            <p className="text-[11px] text-slate-500">{t.location}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {t.platform}
                        </span>
                      </div>

                      <div className="flex text-amber-400">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>

                      <p className="text-xs text-slate-600 italic line-clamp-4">&quot;{t.review.replace(/"/g, '')}&quot;</p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenTestiModal(t)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {testimonials.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm('Padam ulasan ini?')) {
                              deleteTestimonial(t.id);
                              triggerToast('Testimoni berjaya dipadam.');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View Table */
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Pelanggan & Lokasi</th>
                      <th className="p-3.5">Platform</th>
                      <th className="p-3.5">Penilaian</th>
                      <th className="p-3.5">Isi Ulasan</th>
                      <th className="p-3.5 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {testimonials.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-8 h-8 rounded-full ${t.avatar_bg} ${t.avatar_text} font-bold text-xs flex items-center justify-center`}>
                              {t.initial}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{t.name}</h4>
                              <p className="text-[11px] text-slate-500">{t.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 uppercase font-bold text-[10px] text-slate-600">{t.platform}</td>
                        <td className="p-3.5">
                          <div className="flex text-amber-400">
                            {Array.from({ length: t.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600 max-w-[320px] truncate">&quot;{t.review}&quot;</td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenTestiModal(t)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {testimonials.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm('Padam ulasan ini?')) {
                                    deleteTestimonial(t.id);
                                    triggerToast('Testimoni berjaya dipadam.');
                                  }
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 7: IDENTITI SYARIKAT & FOOTER
           ========================================================================= */}
        {activeTab === 'company' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Identiti Syarikat & Maklumat Rasmi</h2>
                <p className="text-xs text-slate-500">Maklumat ini akan dipaparkan di Footer, pautan WhatsApp, dan maklumat hak cipta</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nama Syarikat Berdaftar</label>
                    <input
                      type="text"
                      value={companySettings.company_name}
                      onChange={(e) => updateCompanySettings({ company_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nama Jenama (Brand)</label>
                    <input
                      type="text"
                      value={companySettings.brand_name}
                      onChange={(e) => updateCompanySettings({ brand_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nombor Pendaftaran Syarikat (SSM)</label>
                    <input
                      type="text"
                      value={companySettings.registration_number}
                      onChange={(e) => updateCompanySettings({ registration_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Nombor WhatsApp Rasmi</label>
                    <input
                      type="text"
                      value={companySettings.whatsapp_number}
                      onChange={(e) => updateCompanySettings({ whatsapp_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Email Khidmat Pelanggan</label>
                    <input
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => updateCompanySettings({ email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">No Telefon Pejabat</label>
                    <input
                      type="text"
                      value={companySettings.phone}
                      onChange={(e) => updateCompanySettings({ phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Alamat Kilang / Pejabat</label>
                  <input
                    type="text"
                    value={companySettings.address}
                    onChange={(e) => updateCompanySettings({ address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tagline Syarikat (Footer)</label>
                  <textarea
                    rows={2}
                    value={companySettings.tagline}
                    onChange={(e) => updateCompanySettings({ tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white focus:border-[#0052FF] outline-none"
                  />
                </div>

                {/* Social Media Links */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">Pautan Media Sosial & Saluran Rasmi</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Telegram Katalog</label>
                      <input
                        type="text"
                        value={companySettings.telegram_catalog_url}
                        onChange={(e) => updateCompanySettings({ telegram_catalog_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Facebook URL</label>
                      <input
                        type="text"
                        value={companySettings.facebook_url}
                        onChange={(e) => updateCompanySettings({ facebook_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Instagram URL</label>
                      <input
                        type="text"
                        value={companySettings.instagram_url}
                        onChange={(e) => updateCompanySettings({ instagram_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">TikTok URL</label>
                      <input
                        type="text"
                        value={companySettings.tiktok_url}
                        onChange={(e) => updateCompanySettings({ tiktok_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Developer Credit Setting */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Kredit Pembangun Laman Web (Developer Credit)</h4>
                    <p className="text-[11px] text-slate-400">Papar pengiktirafan pembangun sistem di bahagian paling bawah footer</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Nama Pembangun Web</label>
                      <input
                        type="text"
                        value={companySettings.developer_name || 'AYEZZ Studio'}
                        onChange={(e) => updateCompanySettings({ developer_name: e.target.value })}
                        placeholder="cth: AYEZZ Studio"
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-semibold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Pautan URL Pembangun (Portfolio/Web)</label>
                      <input
                        type="text"
                        value={companySettings.developer_url || 'https://ayezz.com'}
                        onChange={(e) => updateCompanySettings({ developer_url: e.target.value })}
                        placeholder="https://..."
                        className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono text-[11px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={() => triggerToast('Identiti syarikat berjaya dikemaskini!')}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Maklumat Syarikat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 8: DASAR & POLISI KILANG
           ========================================================================= */}
        {activeTab === 'policies' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Dasar & Polisi Kilang</h2>
                <p className="text-xs text-slate-500">Ubah isi kandungan terma, privasi, jaminan pemulangan dan dasar penghantaran</p>
              </div>

              {(['privacy', 'terms', 'warranty', 'shipping'] as const).map((key) => {
                const pol = policies[key];
                return (
                  <div key={key} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-slate-900">{pol.title}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0052FF] border border-blue-200">
                        {pol.badge}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-500">Penerangan Ringkas</label>
                      <input
                        type="text"
                        value={pol.description}
                        onChange={(e) => updatePolicy(key, { description: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="text-[11px] font-bold text-slate-700">Seksyen Fasal</label>
                      {pol.sections?.map((sec, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-white border border-slate-200 space-y-2">
                          <input
                            type="text"
                            value={sec.heading}
                            onChange={(e) => {
                              const nextSecs = [...pol.sections];
                              nextSecs[idx] = { ...nextSecs[idx], heading: e.target.value };
                              updatePolicy(key, { sections: nextSecs });
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                          />
                          <textarea
                            rows={2}
                            value={sec.text}
                            onChange={(e) => {
                              const nextSecs = [...pol.sections];
                              nextSecs[idx] = { ...nextSecs[idx], text: e.target.value };
                              updatePolicy(key, { sections: nextSecs });
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => triggerToast('Dasar & polisi berjaya dikemaskini!')}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#0052FF] hover:bg-blue-600 text-white text-xs font-bold shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Semua Polisi</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* =========================================================================
          HERO BANNER MODAL (WITH IMAGE UPLOAD FIELD)
         ========================================================================= */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                {editingBanner ? 'Kemaskini Slide Banner' : 'Tambah Slide Banner Baharu'}
              </h3>
              <button onClick={() => setIsBannerModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveBanner} className="p-5 space-y-4 overflow-y-auto flex-1">
              <ImageUploadField
                label="Gambar Slide Banner"
                value={bannerForm.image_url}
                onChange={(val) => setBannerForm({ ...bannerForm, image_url: val })}
                aspectRatio="banner"
                helperText="Muat naik fail dari peranti atau masukkan pautan URL gambar terus."
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tajuk Utama Banner</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tag / Kategori</label>
                  <input
                    type="text"
                    value={bannerForm.tag_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, tag_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Pill Status</label>
                  <input
                    type="text"
                    value={bannerForm.status_pill}
                    onChange={(e) => setBannerForm({ ...bannerForm, status_pill: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Teks Butang</label>
                  <input
                    type="text"
                    value={bannerForm.button_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Pautan Butang</label>
                  <input
                    type="text"
                    value={bannerForm.button_link}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_link: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
              </div>
              <div className="pt-2 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0052FF] text-white text-xs font-bold hover:bg-blue-600"
                >
                  Simpan Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          SERVICE MODAL (WITH IMAGE UPLOAD FIELD)
         ========================================================================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                {editingService ? 'Kemaskini Servis' : 'Tambah Servis Baharu'}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveService} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              <ImageUploadField
                label="Gambar Produk Servis"
                value={serviceForm.image_url}
                onChange={(val) => setServiceForm({ ...serviceForm, image_url: val })}
                aspectRatio="video"
                helperText="Pilih gambar berkualiti tinggi bagi produk servis ini."
                required
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kategori Servis</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tajuk Servis</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Headline Ringkas</label>
                <input
                  type="text"
                  value={serviceForm.headline}
                  onChange={(e) => setServiceForm({ ...serviceForm, headline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Keterangan / Highlight</label>
                <textarea
                  rows={2}
                  value={serviceForm.highlight}
                  onChange={(e) => setServiceForm({ ...serviceForm, highlight: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Prefix Harga</label>
                  <input
                    type="text"
                    value={serviceForm.price_prefix}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_prefix: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Harga (cth: RM28)</label>
                  <input
                    type="text"
                    value={serviceForm.price_amount}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Unit (cth: / helai)</label>
                  <input
                    type="text"
                    value={serviceForm.price_unit}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0052FF] text-white text-xs font-bold"
                >
                  Simpan Servis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIDEO MODAL (WITH IMAGE UPLOAD FIELD)
         ========================================================================= */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                {editingVideo ? 'Kemaskini Video Produksi' : 'Tambah Video Produksi'}
              </h3>
              <button onClick={() => setIsVideoModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveVideo} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              <ImageUploadField
                label="Gambar Thumbnail Video"
                value={videoForm.thumbnail_url}
                onChange={(val) => setVideoForm({ ...videoForm, thumbnail_url: val })}
                aspectRatio="video"
                helperText="Muat naik poster/thumbnail video atau guna pautan gambar."
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tajuk Video</label>
                <input
                  type="text"
                  required
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Kategori Video</label>
                <input
                  type="text"
                  value={videoForm.category}
                  onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">YouTube Video ID (cth: q6U_y9-pX_4)</label>
                <input
                  type="text"
                  required
                  value={videoForm.youtube_id}
                  onChange={(e) => setVideoForm({ ...videoForm, youtube_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white font-mono"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0052FF] text-white text-xs font-bold"
                >
                  Simpan Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          GALLERY MODAL (WITH IMAGE UPLOAD FIELD)
         ========================================================================= */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                {editingGallery ? 'Kemaskini Hasil Produksi' : 'Tambah Hasil Produksi'}
              </h3>
              <button onClick={() => setIsGalleryModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveGallery} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              <ImageUploadField
                label="Foto Hasil Tempahan Siap"
                value={galleryForm.image_url}
                onChange={(val) => setGalleryForm({ ...galleryForm, image_url: val })}
                aspectRatio="video"
                helperText="Muat naik foto produk sebenar yang telah siap dijahit/dicetak."
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tajuk Tempahan</label>
                <input
                  type="text"
                  required
                  value={galleryForm.title}
                  onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Info Fabrik & Kolar</label>
                  <input
                    type="text"
                    value={galleryForm.fabric}
                    onChange={(e) => setGalleryForm({ ...galleryForm, fabric: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kuantiti & Nama Klien</label>
                  <input
                    type="text"
                    value={galleryForm.client}
                    onChange={(e) => setGalleryForm({ ...galleryForm, client: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Tag Label</label>
                  <input
                    type="text"
                    value={galleryForm.tag}
                    onChange={(e) => setGalleryForm({ ...galleryForm, tag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Kategori</label>
                  <input
                    type="text"
                    value={galleryForm.category}
                    onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0052FF] text-white text-xs font-bold"
                >
                  Simpan Galeri
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          TESTIMONIAL MODAL
         ========================================================================= */}
      {isTestiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-sm text-slate-900">
                {editingTesti ? 'Kemaskini Testimoni' : 'Tambah Testimoni'}
              </h3>
              <button onClick={() => setIsTestiModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleSaveTesti} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Nama Pelanggan</label>
                  <input
                    type="text"
                    required
                    value={testiForm.name}
                    onChange={(e) => setTestiForm({ ...testiForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Lokasi (cth: Shah Alam)</label>
                  <input
                    type="text"
                    value={testiForm.location}
                    onChange={(e) => setTestiForm({ ...testiForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Platform Sumber</label>
                  <select
                    value={testiForm.platform}
                    onChange={(e) => setTestiForm({ ...testiForm, platform: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  >
                    <option value="google">Google Review</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Penilaian (Bintang 1-5)</label>
                  <select
                    value={testiForm.rating}
                    onChange={(e) => setTestiForm({ ...testiForm, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                  >
                    <option value={5}>5 Bintang (Cemerlang)</option>
                    <option value={4}>4 Bintang (Bagus)</option>
                    <option value={3}>3 Bintang</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Ayat Ulasan Pelanggan</label>
                <textarea
                  rows={4}
                  required
                  value={testiForm.review}
                  onChange={(e) => setTestiForm({ ...testiForm, review: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:bg-white"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestiModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0052FF] text-white text-xs font-bold"
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
