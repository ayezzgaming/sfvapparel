'use client';

import { useEffect, useCallback, useSyncExternalStore } from 'react';
import {
  ApparelCut,
  Customer,
  Design,
  DtfDimension,
  FabricMaterial,
  Order,
  OrderStatus,
  QuantityTierDiscount,
  CmsHeroBanner,
  CmsService,
  CmsProductionVideo,
  CmsProductionGalleryItem,
  CmsTestimonial,
  CmsSloganQuote,
  CmsCompanySettings,
  CmsPolicy,
  CmsThemeSettings,
  CmsThemePresetKey,
} from '@/types/database';
import { getDesignsDb, saveDesignDb, deleteDesignDb } from '@/app/actions/designActions';
import {
  INITIAL_APPAREL_CUTS,
  INITIAL_CUSTOMERS,
  INITIAL_DESIGNS,
  INITIAL_DTF_DIMENSIONS,
  INITIAL_FABRIC_MATERIALS,
  INITIAL_ORDERS,
  INITIAL_QUANTITY_TIERS,
  INITIAL_CMS_HERO_BANNERS,
  INITIAL_CMS_SERVICES,
  INITIAL_CMS_PRODUCTION_VIDEOS,
  INITIAL_CMS_PRODUCTION_GALLERY,
  INITIAL_CMS_TESTIMONIALS,
  INITIAL_CMS_SLOGAN_QUOTE,
  INITIAL_CMS_COMPANY_SETTINGS,
  INITIAL_CMS_POLICIES,
  INITIAL_CMS_THEME_SETTINGS,
  THEME_PRESETS,
} from './seed-data';

const STORAGE_KEYS = {
  DESIGNS: 'svf_designs_v3',
  FABRICS: 'svf_fabrics_v3',
  CUTS: 'svf_cuts_v3',
  DTF_DIMS: 'svf_dtf_dims_v3',
  TIERS: 'svf_tiers_v3',
  CUSTOMERS: 'svf_customers_v3',
  ORDERS: 'svf_orders_v3',
  FAVORITES: 'svf_favorites_v3',
  HERO_BANNERS: 'svf_cms_hero_v3',
  SERVICES: 'svf_cms_services_v3',
  VIDEOS: 'svf_cms_videos_v3',
  GALLERY: 'svf_cms_gallery_v3',
  TESTIMONIALS: 'svf_cms_testi_v3',
  SLOGAN: 'svf_cms_slogan_v3',
  COMPANY: 'svf_cms_company_v3',
  POLICIES: 'svf_cms_policies_v3',
  THEME: 'svf_cms_theme_v3',
};

function getLocalData<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalData<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

interface AppStoreState {
  designs: Design[];
  fabrics: FabricMaterial[];
  cuts: ApparelCut[];
  dtfDimensions: DtfDimension[];
  tiers: QuantityTierDiscount[];
  customers: Customer[];
  orders: Order[];
  favorites: string[];
  heroBanners: CmsHeroBanner[];
  services: CmsService[];
  productionVideos: CmsProductionVideo[];
  productionGallery: CmsProductionGalleryItem[];
  testimonials: CmsTestimonial[];
  sloganQuote: CmsSloganQuote;
  companySettings: CmsCompanySettings;
  policies: Record<'privacy' | 'terms' | 'warranty' | 'shipping', CmsPolicy>;
  themeSettings: CmsThemeSettings;
  isInitialized: boolean;
}

