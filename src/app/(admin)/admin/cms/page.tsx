'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
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
  RotateCcw
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
  CmsPolicy
} from '@/types/database';

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
    resetToSeedData,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'hero' | 'services' | 'slogan' | 'videos' | 'gallery' | 'testimonials' | 'company' | 'policies'>('hero');
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
        title: 'Servis Cetakan Kustom',
        headline: 'Hasil cetakan berkualiti tinggi standard kilang.',
        highlight: 'Kain DryFit • Warna Kekal',
        price_prefix: 'Bermula',
        price_amount: 'RM25',
        price_unit: '/ helai',
        image_url: '/images/prod_sportswear.jpg',
        href: '/catalog',
        is_active: true,
        details: [
          { title: 'Kualiti Fabrik', description: 'Fabrik sejuk berliang mikro sesuai aktiviti lasak.' }
        ],
      });
    }
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title) return;
    if (editingService) {
      updateService(editingService.id, serviceForm);
      triggerToast('Pilihan Servis berjaya dikemaskini!');
    } else {
      addService({
        ...serviceForm,
        sort_order: services.length + 1,
      });
      triggerToast('Pilihan Servis baharu berjaya ditambah!');
    }
    setIsServiceModalOpen(false);
  };

  // -------------------------------------------------------------
  // VIDEO MODAL STATE
  // -------------------------------------------------------------
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<CmsProductionVideo | null>(null);
  const [videoForm, setVideoForm] = useState({
    category: 'Sublimasi Penuh',
    title: '',
    thumbnail_url: '/images/prod_sportswear.jpg',
    youtube_id: '',
    is_active: true,
  });

  const handleOpenVideoModal = (video?: CmsProductionVideo) => {
    if (video) {
      setEditingVideo(video);
      setVideoForm({
        category: video.category,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        youtube_id: video.youtube_id,
        is_active: video.is_active,
      });
    } else {
      setEditingVideo(null);
      setVideoForm({
        category: 'Rakaman Kilang',
        title: 'Cetakan Definisi Tinggi',
        thumbnail_url: '/images/prod_sportswear.jpg',
        youtube_id: 'LXb3EKWsInQ',
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
        name: 'Pelanggan Baharu',
        location: 'Kuala Lumpur',
        initial: 'P',
        avatar_bg: 'bg-blue-100',
        avatar_text: 'text-blue-600',
        platform: 'google',
        rating: 5,
        review: 'Kualiti jersi terbaik, warna cetakan tajam dan jahitan sangat kemas.',
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
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* ----------------- TOP DESKTOP HEADER BAR ----------------- */}
      <div className="h-16 px-6 border-b border-slate-800 bg-slate-900 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-base text-white tracking-tight">
              Pengurus Kandungan Web (CMS Hub)
            </h1>
            <p className="text-xs text-slate-400">
              Kawal semua elemen visual, teks, galeri, dan maklumat syarikat di Halaman Awam secara langsung
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {saveToast && (
            <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{saveToast}</span>
            </div>
          )}

          <Link
            href="/"
            target="_blank"
            className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Eye className="w-4 h-4 text-blue-400" />
            <span>Pratonton Laman Web</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </div>

      {/* ----------------- CMS SECTION TABS ----------------- */}
      <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto scrollbar-none flex-shrink-0">
        {[
          { id: 'hero', label: '1. Hero Banner', icon: ImageIcon, count: heroBanners.length },
          { id: 'services', label: '2. Pilihan Servis', icon: Layers, count: services.length },
          { id: 'slogan', label: '3. Kad Slogan & CTA', icon: Quote },
          { id: 'videos', label: '4. Video Produksi', icon: Video, count: productionVideos.length },
          { id: 'gallery', label: '5. Hasil Produksi', icon: ImageIcon, count: productionGallery.length },
          { id: 'testimonials', label: '6. Testimoni', icon: Star, count: testimonials.length },
          { id: 'company', label: '7. Identiti Syarikat', icon: Building2 },
          { id: 'policies', label: '8. Dasar & Polisi', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ----------------- MAIN DESKTOP TAB CONTENT AREA ----------------- */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-950 space-y-6">

        {/* =========================================================================
            TAB 1: HERO BANNERS
           ========================================================================= */}
        {activeTab === 'hero' && (
          <div className="space-y-4 max-w-6xl">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Slide Banner Utama (Hero Slider)</h2>
                <p className="text-xs text-slate-400">Uruskan gambar banner di bahagian atas halaman utama</p>
              </div>
              <button
                onClick={() => handleOpenBannerModal()}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Slide Banner</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heroBanners.map((banner, index) => (
                <div key={banner.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="relative h-44 bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-full text-[10.5px] font-semibold text-white">
                      Slide #{index + 1}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <span className="text-[10px] font-bold uppercase text-blue-300 block">{banner.tag_text}</span>
                      <h3 className="text-sm font-bold truncate drop-shadow-md">{banner.title}</h3>
                    </div>
                  </div>

                  <div className="p-4 space-y-3 bg-slate-900 flex-1 flex flex-col justify-between">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Pill Status:</span>
                        <span className="text-slate-200 font-medium">{banner.status_pill}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Butang Pautan:</span>
                        <span className="text-blue-400 font-mono text-[11px]">{banner.button_link}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded ${banner.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                        {banner.is_active ? 'AKTIF' : 'TIDAK AKTIF'}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenBannerModal(banner)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
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
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
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
          </div>
        )}

        {/* =========================================================================
            TAB 2: PILIHAN SERVIS
           ========================================================================= */}
        {activeTab === 'services' && (
          <div className="space-y-4 max-w-6xl">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Kad Pilihan Servis</h2>
                <p className="text-xs text-slate-400">Ubah tajuk servis, gambar, harga bermula dan butiran penerangan</p>
              </div>
              <button
                onClick={() => handleOpenServiceModal()}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Servis Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {services.map((item) => (
                <div key={item.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
                  <div className="relative h-40 bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                      {item.category}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white">{item.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.highlight}</p>
                      <div className="mt-2 text-xs font-bold text-blue-400">
                        {item.price_prefix} {item.price_amount} {item.price_unit}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">{item.details?.length || 0} Perenggan Info</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenServiceModal(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
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
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"
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
          </div>
        )}

        {/* =========================================================================
            TAB 3: KAD SLOGAN & CTA
           ========================================================================= */}
        {activeTab === 'slogan' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Tetapan Kad Slogan & Ajakan WhatsApp</h2>
                <p className="text-xs text-slate-400">Ubah teks slogan rasmi, keterangan, dan mesej template WhatsApp</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Baris Utama Slogan</label>
                    <input
                      type="text"
                      value={sloganQuote.headline}
                      onChange={(e) => updateSloganQuote({ headline: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Teks Sorotan (Highlight)</label>
                    <input
                      type="text"
                      value={sloganQuote.highlight_text}
                      onChange={(e) => updateSloganQuote({ highlight_text: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Ayat Soalan</label>
                  <input
                    type="text"
                    value={sloganQuote.question_text}
                    onChange={(e) => updateSloganQuote({ question_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Keterangan Ajakan</label>
                  <textarea
                    rows={3}
                    value={sloganQuote.description_text}
                    onChange={(e) => updateSloganQuote({ description_text: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Label Butang WhatsApp</label>
                    <input
                      type="text"
                      value={sloganQuote.button_text}
                      onChange={(e) => updateSloganQuote({ button_text: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Mesej Templat WhatsApp</label>
                    <input
                      type="text"
                      value={sloganQuote.whatsapp_message}
                      onChange={(e) => updateSloganQuote({ whatsapp_message: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => triggerToast('Slogan & ajakan WhatsApp berjaya disimpan!')}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>Simpan Perubahan Slogan</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Desktop Preview */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0052FF] via-[#0044D6] to-[#0A1847] text-white shadow-xl space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-blue-200 block">Pratonton Langsung di Web</span>
              <h3 className="text-lg font-extrabold leading-snug">
                {sloganQuote.headline} <br />
                <span className="text-blue-200 underline underline-offset-4">{sloganQuote.highlight_text}</span>
              </h3>
              <p className="text-xs font-bold text-white/95">{sloganQuote.question_text}</p>
              <p className="text-xs text-blue-100/90">{sloganQuote.description_text}</p>
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-[#0052FF] text-xs font-bold">
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
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Video Proses Produksi (YouTube Reel)</h2>
                <p className="text-xs text-slate-400">Tukar ID YouTube, thumbnail gambar, dan label kategori rakaman kilang</p>
              </div>
              <button
                onClick={() => handleOpenVideoModal()}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Video Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {productionVideos.map((video) => (
                <div key={video.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
                  <div className="relative aspect-[9/14] bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-3.5">
                      <span className="self-start bg-[#0052FF] text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        {video.category}
                      </span>
                      <div>
                        <h3 className="font-bold text-white text-sm drop-shadow">{video.title}</h3>
                        <p className="text-[11px] text-slate-300 font-mono mt-0.5">ID: {video.youtube_id}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">YouTube Embed</span>
                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleOpenVideoModal(video)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
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
                          className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: HASIL PRODUKSI KILANG
           ========================================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-4 max-w-6xl">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Galeri Hasil Produksi Kilang</h2>
                <p className="text-xs text-slate-400">Tambah foto jersi siap, perincian fabrik, nama klien dan kuantiti</p>
              </div>
              <button
                onClick={() => handleOpenGalleryModal()}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Hasil Produksi</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productionGallery.map((item) => (
                <div key={item.id} className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden flex flex-col justify-between">
                  <div className="relative h-44 bg-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                    <div className="absolute top-3 left-3 bg-white/95 text-[#0052FF] text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shadow">
                      {item.tag}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-white">{item.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{item.fabric}</p>
                      <p className="text-[11.5px] text-blue-400 font-medium mt-1">{item.client}</p>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">{item.category}</span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleOpenGalleryModal(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
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
                            className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"
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
          </div>
        )}

        {/* =========================================================================
            TAB 6: TESTIMONI PELANGGAN
           ========================================================================= */}
        {activeTab === 'testimonials' && (
          <div className="space-y-4 max-w-6xl">
            <div className="flex justify-between items-center bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white">Ulasan & Testimoni Pelanggan</h2>
                <p className="text-xs text-slate-400">Uruskan ulasan di bahagian &quot;Apa Kata Mereka&quot; di Halaman Utama</p>
              </div>
              <button
                onClick={() => handleOpenTestiModal()}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Testimoni</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {testimonials.map((t) => (
                <div key={t.id} className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-full ${t.avatar_bg} ${t.avatar_text} font-bold text-xs flex items-center justify-center`}>
                          {t.initial}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-white">{t.name}</h4>
                          <p className="text-[11px] text-slate-400">{t.location}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {t.platform}
                      </span>
                    </div>

                    <div className="flex text-amber-400">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>

                    <p className="text-xs text-slate-300 italic line-clamp-4">&quot;{t.review.replace(/"/g, '')}&quot;</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex justify-end space-x-1.5">
                    <button
                      onClick={() => handleOpenTestiModal(t)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
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
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: IDENTITI SYARIKAT & FOOTER
           ========================================================================= */}
        {activeTab === 'company' && (
          <div className="max-w-4xl space-y-6">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-5">
              <div>
                <h2 className="text-base font-bold text-white">Identiti Syarikat & Maklumat Rasmi</h2>
                <p className="text-xs text-slate-400">Maklumat ini akan dipaparkan di Footer, pautan WhatsApp, dan maklumat hak cipta</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Nama Syarikat Berdaftar</label>
                    <input
                      type="text"
                      value={companySettings.company_name}
                      onChange={(e) => updateCompanySettings({ company_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Nama Jenama (Brand)</label>
                    <input
                      type="text"
                      value={companySettings.brand_name}
                      onChange={(e) => updateCompanySettings({ brand_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Nombor Pendaftaran Syarikat (SSM)</label>
                    <input
                      type="text"
                      value={companySettings.registration_number}
                      onChange={(e) => updateCompanySettings({ registration_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Nombor WhatsApp Rasmi</label>
                    <input
                      type="text"
                      value={companySettings.whatsapp_number}
                      onChange={(e) => updateCompanySettings({ whatsapp_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Email Khidmat Pelanggan</label>
                    <input
                      type="email"
                      value={companySettings.email}
                      onChange={(e) => updateCompanySettings({ email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">No Telefon Pejabat</label>
                    <input
                      type="text"
                      value={companySettings.phone}
                      onChange={(e) => updateCompanySettings({ phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Alamat Kilang / Pejabat</label>
                  <input
                    type="text"
                    value={companySettings.address}
                    onChange={(e) => updateCompanySettings({ address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Tagline Syarikat (Footer)</label>
                  <textarea
                    rows={2}
                    value={companySettings.tagline}
                    onChange={(e) => updateCompanySettings({ tagline: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-blue-500 outline-none"
                  />
                </div>

                {/* Social Media Links */}
                <div className="pt-2 border-t border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-200">Pautan Media Sosial & Saluran Rasmi</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Telegram Katalog</label>
                      <input
                        type="text"
                        value={companySettings.telegram_catalog_url}
                        onChange={(e) => updateCompanySettings({ telegram_catalog_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Facebook URL</label>
                      <input
                        type="text"
                        value={companySettings.facebook_url}
                        onChange={(e) => updateCompanySettings({ facebook_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Instagram URL</label>
                      <input
                        type="text"
                        value={companySettings.instagram_url}
                        onChange={(e) => updateCompanySettings({ instagram_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">TikTok URL</label>
                      <input
                        type="text"
                        value={companySettings.tiktok_url}
                        onChange={(e) => updateCompanySettings({ tiktok_url: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    onClick={() => triggerToast('Identiti syarikat berjaya dikemaskini!')}
                    className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20"
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
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Dasar & Polisi Kilang</h2>
                <p className="text-xs text-slate-400">Ubah isi kandungan terma, privasi, jaminan pemulangan dan dasar penghantaran</p>
              </div>

              {(['privacy', 'terms', 'warranty', 'shipping'] as const).map((key) => {
                const pol = policies[key];
                return (
                  <div key={key} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="font-bold text-sm text-white">{pol.title}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600/20 text-blue-400">
                        {pol.badge}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] text-slate-400">Penerangan Ringkas</label>
                      <input
                        type="text"
                        value={pol.description}
                        onChange={(e) => updatePolicy(key, { description: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="text-[11px] font-bold text-slate-300">Seksyen Fasal</label>
                      {pol.sections?.map((sec, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                          <input
                            type="text"
                            value={sec.heading}
                            onChange={(e) => {
                              const nextSecs = [...pol.sections];
                              nextSecs[idx] = { ...nextSecs[idx], heading: e.target.value };
                              updatePolicy(key, { sections: nextSecs });
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs font-bold text-white"
                          />
                          <textarea
                            rows={2}
                            value={sec.text}
                            onChange={(e) => {
                              const nextSecs = [...pol.sections];
                              nextSecs[idx] = { ...nextSecs[idx], text: e.target.value };
                              updatePolicy(key, { sections: nextSecs });
                            }}
                            className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-xs text-slate-300"
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
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20"
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
          HERO BANNER MODAL
         ========================================================================= */}
      {isBannerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">
                {editingBanner ? 'Kemaskini Slide Banner' : 'Tambah Slide Banner Baharu'}
              </h3>
              <button onClick={() => setIsBannerModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveBanner} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">URL Gambar Banner</label>
                <input
                  type="text"
                  required
                  value={bannerForm.image_url}
                  onChange={(e) => setBannerForm({ ...bannerForm, image_url: e.target.value })}
                  placeholder="/hero1.png atau https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tajuk Utama Banner</label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Tag / Kategori</label>
                  <input
                    type="text"
                    value={bannerForm.tag_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, tag_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Status Pill</label>
                  <input
                    type="text"
                    value={bannerForm.status_pill}
                    onChange={(e) => setBannerForm({ ...bannerForm, status_pill: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Teks Butang</label>
                  <input
                    type="text"
                    value={bannerForm.button_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Pautan Butang</label>
                  <input
                    type="text"
                    value={bannerForm.button_link}
                    onChange={(e) => setBannerForm({ ...bannerForm, button_link: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                >
                  Simpan Slide
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">
                {editingService ? 'Kemaskini Pilihan Servis' : 'Tambah Pilihan Servis'}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveService} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Tajuk Servis</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.title}
                    onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Kategori</label>
                  <input
                    type="text"
                    required
                    value={serviceForm.category}
                    onChange={(e) => setServiceForm({ ...serviceForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">URL Gambar</label>
                <input
                  type="text"
                  required
                  value={serviceForm.image_url}
                  onChange={(e) => setServiceForm({ ...serviceForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Prefix Harga</label>
                  <input
                    type="text"
                    value={serviceForm.price_prefix}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_prefix: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Amaun (cth: RM28)</label>
                  <input
                    type="text"
                    value={serviceForm.price_amount}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_amount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold text-blue-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Unit (cth: / helai)</label>
                  <input
                    type="text"
                    value={serviceForm.price_unit}
                    onChange={(e) => setServiceForm({ ...serviceForm, price_unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Highlight Teks (Pill)</label>
                <input
                  type="text"
                  value={serviceForm.highlight}
                  onChange={(e) => setServiceForm({ ...serviceForm, highlight: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Pautan Katalog (Href)</label>
                <input
                  type="text"
                  value={serviceForm.href}
                  onChange={(e) => setServiceForm({ ...serviceForm, href: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">
                {editingVideo ? 'Kemaskini Video' : 'Tambah Video Baru'}
              </h3>
              <button onClick={() => setIsVideoModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveVideo} className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">YouTube Video ID (cth: LXb3EKWsInQ)</label>
                <input
                  type="text"
                  required
                  value={videoForm.youtube_id}
                  onChange={(e) => setVideoForm({ ...videoForm, youtube_id: e.target.value })}
                  placeholder="LXb3EKWsInQ"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tajuk Video</label>
                <input
                  type="text"
                  required
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Kategori</label>
                <input
                  type="text"
                  required
                  value={videoForm.category}
                  onChange={(e) => setVideoForm({ ...videoForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">URL Gambar Thumbnail</label>
                <input
                  type="text"
                  required
                  value={videoForm.thumbnail_url}
                  onChange={(e) => setVideoForm({ ...videoForm, thumbnail_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">
                {editingGallery ? 'Kemaskini Hasil Produksi' : 'Tambah Hasil Produksi'}
              </h3>
              <button onClick={() => setIsGalleryModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveGallery} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Tajuk Tempahan</label>
                <input
                  type="text"
                  required
                  value={galleryForm.title}
                  onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">URL Gambar Produk</label>
                <input
                  type="text"
                  required
                  value={galleryForm.image_url}
                  onChange={(e) => setGalleryForm({ ...galleryForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Info Fabrik & Kolar</label>
                  <input
                    type="text"
                    value={galleryForm.fabric}
                    onChange={(e) => setGalleryForm({ ...galleryForm, fabric: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Kuantiti & Nama Klien</label>
                  <input
                    type="text"
                    value={galleryForm.client}
                    onChange={(e) => setGalleryForm({ ...galleryForm, client: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Tag Label</label>
                  <input
                    type="text"
                    value={galleryForm.tag}
                    onChange={(e) => setGalleryForm({ ...galleryForm, tag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Kategori</label>
                  <input
                    type="text"
                    value={galleryForm.category}
                    onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsGalleryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-sm text-white">
                {editingTesti ? 'Kemaskini Testimoni' : 'Tambah Testimoni'}
              </h3>
              <button onClick={() => setIsTestiModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleSaveTesti} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Nama Pelanggan</label>
                  <input
                    type="text"
                    required
                    value={testiForm.name}
                    onChange={(e) => setTestiForm({ ...testiForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Lokasi (cth: Shah Alam)</label>
                  <input
                    type="text"
                    value={testiForm.location}
                    onChange={(e) => setTestiForm({ ...testiForm, location: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Platform Sumber</label>
                  <select
                    value={testiForm.platform}
                    onChange={(e) => setTestiForm({ ...testiForm, platform: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="google">Google Review</option>
                    <option value="tiktok">TikTok</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Penilaian (Bintang 1-5)</label>
                  <select
                    value={testiForm.rating}
                    onChange={(e) => setTestiForm({ ...testiForm, rating: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  >
                    <option value={5}>5 Bintang (Cemerlang)</option>
                    <option value={4}>4 Bintang (Bagus)</option>
                    <option value={3}>3 Bintang</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Ayat Ulasan Pelanggan</label>
                <textarea
                  rows={4}
                  required
                  value={testiForm.review}
                  onChange={(e) => setTestiForm({ ...testiForm, review: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>
              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTestiModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
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
