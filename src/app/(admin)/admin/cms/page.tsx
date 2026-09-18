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
  List,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles
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

  // Accordion states for Google One style collapsible panels
  const [companyAccordion, setCompanyAccordion] = useState<Record<string, boolean>>({
    basic: true,
    contact: true,
    social: false,
    developer: true,
  });

  const [policyAccordion, setPolicyAccordion] = useState<Record<string, boolean>>({
    privacy: true,
    terms: false,
    warranty: false,
    shipping: false,
  });

  const toggleCompanyAcc = (key: string) => {
    setCompanyAccordion(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePolicyAcc = (key: string) => {
    setPolicyAccordion(prev => ({ ...prev, [key]: !prev[key] }));
  };

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

      {/* ----------------- 2-PANEL LAYOUT ----------------- */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* LEFT PANEL: Vertical Section Navigation */}
        <aside className="w-full md:w-56 shrink-0 bg-white p-2 rounded-2xl border border-slate-200 shadow-xs space-y-1 md:sticky md:top-20">
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
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#C2E7FF] text-[#001D35] font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#001D35]' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/70 text-[#001D35] font-semibold' : 'text-slate-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* RIGHT PANEL: Active Section Content */}
        <main className="flex-1 min-w-0 space-y-6">

        {/* =========================================================================
            TAB 0: TEMA & WARNA (GOOGLE ONE CLEAN SETTINGS STYLE)
           ========================================================================= */}
        {activeTab === 'theme' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-normal text-slate-800">Tema & Penjenamaan Laman</h2>
                <p className="text-xs text-slate-500 mt-0.5">Pilih tema warna rasmi untuk bar atas, butang dan navigasi laman awam</p>
              </div>

              {/* Status Box (Google One style) */}
              <div className="bg-[#F0F4F9] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block">Tema Semasa</span>
                  <span className="text-base font-medium text-slate-800">
                    {themeSettings?.preset === 'clean_white'
                      ? 'Clean Minimal White'
                      : themeSettings?.preset === 'full_blue'
                      ? 'Full Royal Blue'
                      : 'Royal Blue Hybrid (Lalai)'}
                  </span>
                </div>
                <span className="text-xs font-medium text-[#0B57D0] bg-white px-4 py-1.5 rounded-full border border-slate-200 shadow-xs self-start sm:self-auto">
                  Sedang Aktif di Web Awam
                </span>
              </div>

              {/* Clean Theme Option Cards (Google One Benefits style, NO messy preview widgets) */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-medium text-slate-700 block">Pilihan Tema Pratetap:</span>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'hybrid', title: 'Royal Blue Hybrid', desc: 'Bar atas biru diraja, kandungan latar putih cerah & navigasi bawah bersih.' },
                    { key: 'clean_white', title: 'Clean Minimal White', desc: 'Tema putih minimalis moden, kemas dan elegan untuk katalog.' },
                    { key: 'full_blue', title: 'Full Royal Blue', desc: 'Warna biru penuh pada bar atas dan navigasi bawah untuk jenama tegap.' },
                  ].map((item) => {
                    const isSelected = (themeSettings?.preset || 'hybrid') === item.key;
                    return (
                      <div
                        key={item.key}
                        onClick={() => {
                          applyThemePreset(item.key as any);
                          triggerToast(`Tema "${item.title}" telah diaktifkan`);
                        }}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                          isSelected
                            ? 'border-[#0B57D0] bg-blue-50/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm text-slate-800">{item.title}</span>
                            {isSelected && <Check className="w-4 h-4 text-[#0B57D0]" />}
                          </div>
                          <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                        </div>

                        <button
                          type="button"
                          className={`w-full py-2 rounded-full text-xs font-medium transition-all ${
                            isSelected
                              ? 'bg-[#0B57D0] text-white shadow-xs'
                              : 'border border-slate-300 text-[#0B57D0] hover:bg-blue-50/40'
                          }`}
                        >
                          {isSelected ? 'Sedang Digunakan' : 'Gunakan Tema'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 1: HERO BANNERS (GOOGLE ONE BENEFIT CARD STYLE)
           ========================================================================= */}
        {activeTab === 'hero' && (
          <div className="space-y-5 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div>
                <h2 className="text-base font-normal text-slate-800">Slide Banner Utama</h2>
                <p className="text-xs text-slate-500 mt-0.5">Uruskan gambar banner di bahagian atas halaman utama</p>
              </div>
              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <span className="text-xs text-slate-500 hidden sm:inline-block">{heroBanners.length} tersedia</span>
                
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-[#0B57D0] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white text-[#0B57D0] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Senarai"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenBannerModal()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Banner</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {heroBanners.map((banner, index) => (
                  <div key={banner.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                    {/* Top Image Preview */}
                    <div className="relative h-40 bg-slate-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-medium text-slate-800 shadow-xs">
                        Slide #{index + 1}
                      </div>
                    </div>

                    {/* Google One Card Body */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          {banner.tag_text || 'BANNER UTAMA'}
                        </span>
                        <h3 className="text-base font-normal text-slate-800 line-clamp-1">{banner.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          Pill: <span className="text-slate-700">{banner.status_pill}</span> &bull; Pautan: <span className="font-mono text-[#0B57D0]">{banner.button_link}</span>
                        </p>
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${banner.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {banner.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </span>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenBannerModal(banner)}
                            className="px-3.5 py-1.5 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium transition-all"
                          >
                            Ubah
                          </button>
                          {heroBanners.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm('Padam slide banner ini?')) {
                                  deleteHeroBanner(banner.id);
                                  triggerToast('Banner berjaya dipadam.');
                                }
                              }}
                              className="px-3 py-1.5 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-medium transition-all"
                            >
                              Padam
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
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-medium tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Susunan & Imej</th>
                      <th className="py-3 px-4">Tajuk Banner</th>
                      <th className="py-3 px-4">Tag / Status Pill</th>
                      <th className="py-3 px-4">Pautan Butang</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {heroBanners.map((banner, idx) => (
                      <tr key={banner.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-slate-400 font-mono text-xs">#{idx + 1}</span>
                            <div className="w-14 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{banner.title}</td>
                        <td className="py-3 px-4">
                          <span className="text-slate-700 block">{banner.tag_text}</span>
                          <span className="text-[11px] text-slate-400">{banner.status_pill}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#0B57D0]">{banner.button_text} ({banner.button_link})</td>
                        <td className="py-3 px-4">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${banner.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {banner.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenBannerModal(banner)}
                              className="px-3 py-1 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium transition-all"
                            >
                              Ubah
                            </button>
                            {heroBanners.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm('Padam slide banner ini?')) {
                                    deleteHeroBanner(banner.id);
                                    triggerToast('Banner berjaya dipadam.');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-medium"
                              >
                                Padam
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
            TAB 2: PILIHAN SERVIS (GOOGLE ONE BENEFIT CARD STYLE)
           ========================================================================= */}
        {activeTab === 'services' && (
          <div className="space-y-5 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div>
                <h2 className="text-base font-normal text-slate-800">Kad Pilihan Servis</h2>
                <p className="text-xs text-slate-500 mt-0.5">Ubah tajuk servis, gambar, harga bermula dan butiran penerangan</p>
              </div>
              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <span className="text-xs text-slate-500 hidden sm:inline-block">{services.length} tersedia</span>
                
                <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-[#0B57D0] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white text-[#0B57D0] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Senarai"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenServiceModal()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Servis</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {services.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="relative h-36 bg-slate-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs">
                        {item.category}
                      </div>
                    </div>

                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          {item.category}
                        </span>
                        <h3 className="text-base font-normal text-slate-800 line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.highlight}</p>
                        <div className="pt-1 text-xs font-mono font-medium text-[#0B57D0]">
                          {item.price_prefix} {item.price_amount} {item.price_unit}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">{item.details?.length || 0} butiran</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenServiceModal(item)}
                            className="px-3.5 py-1.5 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium transition-all"
                          >
                            Ubah
                          </button>
                          {services.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm('Padam servis ini?')) {
                                  deleteService(item.id);
                                  triggerToast('Servis berjaya dipadam.');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-medium"
                            >
                              Padam
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
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-medium tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Imej & Kategori</th>
                      <th className="py-3 px-4">Tajuk Servis</th>
                      <th className="py-3 px-4">Sorotan / Highlight</th>
                      <th className="py-3 px-4">Harga Bermula</th>
                      <th className="py-3 px-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {services.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium text-slate-800">{item.category}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{item.title}</td>
                        <td className="py-3 px-4 text-slate-500 max-w-[240px] truncate">{item.highlight}</td>
                        <td className="py-3 px-4 font-mono font-medium text-[#0B57D0]">
                          {item.price_prefix} {item.price_amount} {item.price_unit}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenServiceModal(item)}
                              className="px-3 py-1 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium"
                            >
                              Ubah
                            </button>
                            {services.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm('Padam servis ini?')) {
                                    deleteService(item.id);
                                    triggerToast('Servis berjaya dipadam.');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-medium"
                              >
                                Padam
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
            TAB 3: KAD SLOGAN & CTA (GOOGLE ONE SETTINGS STYLE)
           ========================================================================= */}
        {activeTab === 'slogan' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-normal text-slate-800">Slogan & Ajakan WhatsApp</h2>
                <p className="text-xs text-slate-500 mt-0.5">Ubah teks slogan rasmi, keterangan, dan mesej templat WhatsApp</p>
              </div>

              {/* Status Box */}
              <div className="bg-[#F0F4F9] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">Headline Semasa</span>
                  <span className="text-sm font-medium text-slate-800">{sloganQuote.headline} {sloganQuote.highlight_text}</span>
                </div>
                <span className="text-xs text-[#0B57D0] font-medium bg-white px-3 py-1 rounded-full border border-slate-200">
                  Aktif di Laman Web
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Baris Utama Slogan</label>
                    <input
                      type="text"
                      value={sloganQuote.headline}
                      onChange={(e) => updateSloganQuote({ headline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Teks Sorotan (Highlight)</label>
                    <input
                      type="text"
                      value={sloganQuote.highlight_text}
                      onChange={(e) => updateSloganQuote({ highlight_text: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Ayat Soalan</label>
                  <input
                    type="text"
                    value={sloganQuote.question_text}
                    onChange={(e) => updateSloganQuote({ question_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Keterangan Ajakan</label>
                  <textarea
                    rows={3}
                    value={sloganQuote.description_text}
                    onChange={(e) => updateSloganQuote({ description_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Label Butang WhatsApp</label>
                    <input
                      type="text"
                      value={sloganQuote.button_text}
                      onChange={(e) => updateSloganQuote({ button_text: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-700">Mesej Templat WhatsApp</label>
                    <input
                      type="text"
                      value={sloganQuote.whatsapp_message}
                      onChange={(e) => updateSloganQuote({ whatsapp_message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => triggerToast('Slogan & ajakan WhatsApp berjaya disimpan!')}
                    className="flex items-center space-x-1.5 px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Perubahan Slogan</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: VIDEO PROSES PRODUKSI (GOOGLE ONE BENEFIT CARD STYLE)
           ========================================================================= */}
        {activeTab === 'videos' && (
          <div className="space-y-5 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div>
                <h2 className="text-base font-normal text-slate-800">Video Proses Produksi</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tukar ID YouTube, gambar thumbnail dan label kategori rakaman kilang</p>
              </div>
              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <span className="text-xs text-slate-500 hidden sm:inline-block">{productionVideos.length} tersedia</span>
                
                <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-[#0B57D0] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white text-[#0B57D0] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Senarai"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenVideoModal()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Video</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {productionVideos.map((video) => (
                  <div key={video.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="relative aspect-[9/14] bg-slate-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs">
                        {video.category}
                      </div>
                    </div>

                    <div className="p-4 space-y-3 bg-white flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          {video.category}
                        </span>
                        <h3 className="text-sm font-normal text-slate-800 line-clamp-1">{video.title}</h3>
                        <p className="text-[11px] text-slate-400 font-mono">YouTube: {video.youtube_id}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <a
                          href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#0B57D0] hover:underline flex items-center space-x-1"
                        >
                          <span>Tonton</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenVideoModal(video)}
                            className="px-3 py-1 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium"
                          >
                            Ubah
                          </button>
                          {productionVideos.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm('Padam video ini?')) {
                                  deleteProductionVideo(video.id);
                                  triggerToast('Video berjaya dipadam.');
                                }
                              }}
                              className="px-2 py-1 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-medium"
                            >
                              Padam
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
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-medium tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Thumbnail & Kategori</th>
                      <th className="py-3 px-4">Tajuk Video</th>
                      <th className="py-3 px-4">YouTube ID</th>
                      <th className="py-3 px-4">Pautan Semakan</th>
                      <th className="py-3 px-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {productionVideos.map((video) => (
                      <tr key={video.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium text-slate-800">{video.category}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{video.title}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{video.youtube_id}</td>
                        <td className="py-3 px-4">
                          <a
                            href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0B57D0] hover:underline flex items-center space-x-1"
                          >
                            <span>Buka YouTube</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenVideoModal(video)}
                              className="px-3 py-1 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium"
                            >
                              Ubah
                            </button>
                            {productionVideos.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm('Padam video ini?')) {
                                    deleteProductionVideo(video.id);
                                    triggerToast('Video berjaya dipadam.');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-medium"
                              >
                                Padam
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
            TAB 5: HASIL PRODUKSI KILANG (GOOGLE ONE BENEFIT CARD STYLE)
           ========================================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-5 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div>
                <h2 className="text-base font-normal text-slate-800">Galeri Hasil Produksi</h2>
                <p className="text-xs text-slate-500 mt-0.5">Tambah foto jersi siap, perincian fabrik, nama klien dan kuantiti</p>
              </div>
              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <span className="text-xs text-slate-500 hidden sm:inline-block">{productionGallery.length} tersedia</span>
                
                <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-[#0B57D0] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white text-[#0B57D0] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Senarai"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenGalleryModal()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Hasil Produksi</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {productionGallery.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
                    <div className="relative h-40 bg-slate-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-slate-800 text-[10px] font-medium px-2.5 py-0.5 rounded-full shadow-xs">
                        {item.tag}
                      </div>
                    </div>

                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                          {item.tag}
                        </span>
                        <h3 className="text-base font-normal text-slate-800 line-clamp-1">{item.title}</h3>
                        <p className="text-xs text-slate-500">{item.fabric}</p>
                        <p className="text-xs text-[#0B57D0] font-medium">{item.client}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-400">{item.category}</span>
                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleOpenGalleryModal(item)}
                            className="px-3.5 py-1.5 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium transition-all"
                          >
                            Ubah
                          </button>
                          {productionGallery.length > 1 && (
                            <button
                              onClick={() => {
                                if (confirm('Padam item galeri ini?')) {
                                  deleteGalleryItem(item.id);
                                  triggerToast('Item galeri berjaya dipadam.');
                                }
                              }}
                              className="px-2.5 py-1.5 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-medium"
                            >
                              Padam
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
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-medium tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Foto & Tag</th>
                      <th className="py-3 px-4">Tajuk Tempahan</th>
                      <th className="py-3 px-4">Spesifikasi Fabrik</th>
                      <th className="py-3 px-4">Klien & Kuantiti</th>
                      <th className="py-3 px-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {productionGallery.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            </div>
                            <span className="font-medium text-slate-800">{item.tag}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">{item.title}</td>
                        <td className="py-3 px-4 text-slate-600">{item.fabric}</td>
                        <td className="py-3 px-4 text-slate-800">{item.client}</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenGalleryModal(item)}
                              className="px-3 py-1 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium"
                            >
                              Ubah
                            </button>
                            {productionGallery.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm('Padam item galeri ini?')) {
                                    deleteGalleryItem(item.id);
                                    triggerToast('Item galeri berjaya dipadam.');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-medium"
                              >
                                Padam
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
            TAB 6: TESTIMONI PELANGGAN (GOOGLE ONE BENEFIT CARD STYLE)
           ========================================================================= */}
        {activeTab === 'testimonials' && (
          <div className="space-y-5 max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-xs gap-3">
              <div>
                <h2 className="text-base font-normal text-slate-800">Ulasan & Testimoni</h2>
                <p className="text-xs text-slate-500 mt-0.5">Uruskan ulasan di bahagian Apa Kata Mereka di Halaman Utama</p>
              </div>
              <div className="flex items-center space-x-3 self-end sm:self-auto">
                <span className="text-xs text-slate-500 hidden sm:inline-block">{testimonials.length} tersedia</span>
                
                <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-[#0B57D0] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded-full text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white text-[#0B57D0] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
                    title="Paparan Senarai"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleOpenTestiModal()}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Testimoni</span>
                </button>
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {testimonials.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md transition-shadow">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-2.5">
                          <div className={`w-8 h-8 rounded-full ${t.avatar_bg} ${t.avatar_text} font-medium text-xs flex items-center justify-center`}>
                            {t.initial}
                          </div>
                          <div>
                            <h4 className="font-medium text-xs text-slate-800">{t.name}</h4>
                            <p className="text-[11px] text-slate-500">{t.location}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {t.platform}
                        </span>
                      </div>

                      <div className="flex text-amber-400">
                        {Array.from({ length: t.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">&quot;{t.review.replace(/"/g, '')}&quot;</p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end space-x-1.5">
                      <button
                        onClick={() => handleOpenTestiModal(t)}
                        className="px-3 py-1 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium"
                      >
                        Ubah
                      </button>
                      {testimonials.length > 1 && (
                        <button
                          onClick={() => {
                            if (confirm('Padam ulasan ini?')) {
                              deleteTestimonial(t.id);
                              triggerToast('Testimoni berjaya dipadam.');
                            }
                          }}
                          className="px-2 py-1 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-medium"
                        >
                          Padam
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
                  <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-medium tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Pelanggan & Lokasi</th>
                      <th className="py-3 px-4">Platform</th>
                      <th className="py-3 px-4">Penilaian</th>
                      <th className="py-3 px-4">Isi Ulasan</th>
                      <th className="py-3 px-4 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-normal">
                    {testimonials.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2.5">
                            <div className={`w-7 h-7 rounded-full ${t.avatar_bg} ${t.avatar_text} font-medium text-xs flex items-center justify-center`}>
                              {t.initial}
                            </div>
                            <div>
                              <h4 className="font-medium text-slate-800">{t.name}</h4>
                              <p className="text-[11px] text-slate-500">{t.location}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 uppercase font-medium text-[11px] text-slate-600">{t.platform}</td>
                        <td className="py-3 px-4">
                          <div className="flex text-amber-400">
                            {Array.from({ length: t.rating }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-amber-400" />
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[320px] truncate">&quot;{t.review}&quot;</td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => handleOpenTestiModal(t)}
                              className="px-3 py-1 rounded-full border border-slate-300 hover:border-slate-400 text-[#0B57D0] hover:bg-blue-50/40 text-xs font-medium"
                            >
                              Ubah
                            </button>
                            {testimonials.length > 1 && (
                              <button
                                onClick={() => {
                                  if (confirm('Padam ulasan ini?')) {
                                    deleteTestimonial(t.id);
                                    triggerToast('Testimoni berjaya dipadam.');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-full text-rose-600 hover:bg-rose-50 text-xs font-medium"
                              >
                                Padam
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
            TAB 7: IDENTITI SYARIKAT (GOOGLE ONE ACCORDION SETTINGS STYLE)
           ========================================================================= */}
        {activeTab === 'company' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-base font-normal text-slate-800">Identiti Syarikat & Maklumat Rasmi</h2>
              <p className="text-xs text-slate-500 mt-0.5">Maklumat ini dipaparkan di Footer laman web, WhatsApp, dan pendaftaran SSM</p>
            </div>

            {/* Google One Accordion Container */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-200">
              {/* Accordion 1: Basic Info */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleCompanyAcc('basic')}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0B57D0] flex items-center justify-center">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-800">Maklumat Asas Syarikat & Jenama</h3>
                      <p className="text-xs text-slate-500">Nama berdaftar SSM, jenama rasmi, dan no. pendaftaran</p>
                    </div>
                  </div>
                  {companyAccordion.basic ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {companyAccordion.basic && (
                  <div className="p-6 bg-slate-50/40 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Nama Syarikat Berdaftar</label>
                        <input
                          type="text"
                          value={companySettings.company_name}
                          onChange={(e) => updateCompanySettings({ company_name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Nama Jenama (Brand)</label>
                        <input
                          type="text"
                          value={companySettings.brand_name}
                          onChange={(e) => updateCompanySettings({ brand_name: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Nombor Pendaftaran Syarikat (SSM)</label>
                        <input
                          type="text"
                          value={companySettings.registration_number}
                          onChange={(e) => updateCompanySettings({ registration_number: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Nombor WhatsApp Rasmi</label>
                        <input
                          type="text"
                          value={companySettings.whatsapp_number}
                          onChange={(e) => updateCompanySettings({ whatsapp_number: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 2: Contact & Address */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleCompanyAcc('contact')}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-800">Hubungi & Alamat Kilang</h3>
                      <p className="text-xs text-slate-500">Email perkhidmatan, telefon pejabat, alamat fizikal, dan tagline</p>
                    </div>
                  </div>
                  {companyAccordion.contact ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {companyAccordion.contact && (
                  <div className="p-6 bg-slate-50/40 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Email Khidmat Pelanggan</label>
                        <input
                          type="email"
                          value={companySettings.email}
                          onChange={(e) => updateCompanySettings({ email: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">No Telefon Pejabat</label>
                        <input
                          type="text"
                          value={companySettings.phone}
                          onChange={(e) => updateCompanySettings({ phone: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Alamat Kilang / Pejabat</label>
                      <input
                        type="text"
                        value={companySettings.address}
                        onChange={(e) => updateCompanySettings({ address: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Tagline Syarikat (Footer)</label>
                      <textarea
                        rows={2}
                        value={companySettings.tagline}
                        onChange={(e) => updateCompanySettings({ tagline: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 3: Social Media Links */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleCompanyAcc('social')}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-800">Pautan Media Sosial</h3>
                      <p className="text-xs text-slate-500">Telegram, Facebook, Instagram, dan TikTok</p>
                    </div>
                  </div>
                  {companyAccordion.social ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {companyAccordion.social && (
                  <div className="p-6 bg-slate-50/40 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Telegram Katalog</label>
                        <input
                          type="text"
                          value={companySettings.telegram_catalog_url}
                          onChange={(e) => updateCompanySettings({ telegram_catalog_url: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Facebook URL</label>
                        <input
                          type="text"
                          value={companySettings.facebook_url}
                          onChange={(e) => updateCompanySettings({ facebook_url: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Instagram URL</label>
                        <input
                          type="text"
                          value={companySettings.instagram_url}
                          onChange={(e) => updateCompanySettings({ instagram_url: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">TikTok URL</label>
                        <input
                          type="text"
                          value={companySettings.tiktok_url}
                          onChange={(e) => updateCompanySettings({ tiktok_url: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 4: Developer Credit */}
              <div>
                <button
                  type="button"
                  onClick={() => toggleCompanyAcc('developer')}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3.5">
                    <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-slate-800">Kredit Pembangun Web</h3>
                      <p className="text-xs text-slate-500">Papar pengiktirafan pembangun sistem di footer</p>
                    </div>
                  </div>
                  {companyAccordion.developer ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>

                {companyAccordion.developer && (
                  <div className="p-6 bg-slate-50/40 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Nama Pembangun Web</label>
                        <input
                          type="text"
                          value={companySettings.developer_name || 'AYEZZ Studio'}
                          onChange={(e) => updateCompanySettings({ developer_name: e.target.value })}
                          placeholder="cth: AYEZZ Studio"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-medium"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-700">Pautan URL Pembangun (Portfolio/Web)</label>
                        <input
                          type="text"
                          value={companySettings.developer_url || 'https://ayezz.com'}
                          onChange={(e) => updateCompanySettings({ developer_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => triggerToast('Identiti syarikat berjaya dikemaskini!')}
                className="flex items-center space-x-1.5 px-6 py-2.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Maklumat Syarikat</span>
              </button>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 8: DASAR & POLISI KILANG (GOOGLE ONE ACCORDION STYLE)
           ========================================================================= */}
        {activeTab === 'policies' && (
          <div className="max-w-4xl space-y-6">
            <div>
              <h2 className="text-base font-normal text-slate-800">Dasar & Polisi Kilang</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ubah isi kandungan terma, privasi, jaminan pemulangan dan dasar penghantaran</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs divide-y divide-slate-200">
              {(['privacy', 'terms', 'warranty', 'shipping'] as const).map((key) => {
                const pol = policies[key];
                const isOpen = policyAccordion[key];
                return (
                  <div key={key}>
                    <button
                      type="button"
                      onClick={() => togglePolicyAcc(key)}
                      className="w-full p-5 flex items-center justify-between hover:bg-slate-50/60 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-3.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-[#0B57D0] flex items-center justify-center">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-slate-800">{pol.title}</h3>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-[#0B57D0]">
                              {pol.badge}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{pol.description}</p>
                        </div>
                      </div>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                    </button>

                    {isOpen && (
                      <div className="p-6 bg-slate-50/40 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700">Penerangan Ringkas</label>
                          <input
                            type="text"
                            value={pol.description}
                            onChange={(e) => updatePolicy(key, { description: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-800"
                          />
                        </div>

                        <div className="space-y-3 pt-1">
                          <label className="text-xs font-medium text-slate-700">Seksyen Fasal</label>
                          {pol.sections?.map((sec, idx) => (
                            <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-2">
                              <input
                                type="text"
                                value={sec.heading}
                                onChange={(e) => {
                                  const nextSecs = [...pol.sections];
                                  nextSecs[idx] = { ...nextSecs[idx], heading: e.target.value };
                                  updatePolicy(key, { sections: nextSecs });
                                }}
                                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800"
                              />
                              <textarea
                                rows={2}
                                value={sec.text}
                                onChange={(e) => {
                                  const nextSecs = [...pol.sections];
                                  nextSecs[idx] = { ...nextSecs[idx], text: e.target.value };
                                  updatePolicy(key, { sections: nextSecs });
                                }}
                                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => triggerToast('Dasar & polisi berjaya dikemaskini!')}
                className="flex items-center space-x-1.5 px-6 py-2.5 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Semua Polisi</span>
              </button>
            </div>
          </div>
        )}
        </main>
      </div>

      {/* =========================================================================
          HERO BANNER MODAL (WITH IMAGE UPLOAD FIELD)
         ========================================================================= */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-normal text-slate-800">
                {editingBanner ? 'Kemaskini Slide Banner' : 'Tambah Slide Banner'}
              </h3>
              <button
                onClick={() => setIsBannerModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveBanner} className="space-y-3.5">
              <ImageUploadField
                label="Gambar Slide Banner"
                value={bannerForm.image_url}
                onChange={(val) => setBannerForm({ ...bannerForm, image_url: val })}
                aspectRatio="banner"
                helperText="Muat naik fail dari peranti atau masukkan pautan gambar."
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Tajuk Utama</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Tag / Kategori</label>
                  <input
                    type="text"
                    value={bannerForm.tag_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, tag_text: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Pill Status</label>
                  <input
                    type="text"
                    value={bannerForm.status_pill}
                    onChange={(e) => setBannerForm({ ...bannerForm, status_pill: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Teks Butang</label>
                  <input
                    type="text"
                    value={bannerForm.button_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Pautan Butang</label>
                  <input
                    type="text"
                    value={bannerForm.button_link}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_link: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end items-center space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-normal text-slate-800">
                {editingService ? 'Kemaskini Servis' : 'Tambah Servis Baharu'}
              </h3>
              <button
                onClick={() => setIsServiceModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveService} className="space-y-3.5">
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
                  <label className="text-xs font-medium text-slate-700">Kategori Servis</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Tajuk Servis</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Headline Ringkas</label>
                <input
                  type="text"
                  value={serviceForm.headline}
                  onChange={(e) => setServiceForm({ ...serviceForm, headline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Keterangan</label>
                <textarea
                  rows={2}
                  value={serviceForm.highlight}
                  onChange={(e) => setServiceForm({ ...serviceForm, highlight: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Prefix</label>
                  <input
                    type="text"
                    value={serviceForm.price_prefix}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_prefix: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Harga</label>
                  <input
                    type="text"
                    value={serviceForm.price_amount}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_amount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Unit</label>
                  <input
                    type="text"
                    value={serviceForm.price_unit}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_unit: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end items-center space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-normal text-slate-800">
                {editingVideo ? 'Kemaskini Video' : 'Tambah Video'}
              </h3>
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveVideo} className="space-y-3.5">
              <ImageUploadField
                label="Thumbnail Video"
                value={videoForm.thumbnail_url}
                onChange={(val) => setVideoForm({ ...videoForm, thumbnail_url: val })}
                aspectRatio="video"
                helperText="Muat naik gambar poster video."
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Tajuk Video</label>
                <input
                  type="text"
                  required
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Kategori</label>
                <input
                  type="text"
                  value={videoForm.category}
                  onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">YouTube Video ID (cth: q6U_y9-pX_4)</label>
                <input
                  type="text"
                  required
                  value={videoForm.youtube_id}
                  onChange={(e) => setVideoForm({ ...videoForm, youtube_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20 font-mono"
                />
              </div>
              <div className="pt-3 flex justify-end items-center space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-normal text-slate-800">
                {editingGallery ? 'Kemaskini Galeri' : 'Tambah Hasil Produksi'}
              </h3>
              <button
                onClick={() => setIsGalleryModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveGallery} className="space-y-3.5">
              <ImageUploadField
                label="Foto Hasil Tempahan"
                value={galleryForm.image_url}
                onChange={(val) => setGalleryForm({ ...galleryForm, image_url: val })}
                aspectRatio="video"
                helperText="Muat naik foto produk sebenar yang siap."
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Tajuk Tempahan</label>
                <input
                  type="text"
                  required
                  value={galleryForm.title}
                  onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Info Fabrik & Kolar</label>
                  <input
                    type="text"
                    value={galleryForm.fabric}
                    onChange={(e) => setGalleryForm({ ...galleryForm, fabric: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Kuantiti & Klien</label>
                  <input
                    type="text"
                    value={galleryForm.client}
                    onChange={(e) => setGalleryForm({ ...galleryForm, client: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Tag Label</label>
                  <input
                    type="text"
                    value={galleryForm.tag}
                    onChange={(e) => setGalleryForm({ ...galleryForm, tag: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Kategori</label>
                  <input
                    type="text"
                    value={galleryForm.category}
                    onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end items-center space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
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
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-normal text-slate-800">
                {editingTesti ? 'Kemaskini Testimoni' : 'Tambah Testimoni'}
              </h3>
              <button
                onClick={() => setIsTestiModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-all"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveTesti} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Nama Pelanggan</label>
                  <input
                    type="text"
                    required
                    value={testiForm.name}
                    onChange={(e) => setTestiForm({ ...testiForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Lokasi</label>
                  <input
                    type="text"
                    value={testiForm.location}
                    onChange={(e) => setTestiForm({ ...testiForm, location: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Platform</label>
                  <select
                    value={testiForm.platform}
                    onChange={(e) => setTestiForm({ ...testiForm, platform: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  >
                    <option value="google">Google Review</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Penilaian (Bintang)</label>
                  <select
                    value={testiForm.rating}
                    onChange={(e) => setTestiForm({ ...testiForm, rating: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                  >
                    <option value={5}>5 Bintang (Cemerlang)</option>
                    <option value={4}>4 Bintang (Bagus)</option>
                    <option value={3}>3 Bintang</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Ulasan</label>
                <textarea
                  rows={3}
                  required
                  value={testiForm.review}
                  onChange={(e) => setTestiForm({ ...testiForm, review: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0B57D0]/20"
                />
              </div>
              <div className="pt-3 flex justify-end items-center space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTestiModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-[#0B57D0] hover:bg-[#0842A0] text-white text-xs font-medium shadow-xs transition-all"
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