let storeState: AppStoreState = {
  designs: INITIAL_DESIGNS,
  fabrics: INITIAL_FABRIC_MATERIALS,
  cuts: INITIAL_APPAREL_CUTS,
  dtfDimensions: INITIAL_DTF_DIMENSIONS,
  tiers: INITIAL_QUANTITY_TIERS,
  customers: INITIAL_CUSTOMERS,
  orders: INITIAL_ORDERS,
  favorites: [],
  heroBanners: INITIAL_CMS_HERO_BANNERS,
  services: INITIAL_CMS_SERVICES,
  productionVideos: INITIAL_CMS_PRODUCTION_VIDEOS,
  productionGallery: INITIAL_CMS_PRODUCTION_GALLERY,
  testimonials: INITIAL_CMS_TESTIMONIALS,
  sloganQuote: INITIAL_CMS_SLOGAN_QUOTE,
  companySettings: INITIAL_CMS_COMPANY_SETTINGS,
  policies: INITIAL_CMS_POLICIES,
  themeSettings: INITIAL_CMS_THEME_SETTINGS,
  isInitialized: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function initStoreIfNeeded() {
  if (typeof window === 'undefined' || storeState.isInitialized) return;
  storeState = {
    designs: getLocalData(STORAGE_KEYS.DESIGNS, INITIAL_DESIGNS),
    fabrics: getLocalData(STORAGE_KEYS.FABRICS, INITIAL_FABRIC_MATERIALS),
    cuts: getLocalData(STORAGE_KEYS.CUTS, INITIAL_APPAREL_CUTS),
    dtfDimensions: getLocalData(STORAGE_KEYS.DTF_DIMS, INITIAL_DTF_DIMENSIONS),
    tiers: getLocalData(STORAGE_KEYS.TIERS, INITIAL_QUANTITY_TIERS),
    customers: getLocalData(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
    orders: getLocalData(STORAGE_KEYS.ORDERS, INITIAL_ORDERS),
    favorites: getLocalData(STORAGE_KEYS.FAVORITES, []),
    heroBanners: getLocalData(STORAGE_KEYS.HERO_BANNERS, INITIAL_CMS_HERO_BANNERS),
    services: getLocalData(STORAGE_KEYS.SERVICES, INITIAL_CMS_SERVICES),
    productionVideos: getLocalData(STORAGE_KEYS.VIDEOS, INITIAL_CMS_PRODUCTION_VIDEOS),
    productionGallery: getLocalData(STORAGE_KEYS.GALLERY, INITIAL_CMS_PRODUCTION_GALLERY),
    testimonials: getLocalData(STORAGE_KEYS.TESTIMONIALS, INITIAL_CMS_TESTIMONIALS),
    sloganQuote: getLocalData(STORAGE_KEYS.SLOGAN, INITIAL_CMS_SLOGAN_QUOTE),
    companySettings: getLocalData(STORAGE_KEYS.COMPANY, INITIAL_CMS_COMPANY_SETTINGS),
    policies: getLocalData(STORAGE_KEYS.POLICIES, INITIAL_CMS_POLICIES),
    themeSettings: (() => {
      const saved = getLocalData<CmsThemeSettings>(STORAGE_KEYS.THEME, INITIAL_CMS_THEME_SETTINGS);
      if (saved && (saved.header_bg === '#0052FF' || saved.header_style === 'solid_blue')) {
        const reset: CmsThemeSettings = {
          ...INITIAL_CMS_THEME_SETTINGS,
          ...saved,
          preset: 'clean_white',
          header_bg: '#FFFFFF',
          header_style: 'frosted_white',
          header_logo_mode: 'original_blue',
        };
        setLocalData(STORAGE_KEYS.THEME, reset);
        return reset;
      }
      return saved || INITIAL_CMS_THEME_SETTINGS;
    })(),
    isInitialized: true,
  };
  notify();

  // Async load shared designs from Supabase DB
  getDesignsDb().then((res) => {
    if (res.success && res.designs && res.designs.length > 0) {
      storeState = {
        ...storeState,
        designs: res.designs,
      };
      setLocalData(STORAGE_KEYS.DESIGNS, res.designs);
      notify();
    }
  }).catch(() => {});
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (!e.newValue) return;
    try {
      if (e.key === STORAGE_KEYS.DESIGNS) storeState.designs = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.FABRICS) storeState.fabrics = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.CUTS) storeState.cuts = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.DTF_DIMS) storeState.dtfDimensions = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.TIERS) storeState.tiers = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.ORDERS) storeState.orders = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.CUSTOMERS) storeState.customers = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.FAVORITES) storeState.favorites = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.HERO_BANNERS) storeState.heroBanners = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.SERVICES) storeState.services = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.VIDEOS) storeState.productionVideos = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.GALLERY) storeState.productionGallery = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.TESTIMONIALS) storeState.testimonials = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.SLOGAN) storeState.sloganQuote = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.COMPANY) storeState.companySettings = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.POLICIES) storeState.policies = JSON.parse(e.newValue);
      if (e.key === STORAGE_KEYS.THEME) storeState.themeSettings = JSON.parse(e.newValue);
      notify();
    } catch {
      // Ignore parse error
    }
  });
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot() {
  return storeState;
}

