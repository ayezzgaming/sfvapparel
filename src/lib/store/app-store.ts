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
  getCmsDataDb,
  saveHeroBannerDb,
  deleteHeroBannerDb,
  saveServiceDb,
  deleteServiceDb,
  saveProductionVideoDb,
  deleteProductionVideoDb,
  saveProductionGalleryDb,
  deleteProductionGalleryDb,
  saveTestimonialDb,
  deleteTestimonialDb,
  saveSloganQuoteDb,
  saveCompanySettingsDb,
  savePolicyDb,
  seedAllCmsToDb,
} from '@/app/actions/cmsActions';
import {
  getMasterPricingDb,
  saveFabricDb,
  saveCutDb,
  saveDtfDimensionDb,
} from '@/app/actions/pricingActions';
import {
  INITIAL_APPAREL_CUTS,
  INITIAL_CUSTOMERS,
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
  isLoadingDesigns: boolean;
  isLoadingCms: boolean;
}

let storeState: AppStoreState = {
  designs: [], // Pure Supabase DB data only
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
  isLoadingDesigns: false,
  isLoadingCms: false,
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

/**
 * Fetch and sync all Cloud DB items (Designs, CMS, Pricing)
 */
async function fetchAndSyncAllDb() {
  storeState = { ...storeState, isLoadingDesigns: true, isLoadingCms: true };
  notify();

  try {
    // 1. Fetch Designs
    const designsPromise = getDesignsDb().then((res) => {
      if (res.success && Array.isArray(res.designs)) {
        storeState = { ...storeState, designs: res.designs };
      }
    }).catch((e) => console.error('Error fetching designs:', e));

    // 2. Fetch CMS Data
    const cmsPromise = getCmsDataDb().then((res) => {
      if (res.success && res.data) {
        const { heroBanners, services, productionVideos, productionGallery, testimonials, sloganQuote, companySettings, policies } = res.data;
        storeState = {
          ...storeState,
          heroBanners: heroBanners.length > 0 ? heroBanners : storeState.heroBanners,
          services: services.length > 0 ? services : storeState.services,
          productionVideos: productionVideos.length > 0 ? productionVideos : storeState.productionVideos,
          productionGallery: productionGallery.length > 0 ? productionGallery : storeState.productionGallery,
          testimonials: testimonials.length > 0 ? testimonials : storeState.testimonials,
          sloganQuote: sloganQuote || storeState.sloganQuote,
          companySettings: companySettings || storeState.companySettings,
          policies: policies || storeState.policies,
        };
        // Update local cache
        setLocalData(STORAGE_KEYS.HERO_BANNERS, storeState.heroBanners);
        setLocalData(STORAGE_KEYS.SERVICES, storeState.services);
        setLocalData(STORAGE_KEYS.VIDEOS, storeState.productionVideos);
        setLocalData(STORAGE_KEYS.GALLERY, storeState.productionGallery);
        setLocalData(STORAGE_KEYS.TESTIMONIALS, storeState.testimonials);
        setLocalData(STORAGE_KEYS.SLOGAN, storeState.sloganQuote);
        setLocalData(STORAGE_KEYS.COMPANY, storeState.companySettings);
        setLocalData(STORAGE_KEYS.POLICIES, storeState.policies);
      }
    }).catch((e) => console.error('Error fetching CMS data:', e));

    // 3. Fetch Master Pricing
    const pricingPromise = getMasterPricingDb().then((res) => {
      if (res.success && res.data) {
        const { fabrics, cuts, dtfDimensions } = res.data;
        storeState = {
          ...storeState,
          fabrics: fabrics.length > 0 ? fabrics : storeState.fabrics,
          cuts: cuts.length > 0 ? cuts : storeState.cuts,
          dtfDimensions: dtfDimensions.length > 0 ? dtfDimensions : storeState.dtfDimensions,
        };
        setLocalData(STORAGE_KEYS.FABRICS, storeState.fabrics);
        setLocalData(STORAGE_KEYS.CUTS, storeState.cuts);
        setLocalData(STORAGE_KEYS.DTF_DIMS, storeState.dtfDimensions);
      }
    }).catch((e) => console.error('Error fetching pricing data:', e));

    await Promise.all([designsPromise, cmsPromise, pricingPromise]);
  } finally {
    storeState = { ...storeState, isLoadingDesigns: false, isLoadingCms: false };
    notify();
  }
}

function initStoreIfNeeded() {
  if (typeof window === 'undefined' || storeState.isInitialized) return;
  storeState = {
    designs: [],
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
    isLoadingDesigns: true,
    isLoadingCms: true,
  };
  notify();

  // Async load fresh shared designs & CMS data from Cloud DB
  fetchAndSyncAllDb();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (!e.newValue) return;
    try {
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
  designs: [],
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
  isLoadingDesigns: false,
  isLoadingCms: false,
};

export function useAppStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => serverSnapshot);

  useEffect(() => {
    initStoreIfNeeded();
  }, []);

  const refreshAllDb = useCallback(async () => {
    await fetchAndSyncAllDb();
  }, []);

  const refreshDesigns = useCallback(async () => {
    await fetchAndSyncAllDb();
  }, []);

  const setDesigns = useCallback((designs: Design[]) => {
    initStoreIfNeeded();
    storeState = { ...storeState, designs };
    notify();
  }, []);

  const toggleFavorite = useCallback((designId: string) => {
    initStoreIfNeeded();
    const current = storeState.favorites;
    const exists = current.includes(designId);
    const next = exists ? current.filter((id) => id !== designId) : [...current, designId];
    storeState = { ...storeState, favorites: next };
    setLocalData(STORAGE_KEYS.FAVORITES, next);
    notify();
  }, []);

  const isFavorite = useCallback(
    (designId: string) => state.favorites.includes(designId),
    [state.favorites]
  );

  const addOrder = useCallback((orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) => {
    initStoreIfNeeded();
    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newOrder: Order = {
      ...orderData,
      id: `ord-${timestamp}`,
      order_number: `ORD-${randomSuffix}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const next = [newOrder, ...storeState.orders];
    storeState = { ...storeState, orders: next };
    setLocalData(STORAGE_KEYS.ORDERS, next);
    notify();
    return newOrder;
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    initStoreIfNeeded();
    const next = storeState.orders.filter((o) => o.id !== orderId);
    storeState = { ...storeState, orders: next };
    setLocalData(STORAGE_KEYS.ORDERS, next);
    notify();
  }, []);

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus, trackingNumber?: string, notes?: string) => {
      initStoreIfNeeded();
      const next = storeState.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              ...(trackingNumber !== undefined ? { tracking_number: trackingNumber } : {}),
              ...(notes !== undefined ? { admin_notes: notes } : {}),
              updated_at: new Date().toISOString(),
            }
          : o
      );
      storeState = { ...storeState, orders: next };
      setLocalData(STORAGE_KEYS.ORDERS, next);
      notify();
    },
    []
  );

  // Design CRUD with Cloud DB
  const addDesign = useCallback(async (design: Omit<Design, 'id'>) => {
    initStoreIfNeeded();
    const tempId = `temp-${Date.now()}`;
    const localNewDesign: Design = { ...design, id: tempId };
    storeState = { ...storeState, designs: [localNewDesign, ...storeState.designs] };
    notify();

    try {
      const res = await saveDesignDb(design);
      if (res.success && res.data) {
        storeState = {
          ...storeState,
          designs: storeState.designs.map((d) => (d.id === tempId ? res.data! : d)),
        };
        notify();
        return res.data;
      }
      return localNewDesign;
    } catch (err) {
      console.error('Failed to add design to Supabase:', err);
      return localNewDesign;
    }
  }, []);

  const updateDesign = useCallback(async (id: string, updates: Partial<Design>) => {
    initStoreIfNeeded();
    const target = storeState.designs.find((d) => d.id === id);
    if (!target) return;
    const merged = { ...target, ...updates };
    storeState = {
      ...storeState,
      designs: storeState.designs.map((d) => (d.id === id ? merged : d)),
    };
    notify();

    try {
      await saveDesignDb(merged);
    } catch (err) {
      console.error('Failed to update design in Supabase:', err);
    }
  }, []);

  const deleteDesign = useCallback(async (id: string) => {
    initStoreIfNeeded();
    storeState = {
      ...storeState,
      designs: storeState.designs.filter((d) => d.id !== id),
    };
    notify();

    try {
      await deleteDesignDb(id);
    } catch (err) {
      console.error('Failed to delete design from Supabase:', err);
    }
  }, []);

  // Pricing Rules CRUD with Cloud DB
  const updateFabric = useCallback(async (id: string, updates: Partial<FabricMaterial>) => {
    initStoreIfNeeded();
    const next = storeState.fabrics.map((f) => (f.id === id ? { ...f, ...updates } : f));
    storeState = { ...storeState, fabrics: next };
    setLocalData(STORAGE_KEYS.FABRICS, next);
    notify();

    const target = next.find((f) => f.id === id);
    if (target) {
      saveFabricDb(target).catch((e) => console.error('Error saving fabric to DB:', e));
    }
  }, []);

  const updateCut = useCallback(async (id: string, updates: Partial<ApparelCut>) => {
    initStoreIfNeeded();
    const next = storeState.cuts.map((c) => (c.id === id ? { ...c, ...updates } : c));
    storeState = { ...storeState, cuts: next };
    setLocalData(STORAGE_KEYS.CUTS, next);
    notify();

    const target = next.find((c) => c.id === id);
    if (target) {
      saveCutDb(target).catch((e) => console.error('Error saving cut to DB:', e));
    }
  }, []);

  const updateDtfDimension = useCallback(async (id: string, updates: Partial<DtfDimension>) => {
    initStoreIfNeeded();
    const next = storeState.dtfDimensions.map((d) => (d.id === id ? { ...d, ...updates } : d));
    storeState = { ...storeState, dtfDimensions: next };
    setLocalData(STORAGE_KEYS.DTF_DIMS, next);
    notify();

    const target = next.find((d) => d.id === id);
    if (target) {
      saveDtfDimensionDb(target).catch((e) => console.error('Error saving DTF dim to DB:', e));
    }
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
  const addHeroBanner = useCallback(async (banner: Omit<CmsHeroBanner, 'id'>) => {
    initStoreIfNeeded();
    const tempId = `temp-${Date.now()}`;
    const newBanner: CmsHeroBanner = { ...banner, id: tempId };
    const next = [...storeState.heroBanners, newBanner];
    storeState = { ...storeState, heroBanners: next };
    setLocalData(STORAGE_KEYS.HERO_BANNERS, next);
    notify();

    try {
      const res = await saveHeroBannerDb(banner);
      if (res.success && res.banner) {
        const updated = storeState.heroBanners.map((b) => (b.id === tempId ? res.banner! : b));
        storeState = { ...storeState, heroBanners: updated };
        setLocalData(STORAGE_KEYS.HERO_BANNERS, updated);
        notify();
        return res.banner;
      }
    } catch (e) {
      console.error('Failed to save Hero Banner to DB:', e);
    }
    return newBanner;
  }, []);

  const updateHeroBanner = useCallback(async (id: string, updates: Partial<CmsHeroBanner>) => {
    initStoreIfNeeded();
    const next = storeState.heroBanners.map((b) => (b.id === id ? { ...b, ...updates } : b));
    storeState = { ...storeState, heroBanners: next };
    setLocalData(STORAGE_KEYS.HERO_BANNERS, next);
    notify();

    try {
      const target = next.find((b) => b.id === id);
      if (target) {
        const res = await saveHeroBannerDb({ ...target, ...updates, id });
        if (res.success && res.banner) {
          const synced = storeState.heroBanners.map((b) => (b.id === id ? res.banner! : b));
          storeState = { ...storeState, heroBanners: synced };
          setLocalData(STORAGE_KEYS.HERO_BANNERS, synced);
          notify();
        }
      }
    } catch (e) {
      console.error('Failed to update Hero Banner in DB:', e);
    }
  }, []);

  const deleteHeroBanner = useCallback(async (id: string) => {
    initStoreIfNeeded();
    const next = storeState.heroBanners.filter((b) => b.id !== id);
    storeState = { ...storeState, heroBanners: next };
    setLocalData(STORAGE_KEYS.HERO_BANNERS, next);
    notify();

    try {
      await deleteHeroBannerDb(id);
    } catch (e) {
      console.error('Failed to delete Hero Banner from DB:', e);
    }
  }, []);

  // Services
  const addService = useCallback(async (service: Omit<CmsService, 'id'>) => {
    initStoreIfNeeded();
    const tempId = `temp-${Date.now()}`;
    const newService: CmsService = { ...service, id: tempId };
    const next = [...storeState.services, newService];
    storeState = { ...storeState, services: next };
    setLocalData(STORAGE_KEYS.SERVICES, next);
    notify();

    try {
      const res = await saveServiceDb(service);
      if (res.success && res.service) {
        const updated = storeState.services.map((s) => (s.id === tempId ? res.service! : s));
        storeState = { ...storeState, services: updated };
        setLocalData(STORAGE_KEYS.SERVICES, updated);
        notify();
        return res.service;
      }
    } catch (e) {
      console.error('Failed to save Service to DB:', e);
    }
    return newService;
  }, []);

  const updateService = useCallback(async (id: string, updates: Partial<CmsService>) => {
    initStoreIfNeeded();
    const next = storeState.services.map((s) => (s.id === id ? { ...s, ...updates } : s));
    storeState = { ...storeState, services: next };
    setLocalData(STORAGE_KEYS.SERVICES, next);
    notify();

    try {
      const target = next.find((s) => s.id === id);
      if (target) {
        await saveServiceDb({ ...target, ...updates, id });
      }
    } catch (e) {
      console.error('Failed to update Service in DB:', e);
    }
  }, []);

  const deleteService = useCallback(async (id: string) => {
    initStoreIfNeeded();
    const next = storeState.services.filter((s) => s.id !== id);
    storeState = { ...storeState, services: next };
    setLocalData(STORAGE_KEYS.SERVICES, next);
    notify();

    try {
      await deleteServiceDb(id);
    } catch (e) {
      console.error('Failed to delete Service from DB:', e);
    }
  }, []);

  // Production Videos
  const addProductionVideo = useCallback(async (video: Omit<CmsProductionVideo, 'id'>) => {
    initStoreIfNeeded();
    const tempId = `temp-${Date.now()}`;
    const newVid: CmsProductionVideo = { ...video, id: tempId };
    const next = [...storeState.productionVideos, newVid];
    storeState = { ...storeState, productionVideos: next };
    setLocalData(STORAGE_KEYS.VIDEOS, next);
    notify();

    try {
      const res = await saveProductionVideoDb(video);
      if (res.success && res.video) {
        const updated = storeState.productionVideos.map((v) => (v.id === tempId ? res.video! : v));
        storeState = { ...storeState, productionVideos: updated };
        setLocalData(STORAGE_KEYS.VIDEOS, updated);
        notify();
        return res.video;
      }
    } catch (e) {
      console.error('Failed to save Video to DB:', e);
    }
    return newVid;
  }, []);

  const updateProductionVideo = useCallback(async (id: string, updates: Partial<CmsProductionVideo>) => {
    initStoreIfNeeded();
    const next = storeState.productionVideos.map((v) => (v.id === id ? { ...v, ...updates } : v));
    storeState = { ...storeState, productionVideos: next };
    setLocalData(STORAGE_KEYS.VIDEOS, next);
    notify();

    try {
      const target = next.find((v) => v.id === id);
      if (target) {
        await saveProductionVideoDb({ ...target, ...updates, id });
      }
    } catch (e) {
      console.error('Failed to update Video in DB:', e);
    }
  }, []);

  const deleteProductionVideo = useCallback(async (id: string) => {
    initStoreIfNeeded();
    const next = storeState.productionVideos.filter((v) => v.id !== id);
    storeState = { ...storeState, productionVideos: next };
    setLocalData(STORAGE_KEYS.VIDEOS, next);
    notify();

    try {
      await deleteProductionVideoDb(id);
    } catch (e) {
      console.error('Failed to delete Video from DB:', e);
    }
  }, []);

  // Production Gallery
  const addGalleryItem = useCallback(async (item: Omit<CmsProductionGalleryItem, 'id'>) => {
    initStoreIfNeeded();
    const tempId = `temp-${Date.now()}`;
    const newItem: CmsProductionGalleryItem = { ...item, id: tempId };
    const next = [...storeState.productionGallery, newItem];
    storeState = { ...storeState, productionGallery: next };
    setLocalData(STORAGE_KEYS.GALLERY, next);
    notify();

    try {
      const res = await saveProductionGalleryDb(item);
      if (res.success && res.item) {
        const updated = storeState.productionGallery.map((g) => (g.id === tempId ? res.item! : g));
        storeState = { ...storeState, productionGallery: updated };
        setLocalData(STORAGE_KEYS.GALLERY, updated);
        notify();
        return res.item;
      }
    } catch (e) {
      console.error('Failed to save Gallery Item to DB:', e);
    }
    return newItem;
  }, []);

  const updateGalleryItem = useCallback(async (id: string, updates: Partial<CmsProductionGalleryItem>) => {
    initStoreIfNeeded();
    const next = storeState.productionGallery.map((g) => (g.id === id ? { ...g, ...updates } : g));
    storeState = { ...storeState, productionGallery: next };
    setLocalData(STORAGE_KEYS.GALLERY, next);
    notify();

    try {
      const target = next.find((g) => g.id === id);
      if (target) {
        await saveProductionGalleryDb({ ...target, ...updates, id });
      }
    } catch (e) {
      console.error('Failed to update Gallery Item in DB:', e);
    }
  }, []);

  const deleteGalleryItem = useCallback(async (id: string) => {
    initStoreIfNeeded();
    const next = storeState.productionGallery.filter((g) => g.id !== id);
    storeState = { ...storeState, productionGallery: next };
    setLocalData(STORAGE_KEYS.GALLERY, next);
    notify();

    try {
      await deleteProductionGalleryDb(id);
    } catch (e) {
      console.error('Failed to delete Gallery Item from DB:', e);
    }
  }, []);

  // Testimonials
  const addTestimonial = useCallback(async (testi: Omit<CmsTestimonial, 'id'>) => {
    initStoreIfNeeded();
    const tempId = `temp-${Date.now()}`;
    const newTesti: CmsTestimonial = { ...testi, id: tempId };
    const next = [...storeState.testimonials, newTesti];
    storeState = { ...storeState, testimonials: next };
    setLocalData(STORAGE_KEYS.TESTIMONIALS, next);
    notify();

    try {
      const res = await saveTestimonialDb(testi);
      if (res.success && res.testimonial) {
        const updated = storeState.testimonials.map((t) => (t.id === tempId ? res.testimonial! : t));
        storeState = { ...storeState, testimonials: updated };
        setLocalData(STORAGE_KEYS.TESTIMONIALS, updated);
        notify();
        return res.testimonial;
      }
    } catch (e) {
      console.error('Failed to save Testimonial to DB:', e);
    }
    return newTesti;
  }, []);

  const updateTestimonial = useCallback(async (id: string, updates: Partial<CmsTestimonial>) => {
    initStoreIfNeeded();
    const next = storeState.testimonials.map((t) => (t.id === id ? { ...t, ...updates } : t));
    storeState = { ...storeState, testimonials: next };
    setLocalData(STORAGE_KEYS.TESTIMONIALS, next);
    notify();

    try {
      const target = next.find((t) => t.id === id);
      if (target) {
        await saveTestimonialDb({ ...target, ...updates, id });
      }
    } catch (e) {
      console.error('Failed to update Testimonial in DB:', e);
    }
  }, []);

  const deleteTestimonial = useCallback(async (id: string) => {
    initStoreIfNeeded();
    const next = storeState.testimonials.filter((t) => t.id !== id);
    storeState = { ...storeState, testimonials: next };
    setLocalData(STORAGE_KEYS.TESTIMONIALS, next);
    notify();

    try {
      await deleteTestimonialDb(id);
    } catch (e) {
      console.error('Failed to delete Testimonial from DB:', e);
    }
  }, []);

  // Slogan & Quote
  const updateSloganQuote = useCallback(async (updates: Partial<CmsSloganQuote>) => {
    initStoreIfNeeded();
    const next = { ...storeState.sloganQuote, ...updates };
    storeState = { ...storeState, sloganQuote: next };
    setLocalData(STORAGE_KEYS.SLOGAN, next);
    notify();

    try {
      await saveSloganQuoteDb(next);
    } catch (e) {
      console.error('Failed to save Slogan Quote to DB:', e);
    }
  }, []);

  // Company Settings
  const updateCompanySettings = useCallback(async (updates: Partial<CmsCompanySettings>) => {
    initStoreIfNeeded();
    const next = { ...storeState.companySettings, ...updates };
    storeState = { ...storeState, companySettings: next };
    setLocalData(STORAGE_KEYS.COMPANY, next);
    notify();

    try {
      await saveCompanySettingsDb(next);
    } catch (e) {
      console.error('Failed to save Company Settings to DB:', e);
    }
  }, []);

  // Policies
  const updatePolicy = useCallback(async (key: 'privacy' | 'terms' | 'warranty' | 'shipping', updates: Partial<CmsPolicy>) => {
    initStoreIfNeeded();
    const currentPol = storeState.policies[key];
    const updatedPolicy: CmsPolicy = { ...currentPol, ...updates };
    const next = {
      ...storeState.policies,
      [key]: updatedPolicy,
    };
    storeState = { ...storeState, policies: next };
    setLocalData(STORAGE_KEYS.POLICIES, next);
    notify();

    try {
      await savePolicyDb(updatedPolicy);
    } catch (e) {
      console.error('Failed to save Policy to DB:', e);
    }
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

  // Reset to seed data and sync to Cloud DB
  const resetToSeedData = useCallback(async () => {
    storeState = {
      designs: [],
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
      isLoadingDesigns: false,
      isLoadingCms: false,
    };
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

    try {
      await seedAllCmsToDb();
      await fetchAndSyncAllDb();
    } catch (e) {
      console.error('Error resetting seed to DB:', e);
    }
  }, []);

  return {
    isInitialized: state.isInitialized,
    isLoadingDesigns: state.isLoadingDesigns,
    isLoadingCms: state.isLoadingCms,
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
    refreshAllDb,
    refreshDesigns,
    setDesigns,
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
