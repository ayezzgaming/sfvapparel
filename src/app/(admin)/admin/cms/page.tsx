'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Palette,
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
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '@/lib/store/app-store';
import { 
  CmsHeroBanner, 
  CmsService, 
  CmsProductionVideo, 
  CmsProductionGalleryItem, 
  CmsTestimonial, 
  CmsThemeSettings,
  CmsThemePresetKey
} from '@/types/database';
import ImageUploadField from '@/components/admin/ImageUploadField';

type CmsTabKey = 'theme' | 'hero' | 'services' | 'slogan' | 'videos' | 'gallery' | 'testimonials' | 'company' | 'policies';

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

  const [activeTab, setActiveTab] = useState<CmsTabKey>('theme');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Sub-tab toggles for complex sections
  const [themeSubTab, setThemeSubTab] = useState<'presets' | 'custom'>('presets');
  const [companySubTab, setCompanySubTab] = useState<'basic' | 'contact' | 'social' | 'developer'>('basic');
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
    avatar_bg: 'bg-sky-50',
    avatar_text: 'text-sky-600',
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
        avatar_bg: 'bg-sky-50',
        avatar_text: 'text-[#00BDFF]',
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

  // Dynamic + Button config based on activeTab
  const renderAddButton = () => {
    switch (activeTab) {
      case 'hero':
        return (
          <button
            type="button"
            onClick={() => handleOpenBannerModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Banner</span>
          </button>
        );
      case 'services':
        return (
          <button
            type="button"
            onClick={() => handleOpenServiceModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
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
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
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
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Hasil</span>
          </button>
        );
      case 'testimonials':
        return (
          <button
            type="button"
            onClick={() => handleOpenTestiModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Testimoni</span>
          </button>
        );
      default:
        return null;
    }
  };

  const TABS: { id: CmsTabKey; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'theme', label: 'Tema & Warna', icon: Palette },
    { id: 'hero', label: 'Banner Utama', icon: ImageIcon, count: heroBanners.length },
    { id: 'services', label: 'Servis', icon: Layers, count: services.length },
    { id: 'slogan', label: 'Slogan & CTA', icon: Quote },
    { id: 'videos', label: 'Video Produksi', icon: Video, count: productionVideos.length },
    { id: 'gallery', label: 'Hasil Kilang', icon: ImageIcon, count: productionGallery.length },
    { id: 'testimonials', label: 'Testimoni', icon: Star, count: testimonials.length },
    { id: 'company', label: 'Syarikat', icon: Building2 },
    { id: 'policies', label: 'Polisi & Terma', icon: FileText },
  ];

  return (
    <div className="w-full h-full overflow-hidden bg-[#f0f4f9] dark:bg-zinc-950 flex flex-col p-4 gap-3 text-slate-900 dark:text-zinc-100 font-sans select-none">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-900 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-700 flex items-center space-x-2 text-xs animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* ----------------- TOP HEADER BAR (Pill Switcher & Actions) ----------------- */}
      <div className="shrink-0 flex items-center justify-between gap-3">
        {/* Main Tab Switcher Bar */}
        <div className="flex items-center space-x-1 bg-slate-100/90 dark:bg-zinc-800/90 backdrop-blur-md p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs overflow-x-auto scrollbar-none no-scrollbar">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-500 dark:bg-zinc-700 dark:text-zinc-400'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Toolbar Kanan */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (confirm('Kembalikan semua tetapan CMS dan Tema ke nilai lalai asal?')) {
                resetToSeedData();
                triggerToast('Semua tetapan dikembalikan ke nilai asal.');
              }
            }}
            title="Set semula data ke nilai asal"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-200 text-xs font-medium transition-all shadow-2xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Reset Lalai</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 text-slate-700 dark:text-zinc-200 text-xs font-medium transition-all shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Lihat Web Awam</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>

          {/* Contextual Add Button */}
          {renderAddButton()}
        </div>
      </div>

      {/* ----------------- MAIN UNIFIED CARD CONTAINER ----------------- */}
      <div className="flex-1 min-h-0 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xs overflow-hidden flex flex-col">
        
        {/* ----------------- INTERNAL CARD HEADER WITH TOGGLES ----------------- */}
        <div className="shrink-0 px-5 py-3.5 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
              {activeTab === 'theme' && 'Tema & Penjenamaan Web Awam'}
              {activeTab === 'hero' && 'Pengurusan Slide Banner Utama'}
              {activeTab === 'services' && 'Pengurusan Pilihan Servis Kilang'}
              {activeTab === 'slogan' && 'Slogan Utama & Ajakan Tindakan'}
              {activeTab === 'videos' && 'Rakaman Video Proses Produksi'}
              {activeTab === 'gallery' && 'Galeri Hasil Tempahan Sebenar'}
              {activeTab === 'testimonials' && 'Ulasan & Testimoni Pelanggan'}
              {activeTab === 'company' && 'Identiti Syarikat & Maklumat Rasmi'}
              {activeTab === 'policies' && 'Dasar, Jaminan & Polisi Kilang'}
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {activeTab === 'theme' && 'Pilih gaya tema pratetap atau sesuaikan warna latar bar navigasi'}
              {activeTab === 'hero' && 'Susun imej banner, tajuk, tag dan pautan butang katalog'}
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
            {activeTab === 'theme' && (
              <div className="flex items-center bg-slate-100/90 dark:bg-zinc-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setThemeSubTab('presets')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${themeSubTab === 'presets' ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Pratetap
                </button>
                <button
                  type="button"
                  onClick={() => setThemeSubTab('custom')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${themeSubTab === 'custom' ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                >
                  Kustomisasi
                </button>
              </div>
            )}

            {(activeTab === 'hero' || activeTab === 'services' || activeTab === 'videos' || activeTab === 'gallery' || activeTab === 'testimonials') && (
              <div className="flex items-center bg-slate-100/90 dark:bg-zinc-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  title="Paparan Grid"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  title="Paparan Senarai"
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-zinc-400'
                  }`}
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {activeTab === 'company' && (
              <div className="flex items-center space-x-1 bg-slate-100/90 dark:bg-zinc-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
                {[
                  { id: 'basic', label: 'Asas & Jenama' },
                  { id: 'contact', label: 'Hubungi' },
                  { id: 'social', label: 'Media Sosial' },
                  { id: 'developer', label: 'Pembangun' },
                ].map((sub) => (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => setCompanySubTab(sub.id as any)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      companySubTab === sub.id
                        ? 'bg-white text-blue-600 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="flex items-center space-x-1 bg-slate-100/90 dark:bg-zinc-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-zinc-700/80 shadow-2xs">
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
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      policySubTab === sub.id
                        ? 'bg-white text-blue-600 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
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
              TAB 1: TEMA & WARNA
             ========================================================================= */}
          {activeTab === 'theme' && (
            <div className="max-w-4xl space-y-6">
              {themeSubTab === 'presets' ? (
                <div className="space-y-4">
                  {/* Current Active Status Pill Banner */}
                  <div className="bg-blue-50/60 dark:bg-zinc-800/50 rounded-2xl p-4 border border-blue-100/80 dark:border-zinc-700 flex items-center justify-between">
                    <div>
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-blue-600 block">Tema Aktif Semasa</span>
                      <span className="text-sm font-bold text-slate-800 dark:text-zinc-100 mt-0.5 block">
                        {themeSettings?.preset === 'clean_white'
                          ? 'Clean Minimal White'
                          : themeSettings?.preset === 'full_blue'
                          ? 'Full Royal Blue'
                          : 'Royal Blue Hybrid (Lalai)'}
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 shadow-2xs">
                      ● Aktif di Laman Web
                    </span>
                  </div>

                  {/* Preset Cards */}
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
                            triggerToast(`Tema "${item.title}" diaktifkan!`);
                          }}
                          className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/30 dark:bg-zinc-800/80 shadow-xs ring-2 ring-blue-500/10'
                              : 'border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 bg-white dark:bg-zinc-900'
                          }`}
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-900 dark:text-zinc-100">{item.title}</span>
                              {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{item.desc}</p>
                          </div>

                          <button
                            type="button"
                            className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                              isSelected
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'border border-slate-200 text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800'
                            }`}
                          >
                            {isSelected ? 'Sedang Digunakan' : 'Gunakan Tema'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Manual Customizer */
                <div className="bg-slate-50/50 dark:bg-zinc-800/40 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-700/80 space-y-4">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Tetapan Warna Lanjutan</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Warna Latar Bar Atas (Header)</label>
                      <input
                        type="text"
                        value={themeSettings?.header_bg || '#FFFFFF'}
                        onChange={(e) => updateThemeSettings({ header_bg: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-800 dark:text-zinc-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Warna Latar Navigasi Bawah (Bottom Nav)</label>
                      <input
                        type="text"
                        value={themeSettings?.bottom_nav_bg || 'rgba(255, 255, 255, 0.95)'}
                        onChange={(e) => updateThemeSettings({ bottom_nav_bg: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-800 dark:text-zinc-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Warna Aksen Aktif (Active Color)</label>
                      <input
                        type="text"
                        value={themeSettings?.bottom_nav_active_color || '#00BDFF'}
                        onChange={(e) => updateThemeSettings({ bottom_nav_active_color: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-800 dark:text-zinc-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700 dark:text-zinc-300">Warna Butang WhatsApp FAB</label>
                      <input
                        type="text"
                        value={themeSettings?.whatsapp_fab_bg || '#25D366'}
                        onChange={(e) => updateThemeSettings({ whatsapp_fab_bg: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-800 dark:text-zinc-200"
                      />
                    </div>
                  </div>
                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => triggerToast('Tetapan warna berjaya disimpan!')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                    >
                      Simpan Warna Kustom
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =========================================================================
              TAB 2: HERO BANNERS
             ========================================================================= */}
          {activeTab === 'hero' && (
            <div className="space-y-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {heroBanners.map((banner, index) => (
                    <div key={banner.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                      <div className="relative h-38 bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-800 dark:text-zinc-200 shadow-xs border border-slate-200/60">
                          Slide #{index + 1}
                        </div>
                      </div>

                      <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                            {banner.tag_text || 'BANNER UTAMA'}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">{banner.title}</h3>
                          <p className="text-xs text-slate-500 line-clamp-1">
                            {banner.status_pill} &bull; Pautan: <span className="font-mono text-blue-600">{banner.button_link}</span>
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                          <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded-full ${banner.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                            {banner.is_active ? 'Aktif' : 'Tidak Aktif'}
                          </span>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenBannerModal(banner)}
                              title="Ubah Banner"
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {heroBanners.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Padam slide banner ini?')) {
                                    deleteHeroBanner(banner.id);
                                    triggerToast('Banner berjaya dipadam.');
                                  }
                                }}
                                title="Padam Banner"
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 uppercase text-[10.5px] font-semibold border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-4">Imej</th>
                        <th className="py-3 px-4">Tajuk Banner</th>
                        <th className="py-3 px-4">Tag / Status Pill</th>
                        <th className="py-3 px-4">Pautan Butang</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {heroBanners.map((banner, idx) => (
                        <tr key={banner.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-slate-400 font-mono text-[10.5px]">#{idx + 1}</span>
                              <div className="w-14 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-900 dark:text-zinc-100">{banner.title}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-zinc-300">
                            <span>{banner.tag_text}</span>
                            <span className="text-slate-400 block text-[10.5px]">{banner.status_pill}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-blue-600">{banner.button_text} ({banner.button_link})</td>
                          <td className="py-3 px-4">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${banner.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {banner.is_active ? 'Aktif' : 'Tidak Aktif'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenBannerModal(banner)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {heroBanners.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Padam slide banner ini?')) {
                                      deleteHeroBanner(banner.id);
                                      triggerToast('Banner berjaya dipadam.');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
              TAB 3: PILIHAN SERVIS
             ========================================================================= */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {services.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                      <div className="relative h-34 bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-zinc-900/90 text-slate-800 dark:text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-slate-200/60">
                          {item.category}
                        </div>
                      </div>

                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">{item.title}</h3>
                          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{item.highlight}</p>
                          <div className="pt-1 text-xs font-mono font-bold text-blue-600">
                            {item.price_prefix} {item.price_amount} {item.price_unit}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                          <span className="text-[10.5px] text-slate-400">{item.details?.length || 0} butiran</span>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenServiceModal(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {services.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Padam servis ini?')) {
                                    deleteService(item.id);
                                    triggerToast('Servis berjaya dipadam.');
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 uppercase text-[10.5px] font-semibold border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-4">Imej & Kategori</th>
                        <th className="py-3 px-4">Tajuk Servis</th>
                        <th className="py-3 px-4">Sorotan / Highlight</th>
                        <th className="py-3 px-4">Harga Bermula</th>
                        <th className="py-3 px-4 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {services.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-12 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                              </div>
                              <span className="font-semibold text-slate-800 dark:text-zinc-200">{item.category}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-100">{item.title}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-zinc-400 max-w-[240px] truncate">{item.highlight}</td>
                          <td className="py-3 px-4 font-mono font-bold text-blue-600">
                            {item.price_prefix} {item.price_amount} {item.price_unit}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenServiceModal(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {services.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Padam servis ini?')) {
                                      deleteService(item.id);
                                      triggerToast('Servis berjaya dipadam.');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
              TAB 4: SLOGAN & CTA
             ========================================================================= */}
          {activeTab === 'slogan' && (
            <div className="max-w-3xl space-y-5">
              {/* Soft Live Preview Box */}
              <div className="rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/40 p-4 sm:p-5 border border-blue-100/90">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Pratonton Langsung Slogan</span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  {sloganQuote.headline} <span className="text-blue-600">{sloganQuote.highlight_text}</span>
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-1">{sloganQuote.question_text}</p>
                <p className="text-[11.5px] text-slate-500 mt-0.5">{sloganQuote.description_text}</p>
              </div>

              {/* Slogan Form Fields */}
              <div className="bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-700/80 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Baris Utama Slogan</label>
                    <input
                      type="text"
                      value={sloganQuote.headline}
                      onChange={(e) => updateSloganQuote({ headline: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Teks Sorotan (Highlight)</label>
                    <input
                      type="text"
                      value={sloganQuote.highlight_text}
                      onChange={(e) => updateSloganQuote({ highlight_text: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Ayat Soalan</label>
                  <input
                    type="text"
                    value={sloganQuote.question_text}
                    onChange={(e) => updateSloganQuote({ question_text: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Keterangan Ajakan</label>
                  <textarea
                    rows={2}
                    value={sloganQuote.description_text}
                    onChange={(e) => updateSloganQuote({ description_text: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Label Butang WhatsApp</label>
                    <input
                      type="text"
                      value={sloganQuote.button_text}
                      onChange={(e) => updateSloganQuote({ button_text: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Mesej Templat WhatsApp</label>
                    <input
                      type="text"
                      value={sloganQuote.whatsapp_message}
                      onChange={(e) => updateSloganQuote({ whatsapp_message: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => triggerToast('Slogan & ajakan WhatsApp berjaya disimpan!')}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Slogan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 5: VIDEO PRODUKSI
             ========================================================================= */}
          {activeTab === 'videos' && (
            <div className="space-y-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {productionVideos.map((video) => (
                    <div key={video.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                      <div className="relative aspect-[9/13] bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-zinc-900/90 text-slate-800 dark:text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-slate-200/60">
                          {video.category}
                        </div>
                      </div>

                      <div className="p-4 space-y-2 bg-white dark:bg-zinc-900 flex-1 flex flex-col justify-between">
                        <div className="space-y-0.5">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">{video.title}</h3>
                          <p className="text-[10.5px] text-slate-400 font-mono">ID: {video.youtube_id}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                          <a
                            href={`https://www.youtube.com/watch?v=${video.youtube_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                            title="Tonton di YouTube"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenVideoModal(video)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {productionVideos.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Padam video ini?')) {
                                    deleteProductionVideo(video.id);
                                    triggerToast('Video berjaya dipadam.');
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 uppercase text-[10.5px] font-semibold border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-4">Thumbnail & Kategori</th>
                        <th className="py-3 px-4">Tajuk Video</th>
                        <th className="py-3 px-4">YouTube ID</th>
                        <th className="py-3 px-4 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {productionVideos.map((video) => (
                        <tr key={video.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-12 h-14 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                              </div>
                              <span className="font-semibold text-slate-800 dark:text-zinc-200">{video.category}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-100">{video.title}</td>
                          <td className="py-3 px-4 font-mono text-blue-600">{video.youtube_id}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenVideoModal(video)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {productionVideos.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Padam video ini?')) {
                                      deleteProductionVideo(video.id);
                                      triggerToast('Video berjaya dipadam.');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
              TAB 6: HASIL KILANG (GALLERY)
             ========================================================================= */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {productionGallery.map((item) => (
                    <div key={item.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                      <div className="relative h-38 bg-slate-100 dark:bg-zinc-800 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        <div className="absolute top-2.5 left-2.5 bg-white/95 dark:bg-zinc-900/90 text-slate-800 dark:text-zinc-200 text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs border border-slate-200/60">
                          {item.tag}
                        </div>
                      </div>

                      <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-zinc-100 line-clamp-1">{item.title}</h3>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{item.fabric}</p>
                          <p className="text-[11px] font-semibold text-blue-600">{item.client}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                          <span className="text-[10.5px] text-slate-400">{item.category}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => handleOpenGalleryModal(item)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            {productionGallery.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Padam item galeri ini?')) {
                                    deleteGalleryItem(item.id);
                                    triggerToast('Item galeri berjaya dipadam.');
                                  }
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 uppercase text-[10.5px] font-semibold border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-4">Foto & Tag</th>
                        <th className="py-3 px-4">Tajuk Tempahan</th>
                        <th className="py-3 px-4">Spesifikasi Fabrik</th>
                        <th className="py-3 px-4">Klien & Kuantiti</th>
                        <th className="py-3 px-4 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {productionGallery.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-12 h-9 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                              </div>
                              <span className="font-semibold text-slate-800 dark:text-zinc-200">{item.tag}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-zinc-100">{item.title}</td>
                          <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">{item.fabric}</td>
                          <td className="py-3 px-4 text-blue-600 font-semibold">{item.client}</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenGalleryModal(item)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {productionGallery.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Padam item galeri ini?')) {
                                      deleteGalleryItem(item.id);
                                      triggerToast('Item galeri berjaya dipadam.');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
              TAB 7: TESTIMONI
             ========================================================================= */}
          {activeTab === 'testimonials' && (
            <div className="space-y-4">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testimonials.map((t) => (
                    <div key={t.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-200/80 dark:border-zinc-800 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-7 h-7 rounded-full ${t.avatar_bg} ${t.avatar_text} font-bold text-xs flex items-center justify-center shadow-2xs`}>
                              {t.initial}
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-slate-900 dark:text-zinc-100">{t.name}</h4>
                              <p className="text-[10.5px] text-slate-400">{t.location}</p>
                            </div>
                          </div>
                          <span className="text-[9.5px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400">
                            {t.platform}
                          </span>
                        </div>

                        <div className="flex text-amber-400">
                          {Array.from({ length: t.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed line-clamp-3">&quot;{t.review.replace(/"/g, '')}&quot;</p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex justify-end space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenTestiModal(t)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {testimonials.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Padam ulasan ini?')) {
                                deleteTestimonial(t.id);
                                triggerToast('Testimoni berjaya dipadam.');
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View Table */
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500 uppercase text-[10.5px] font-semibold border-b border-slate-200/80">
                      <tr>
                        <th className="py-3 px-4">Pelanggan</th>
                        <th className="py-3 px-4">Platform</th>
                        <th className="py-3 px-4">Penilaian</th>
                        <th className="py-3 px-4">Isi Ulasan</th>
                        <th className="py-3 px-4 text-center">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                      {testimonials.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <div className={`w-7 h-7 rounded-full ${t.avatar_bg} ${t.avatar_text} font-bold text-xs flex items-center justify-center`}>
                                {t.initial}
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 dark:text-zinc-100">{t.name}</h4>
                                <p className="text-[10px] text-slate-400">{t.location}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 uppercase font-bold text-[10px] text-slate-600 dark:text-zinc-400">{t.platform}</td>
                          <td className="py-3 px-4">
                            <div className="flex text-amber-400">
                              {Array.from({ length: t.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-amber-400" />
                              ))}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-zinc-400 max-w-[320px] truncate">&quot;{t.review}&quot;</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => handleOpenTestiModal(t)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              {testimonials.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Padam ulasan ini?')) {
                                      deleteTestimonial(t.id);
                                      triggerToast('Testimoni berjaya dipadam.');
                                    }
                                  }}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
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
              TAB 8: IDENTITI SYARIKAT
             ========================================================================= */}
          {activeTab === 'company' && (
            <div className="max-w-3xl space-y-5">
              <div className="bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-700/80 space-y-4">
                {companySubTab === 'basic' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Nama Syarikat Berdaftar</label>
                        <input
                          type="text"
                          value={companySettings.company_name}
                          onChange={(e) => updateCompanySettings({ company_name: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Nama Jenama (Brand)</label>
                        <input
                          type="text"
                          value={companySettings.brand_name}
                          onChange={(e) => updateCompanySettings({ brand_name: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/20"
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
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Slogan Rasmi (Tagline)</label>
                        <input
                          type="text"
                          value={companySettings.tagline}
                          onChange={(e) => updateCompanySettings({ tagline: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {companySubTab === 'contact' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">No. Telefon WhatsApp Kilang</label>
                        <input
                          type="text"
                          value={companySettings.whatsapp_number}
                          onChange={(e) => updateCompanySettings({ whatsapp_number: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-mono text-slate-900 dark:text-zinc-100"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Emel Rasmi Sokongan</label>
                        <input
                          type="email"
                          value={companySettings.email}
                          onChange={(e) => updateCompanySettings({ email: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Alamat Penuh Kilang / Pejabat</label>
                      <textarea
                        rows={2}
                        value={companySettings.address}
                        onChange={(e) => updateCompanySettings({ address: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Waktu Operasi Kilang</label>
                      <input
                        type="text"
                        value={companySettings.working_hours}
                        onChange={(e) => updateCompanySettings({ working_hours: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100"
                      />
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
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Facebook URL</label>
                      <input
                        type="text"
                        value={companySettings.facebook_url}
                        onChange={(e) => updateCompanySettings({ facebook_url: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Instagram URL</label>
                      <input
                        type="text"
                        value={companySettings.instagram_url}
                        onChange={(e) => updateCompanySettings({ instagram_url: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">TikTok URL</label>
                      <input
                        type="text"
                        value={companySettings.tiktok_url}
                        onChange={(e) => updateCompanySettings({ tiktok_url: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono"
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
                        value={companySettings.developer_name || 'AYEZZ Studio'}
                        onChange={(e) => updateCompanySettings({ developer_name: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-bold"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Pautan URL Pembangun</label>
                      <input
                        type="text"
                        value={companySettings.developer_url || 'https://ayezz.com'}
                        onChange={(e) => updateCompanySettings({ developer_url: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-900 dark:text-zinc-100 font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => triggerToast('Maklumat syarikat berjaya dikemaskini!')}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Maklumat Syarikat</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              TAB 9: DASAR & POLISI KILANG
             ========================================================================= */}
          {activeTab === 'policies' && (
            <div className="max-w-3xl space-y-4">
              {(() => {
                const pol = policies[policySubTab];
                if (!pol) return null;
                return (
                  <div className="bg-slate-50/50 dark:bg-zinc-800/30 rounded-2xl p-5 border border-slate-200/80 dark:border-zinc-700/80 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tajuk Polisi</label>
                      <input
                        type="text"
                        value={pol.title}
                        onChange={(e) => updatePolicy(policySubTab, { title: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs font-bold text-slate-900 dark:text-zinc-100"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Penerangan Ringkas</label>
                      <input
                        type="text"
                        value={pol.description}
                        onChange={(e) => updatePolicy(policySubTab, { description: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-xs text-slate-800 dark:text-zinc-200"
                      />
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900 dark:text-zinc-100 uppercase tracking-wider">Seksyen Fasal</label>
                        <button
                          type="button"
                          onClick={() => {
                            const nextSecs = [...(pol.sections || []), { heading: 'Fasal Baharu', text: 'Keterangan fasal di sini.' }];
                            updatePolicy(policySubTab, { sections: nextSecs });
                          }}
                          className="text-[11px] font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Tambah Fasal</span>
                        </button>
                      </div>

                      {pol.sections?.map((sec, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-700 space-y-2 relative group">
                          <div className="flex items-center justify-between gap-2">
                            <input
                              type="text"
                              value={sec.heading}
                              onChange={(e) => {
                                const nextSecs = [...pol.sections];
                                nextSecs[idx] = { ...nextSecs[idx], heading: e.target.value };
                                updatePolicy(policySubTab, { sections: nextSecs });
                              }}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 text-xs font-bold text-slate-800 dark:text-zinc-200"
                            />
                            {pol.sections.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const nextSecs = pol.sections.filter((_, i) => i !== idx);
                                  updatePolicy(policySubTab, { sections: nextSecs });
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <textarea
                            rows={2}
                            value={sec.text}
                            onChange={(e) => {
                              const nextSecs = [...pol.sections];
                              nextSecs[idx] = { ...nextSecs[idx], text: e.target.value };
                              updatePolicy(policySubTab, { sections: nextSecs });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700 text-xs text-slate-700 dark:text-zinc-300"
                          />
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => triggerToast(`Polisi ${pol.title} berjaya disimpan!`)}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Polisi Ini</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

        </div>
      </div>

      {/* =========================================================================
          HERO BANNER MODAL
         ========================================================================= */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingBanner ? 'Kemaskini Slide Banner' : 'Tambah Slide Banner'}
              </h3>
              <button
                type="button"
                onClick={() => setIsBannerModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 flex items-center justify-center transition-all text-xs"
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
                helperText="Muat naik fail gambar banner utama."
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tajuk Utama</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs focus:bg-white dark:focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tag / Kategori</label>
                  <input
                    type="text"
                    value={bannerForm.tag_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, tag_text: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Pill Status</label>
                  <input
                    type="text"
                    value={bannerForm.status_pill}
                    onChange={(e) => setBannerForm({ ...bannerForm, status_pill: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Teks Butang</label>
                  <input
                    type="text"
                    value={bannerForm.button_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Pautan Butang</label>
                  <input
                    type="text"
                    value={bannerForm.button_link}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_link: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end items-center space-x-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  Simpan Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          SERVICE MODAL
         ========================================================================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingService ? 'Kemaskini Servis' : 'Tambah Servis Baharu'}
              </h3>
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 flex items-center justify-center transition-all text-xs"
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
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Kategori Servis</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tajuk Servis</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Headline Ringkas</label>
                <input
                  type="text"
                  value={serviceForm.headline}
                  onChange={(e) => setServiceForm({ ...serviceForm, headline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Keterangan Ringkas</label>
                <textarea
                  rows={2}
                  value={serviceForm.highlight}
                  onChange={(e) => setServiceForm({ ...serviceForm, highlight: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Prefix</label>
                  <input
                    type="text"
                    value={serviceForm.price_prefix}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_prefix: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Harga</label>
                  <input
                    type="text"
                    value={serviceForm.price_amount}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_amount: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Unit</label>
                  <input
                    type="text"
                    value={serviceForm.price_unit}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_unit: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end items-center space-x-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  Simpan Servis
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIDEO MODAL
         ========================================================================= */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingVideo ? 'Kemaskini Video' : 'Tambah Video'}
              </h3>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 flex items-center justify-center transition-all text-xs"
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
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tajuk Video</label>
                <input
                  type="text"
                  required
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Kategori</label>
                <input
                  type="text"
                  value={videoForm.category}
                  onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">YouTube Video ID (cth: q6U_y9-pX_4)</label>
                <input
                  type="text"
                  required
                  value={videoForm.youtube_id}
                  onChange={(e) => setVideoForm({ ...videoForm, youtube_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs font-mono"
                />
              </div>
              <div className="pt-3 flex justify-end items-center space-x-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
                >
                  Simpan Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          GALLERY MODAL
         ========================================================================= */}
      {isGalleryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingGallery ? 'Kemaskini Galeri' : 'Tambah Hasil Produksi'}
              </h3>
              <button
                type="button"
                onClick={() => setIsGalleryModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 flex items-center justify-center transition-all text-xs"
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
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tajuk Tempahan</label>
                <input
                  type="text"
                  required
                  value={galleryForm.title}
                  onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Info Fabrik & Kolar</label>
                  <input
                    type="text"
                    value={galleryForm.fabric}
                    onChange={(e) => setGalleryForm({ ...galleryForm, fabric: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Kuantiti & Klien</label>
                  <input
                    type="text"
                    value={galleryForm.client}
                    onChange={(e) => setGalleryForm({ ...galleryForm, client: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Tag Label</label>
                  <input
                    type="text"
                    value={galleryForm.tag}
                    onChange={(e) => setGalleryForm({ ...galleryForm, tag: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Kategori</label>
                  <input
                    type="text"
                    value={galleryForm.category}
                    onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end items-center space-x-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
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
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingTesti ? 'Kemaskini Testimoni' : 'Tambah Testimoni'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTestiModalOpen(false)}
                className="w-7 h-7 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 flex items-center justify-center transition-all text-xs"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveTesti} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Nama Pelanggan</label>
                  <input
                    type="text"
                    required
                    value={testiForm.name}
                    onChange={(e) => setTestiForm({ ...testiForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Lokasi</label>
                  <input
                    type="text"
                    value={testiForm.location}
                    onChange={(e) => setTestiForm({ ...testiForm, location: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Platform</label>
                  <select
                    value={testiForm.platform}
                    onChange={(e) => setTestiForm({ ...testiForm, platform: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  >
                    <option value="google">Google Review</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Penilaian (Bintang)</label>
                  <select
                    value={testiForm.rating}
                    onChange={(e) => setTestiForm({ ...testiForm, rating: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                  >
                    <option value={5}>5 Bintang (Cemerlang)</option>
                    <option value={4}>4 Bintang (Bagus)</option>
                    <option value={3}>3 Bintang</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Ulasan Pelanggan</label>
                <textarea
                  rows={3}
                  required
                  value={testiForm.review}
                  onChange={(e) => setTestiForm({ ...testiForm, review: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 text-xs"
                />
              </div>
              <div className="pt-3 flex justify-end items-center space-x-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsTestiModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
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