const serverSnapshot: AppStoreState = {
  designs: INITIAL_DESIGNS,
  fabrics: INITIAL_FABRIC_MATERIALS,
  cuts: INITIAL_APPAREL_CUTS,
  dtfDimensions: INITIAL_DTF_DIMENSIONS,
  tiers: INITIAL_QUANTITY_TIERS,
  customers: INITIAL_CUSTOMERS,
  orders: INITIAL_ORDERS,
  favorites: [],
  heroBanners: INITIAL_CMS_HERO_BANNERS,
  services: INITIAL_CMS_SERVICES,
  productionVideos: INITIAL_CMS_PRODUCTION_VIDEOS,
  productionGallery: INITIAL_CMS_PRODUCTION_GALLERY,
  testimonials: INITIAL_CMS_TESTIMONIALS,
  sloganQuote: INITIAL_CMS_SLOGAN_QUOTE,
  companySettings: INITIAL_CMS_COMPANY_SETTINGS,
  policies: INITIAL_CMS_POLICIES,
  themeSettings: INITIAL_CMS_THEME_SETTINGS,
  isInitialized: false,
};

function getServerSnapshot() {
  return serverSnapshot;
}

export function useAppStore() {
  useEffect(() => {
    initStoreIfNeeded();
  }, []);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Favorites
  const toggleFavorite = useCallback((designId: string) => {
    initStoreIfNeeded();
    const nextFavorites = storeState.favorites.includes(designId)
      ? storeState.favorites.filter((id) => id !== designId)
      : [...storeState.favorites, designId];
    storeState = { ...storeState, favorites: nextFavorites };
    setLocalData(STORAGE_KEYS.FAVORITES, nextFavorites);
    notify();
  }, []);

  const isFavorite = useCallback((designId: string) => {
    return state.favorites.includes(designId);
  }, [state.favorites]);

  // Orders
  const addOrder = useCallback((newOrderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) => {
    initStoreIfNeeded();
    const nextOrderNum = `SFV-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const newOrder: Order = {
      ...newOrderData,
      id: `ord-${Date.now()}`,
      order_number: nextOrderNum,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const nextOrders = [newOrder, ...storeState.orders];
    storeState = { ...storeState, orders: nextOrders };
    setLocalData(STORAGE_KEYS.ORDERS, nextOrders);
    notify();
    return newOrder;
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus, trackingNumber?: string, notes?: string) => {
    initStoreIfNeeded();
    const nextOrders = storeState.orders.map((ord) => {
      if (ord.id === orderId || ord.order_number === orderId) {
        return {
          ...ord,
          status,
          tracking_number: trackingNumber !== undefined ? trackingNumber : ord.tracking_number,
          production_notes: notes !== undefined ? notes : ord.production_notes,
          updated_at: new Date().toISOString(),
        };
      }
      return ord;
    });
    storeState = { ...storeState, orders: nextOrders };
    setLocalData(STORAGE_KEYS.ORDERS, nextOrders);
    notify();
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    initStoreIfNeeded();
    const nextOrders = storeState.orders.filter((ord) => ord.id !== orderId && ord.order_number !== orderId);
    storeState = { ...storeState, orders: nextOrders };
    setLocalData(STORAGE_KEYS.ORDERS, nextOrders);
    notify();
  }, []);

  // Catalog Designs
  const addDesign = useCallback((design: Omit<Design, 'id'>) => {
    initStoreIfNeeded();
    const newDesign: Design = { ...design, id: `des-${Date.now()}` };
    const nextDesigns = [newDesign, ...storeState.designs];
    storeState = { ...storeState, designs: nextDesigns };
    setLocalData(STORAGE_KEYS.DESIGNS, nextDesigns);
    notify();
    saveDesignDb(newDesign).catch(() => {});
    return newDesign;
  }, []);

  const updateDesign = useCallback((id: string, updates: Partial<Design>) => {
    initStoreIfNeeded();
    let updatedDesign: Design | null = null;
    const nextDesigns = storeState.designs.map((d) => {
      if (d.id === id) {
        updatedDesign = { ...d, ...updates };
        return updatedDesign;
      }
      return d;
    });
    storeState = { ...storeState, designs: nextDesigns };
    setLocalData(STORAGE_KEYS.DESIGNS, nextDesigns);
    notify();
    if (updatedDesign) {
      saveDesignDb(updatedDesign).catch(() => {});
    }
  }, []);

  const deleteDesign = useCallback((id: string) => {
    initStoreIfNeeded();
    const nextDesigns = storeState.designs.filter((d) => d.id !== id);
    storeState = { ...storeState, designs: nextDesigns };
    setLocalData(STORAGE_KEYS.DESIGNS, nextDesigns);
    notify();
    deleteDesignDb(id).catch(() => {});
  }, []);

  // Pricing Rules
  const updateFabric = useCallback((id: string, updates: Partial<FabricMaterial>) => {
    initStoreIfNeeded();
    const next = storeState.fabrics.map((f) => (f.id === id ? { ...f, ...updates } : f));
    storeState = { ...storeState, fabrics: next };
    setLocalData(STORAGE_KEYS.FABRICS, next);
    notify();
  }, []);

  const updateCut = useCallback((id: string, updates: Partial<ApparelCut>) => {
    initStoreIfNeeded();
    const next = storeState.cuts.map((c) => (c.id === id ? { ...c, ...updates } : c));
    storeState = { ...storeState, cuts: next };
    setLocalData(STORAGE_KEYS.CUTS, next);
    notify();
  }, []);

  const updateDtfDimension = useCallback((id: string, updates: Partial<DtfDimension>) => {
    initStoreIfNeeded();
    const next = storeState.dtfDimensions.map((d) => (d.id === id ? { ...d, ...updates } : d));
    storeState = { ...storeState, dtfDimensions: next };
    setLocalData(STORAGE_KEYS.DTF_DIMS, next);
    notify();
  }, []);

  const updateQuantityTier = useCallback((id: string, updates: Partial<QuantityTierDiscount>) => {
    initStoreIfNeeded();
    const next = storeState.tiers.map((t) => (t.id === id ? { ...t, ...updates } : t));
    storeState = { ...storeState, tiers: next };
    setLocalData(STORAGE_KEYS.TIERS, next);
    notify();
  }, []);

  // ==========================================
  // CMS MUTATORS (HERO, SERVICES, VIDEOS, GALLERY, TESTIMONIALS, SETTINGS, POLICIES)
  // ==========================================

  // Hero Banners
  const addHeroBanner = useCallback((banner: Omit<CmsHeroBanner, 'id'>) => {
    initStoreIfNeeded();
    const newBanner: CmsHeroBanner = { ...banner, id: `hero-${Date.now()}` };
    const next = [...storeState.heroBanners, newBanner];
    storeState = { ...storeState, heroBanners: next };
    setLocalData(STORAGE_KEYS.HERO_BANNERS, next);
    notify();
    return newBanner;
  }, []);

  const updateHeroBanner = useCallback((id: string, updates: Partial<CmsHeroBanner>) => {
    initStoreIfNeeded();
    const next = storeState.heroBanners.map((b) => (b.id === id ? { ...b, ...updates } : b));
    storeState = { ...storeState, heroBanners: next };
    setLocalData(STORAGE_KEYS.HERO_BANNERS, next);
    notify();
  }, []);

  const deleteHeroBanner = useCallback((id: string) => {
    initStoreIfNeeded();
    const next = storeState.heroBanners.filter((b) => b.id !== id);
    storeState = { ...storeState, heroBanners: next };
    setLocalData(STORAGE_KEYS.HERO_BANNERS, next);
    notify();
  }, []);

  // Services
  const addService = useCallback((service: Omit<CmsService, 'id'>) => {
    initStoreIfNeeded();
    const newService: CmsService = { ...service, id: `srv-${Date.now()}` };
    const next = [...storeState.services, newService];
    storeState = { ...storeState, services: next };
    setLocalData(STORAGE_KEYS.SERVICES, next);
    notify();
    return newService;
  }, []);

  const updateService = useCallback((id: string, updates: Partial<CmsService>) => {
    initStoreIfNeeded();
    const next = storeState.services.map((s) => (s.id === id ? { ...s, ...updates } : s));
    storeState = { ...storeState, services: next };
    setLocalData(STORAGE_KEYS.SERVICES, next);
    notify();
  }, []);

  const deleteService = useCallback((id: string) => {
    initStoreIfNeeded();
    const next = storeState.services.filter((s) => s.id !== id);
    storeState = { ...storeState, services: next };
    setLocalData(STORAGE_KEYS.SERVICES, next);
    notify();
  }, []);

  // Production Videos
  const addProductionVideo = useCallback((video: Omit<CmsProductionVideo, 'id'>) => {
    initStoreIfNeeded();
    const newVid: CmsProductionVideo = { ...video, id: `vid-${Date.now()}` };
    const next = [...storeState.productionVideos, newVid];
    storeState = { ...storeState, productionVideos: next };
    setLocalData(STORAGE_KEYS.VIDEOS, next);
    notify();
    return newVid;
  }, []);

  const updateProductionVideo = useCallback((id: string, updates: Partial<CmsProductionVideo>) => {
    initStoreIfNeeded();
    const next = storeState.productionVideos.map((v) => (v.id === id ? { ...v, ...updates } : v));
    storeState = { ...storeState, productionVideos: next };
    setLocalData(STORAGE_KEYS.VIDEOS, next);
    notify();
  }, []);

  const deleteProductionVideo = useCallback((id: string) => {
    initStoreIfNeeded();
    const next = storeState.productionVideos.filter((v) => v.id !== id);
    storeState = { ...storeState, productionVideos: next };
    setLocalData(STORAGE_KEYS.VIDEOS, next);
    notify();
  }, []);

  // Production Gallery
  const addGalleryItem = useCallback((item: Omit<CmsProductionGalleryItem, 'id'>) => {
    initStoreIfNeeded();
    const newItem: CmsProductionGalleryItem = { ...item, id: `gal-${Date.now()}` };
    const next = [...storeState.productionGallery, newItem];
    storeState = { ...storeState, productionGallery: next };
    setLocalData(STORAGE_KEYS.GALLERY, next);
    notify();
    return newItem;
  }, []);

  const updateGalleryItem = useCallback((id: string, updates: Partial<CmsProductionGalleryItem>) => {
    initStoreIfNeeded();
    const next = storeState.productionGallery.map((g) => (g.id === id ? { ...g, ...updates } : g));
    storeState = { ...storeState, productionGallery: next };
    setLocalData(STORAGE_KEYS.GALLERY, next);
    notify();
  }, []);

  const deleteGalleryItem = useCallback((id: string) => {
    initStoreIfNeeded();
    const next = storeState.productionGallery.filter((g) => g.id !== id);
    storeState = { ...storeState, productionGallery: next };
    setLocalData(STORAGE_KEYS.GALLERY, next);
    notify();
  }, []);

  // Testimonials
  const addTestimonial = useCallback((testi: Omit<CmsTestimonial, 'id'>) => {
    initStoreIfNeeded();
    const newTesti: CmsTestimonial = { ...testi, id: `testi-${Date.now()}` };
    const next = [...storeState.testimonials, newTesti];
    storeState = { ...storeState, testimonials: next };
    setLocalData(STORAGE_KEYS.TESTIMONIALS, next);
    notify();
    return newTesti;
  }, []);

  const updateTestimonial = useCallback((id: string, updates: Partial<CmsTestimonial>) => {
    initStoreIfNeeded();
    const next = storeState.testimonials.map((t) => (t.id === id ? { ...t, ...updates } : t));
    storeState = { ...storeState, testimonials: next };
    setLocalData(STORAGE_KEYS.TESTIMONIALS, next);
    notify();
  }, []);

  const deleteTestimonial = useCallback((id: string) => {
    initStoreIfNeeded();
    const next = storeState.testimonials.filter((t) => t.id !== id);
    storeState = { ...storeState, testimonials: next };
    setLocalData(STORAGE_KEYS.TESTIMONIALS, next);
    notify();
  }, []);

  // Slogan & Quote
  const updateSloganQuote = useCallback((updates: Partial<CmsSloganQuote>) => {
    initStoreIfNeeded();
    const next = { ...storeState.sloganQuote, ...updates };
    storeState = { ...storeState, sloganQuote: next };
    setLocalData(STORAGE_KEYS.SLOGAN, next);
    notify();
  }, []);

  // Company Settings
  const updateCompanySettings = useCallback((updates: Partial<CmsCompanySettings>) => {
    initStoreIfNeeded();
    const next = { ...storeState.companySettings, ...updates };
    storeState = { ...storeState, companySettings: next };
    setLocalData(STORAGE_KEYS.COMPANY, next);
    notify();
  }, []);

  // Policies
  const updatePolicy = useCallback((key: 'privacy' | 'terms' | 'warranty' | 'shipping', updates: Partial<CmsPolicy>) => {
    initStoreIfNeeded();
    const next = {
      ...storeState.policies,
      [key]: { ...storeState.policies[key], ...updates },
    };
    storeState = { ...storeState, policies: next };
    setLocalData(STORAGE_KEYS.POLICIES, next);
    notify();
  }, []);

  // Theme Settings
  const updateThemeSettings = useCallback((updates: Partial<CmsThemeSettings>) => {
    initStoreIfNeeded();
    const next: CmsThemeSettings = {
      ...storeState.themeSettings,
      ...updates,
    };
    storeState = { ...storeState, themeSettings: next };
    setLocalData(STORAGE_KEYS.THEME, next);
    notify();
  }, []);

  const applyThemePreset = useCallback((presetKey: 'hybrid' | 'clean_white' | 'full_blue' | 'custom') => {
    initStoreIfNeeded();
    if (presetKey === 'custom') return;
    const preset = THEME_PRESETS[presetKey];
    if (!preset) return;
    const next: CmsThemeSettings = {
      ...preset,
      preset: presetKey,
    };
    storeState = { ...storeState, themeSettings: next };
    setLocalData(STORAGE_KEYS.THEME, next);
    notify();
  }, []);

  // Reset to seed data
  const resetToSeedData = useCallback(() => {
    storeState = {
      designs: INITIAL_DESIGNS,
      fabrics: INITIAL_FABRIC_MATERIALS,
      cuts: INITIAL_APPAREL_CUTS,
      dtfDimensions: INITIAL_DTF_DIMENSIONS,
      tiers: INITIAL_QUANTITY_TIERS,
      customers: INITIAL_CUSTOMERS,
      orders: INITIAL_ORDERS,
      favorites: [],
      heroBanners: INITIAL_CMS_HERO_BANNERS,
      services: INITIAL_CMS_SERVICES,
      productionVideos: INITIAL_CMS_PRODUCTION_VIDEOS,
      productionGallery: INITIAL_CMS_PRODUCTION_GALLERY,
      testimonials: INITIAL_CMS_TESTIMONIALS,
      sloganQuote: INITIAL_CMS_SLOGAN_QUOTE,
      companySettings: INITIAL_CMS_COMPANY_SETTINGS,
      policies: INITIAL_CMS_POLICIES,
      themeSettings: INITIAL_CMS_THEME_SETTINGS,
      isInitialized: true,
    };
    setLocalData(STORAGE_KEYS.DESIGNS, INITIAL_DESIGNS);
    setLocalData(STORAGE_KEYS.FABRICS, INITIAL_FABRIC_MATERIALS);
    setLocalData(STORAGE_KEYS.CUTS, INITIAL_APPAREL_CUTS);
    setLocalData(STORAGE_KEYS.DTF_DIMS, INITIAL_DTF_DIMENSIONS);
    setLocalData(STORAGE_KEYS.TIERS, INITIAL_QUANTITY_TIERS);
    setLocalData(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setLocalData(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
    setLocalData(STORAGE_KEYS.FAVORITES, []);
    setLocalData(STORAGE_KEYS.HERO_BANNERS, INITIAL_CMS_HERO_BANNERS);
    setLocalData(STORAGE_KEYS.SERVICES, INITIAL_CMS_SERVICES);
    setLocalData(STORAGE_KEYS.VIDEOS, INITIAL_CMS_PRODUCTION_VIDEOS);
    setLocalData(STORAGE_KEYS.GALLERY, INITIAL_CMS_PRODUCTION_GALLERY);
    setLocalData(STORAGE_KEYS.TESTIMONIALS, INITIAL_CMS_TESTIMONIALS);
    setLocalData(STORAGE_KEYS.SLOGAN, INITIAL_CMS_SLOGAN_QUOTE);
    setLocalData(STORAGE_KEYS.COMPANY, INITIAL_CMS_COMPANY_SETTINGS);
    setLocalData(STORAGE_KEYS.POLICIES, INITIAL_CMS_POLICIES);
    setLocalData(STORAGE_KEYS.THEME, INITIAL_CMS_THEME_SETTINGS);
    notify();
  }, []);

  return {
    isInitialized: state.isInitialized,
    designs: state.designs,
    fabrics: state.fabrics,
    cuts: state.cuts,
    dtfDimensions: state.dtfDimensions,
    tiers: state.tiers,
    customers: state.customers,
    orders: state.orders,
    favorites: state.favorites,
    heroBanners: state.heroBanners,
    services: state.services,
    productionVideos: state.productionVideos,
    productionGallery: state.productionGallery,
    testimonials: state.testimonials,
    sloganQuote: state.sloganQuote,
    companySettings: state.companySettings,
    policies: state.policies,
    themeSettings: state.themeSettings,
    toggleFavorite,
    isFavorite,
    addOrder,
    deleteOrder,
    updateOrderStatus,
    addDesign,
    updateDesign,
    deleteDesign,
    updateFabric,
    updateCut,
    updateDtfDimension,
    updateQuantityTier,
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
  };
}


