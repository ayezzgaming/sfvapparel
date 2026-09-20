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

// Purge legacy CMS localStorage keys once so old client caches are erased
function purgeLegacyLocalCmsKeys(): void {
  if (typeof window === 'undefined') return;
  const legacyKeys = [
    'svf_cms_hero_v3',
    'svf_cms_services_v3',
    'svf_cms_videos_v3',
    'svf_cms_gallery_v3',
    'svf_cms_testi_v3',
    'svf_cms_slogan_v3',
    'svf_cms_company_v3',
    'svf_cms_policies_v3',
    'svf_cms_theme_v3',
    'svf_fabrics_v3',
    'svf_cuts_v3',
    'svf_dtf_dims_v3',
    'svf_tiers_v3',
  ];
  try {
    for (const key of legacyKeys) {
      localStorage.removeItem(key);
    }
  } catch {
    // Ignore error
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
 * Fetch and sync all Cloud DB items directly from Supabase (Pure Database)
 */
async function fetchAndSyncAllDb() {
  storeState = { ...storeState, isLoadingDesigns: true, isLoadingCms: true };
  notify();

  try {
    // 1. Fetch Designs directly from Database
    const designsPromise = getDesignsDb()
      .then((res) => {
        if (res.success && Array.isArray(res.designs)) {
          storeState = { ...storeState, designs: res.designs };
        }
      })
      .catch((e) => console.error('Error fetching designs from DB:', e));

    // 2. Fetch CMS Data directly from Database
    const cmsPromise = getCmsDataDb()
      .then((res) => {
        if (res.success && res.data) {
          const {
            heroBanners,
            services,
            productionVideos,
            productionGallery,
            testimonials,
            sloganQuote,
            companySettings,
            policies,
          } = res.data;

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
        }
      })
      .catch((e) => console.error('Error fetching CMS data from DB:', e));

    // 3. Fetch Master Pricing directly from Database
    const pricingPromise = getMasterPricingDb()
      .then((res) => {
        if (res.success && res.data) {
          const { fabrics, cuts, dtfDimensions } = res.data;
          storeState = {
            ...storeState,
            fabrics: fabrics.length > 0 ? fabrics : storeState.fabrics,
            cuts: cuts.length > 0 ? cuts : storeState.cuts,
            dtfDimensions: dtfDimensions.length > 0 ? dtfDimensions : storeState.dtfDimensions,
          };
        }
      })
      .catch((e) => console.error('Error fetching pricing data from DB:', e));

    await Promise.all([designsPromise, cmsPromise, pricingPromise]);
  } finally {
    storeState = { ...storeState, isLoadingDesigns: false, isLoadingCms: false };
    notify();
  }
}

function initStoreIfNeeded() {
  if (typeof window === 'undefined' || storeState.isInitialized) return;
  purgeLegacyLocalCmsKeys();

  storeState = {
    ...storeState,
    isInitialized: true,
    isLoadingDesigns: true,
    isLoadingCms: true,
  };
  notify();

  // Load fresh live data directly from Cloud Supabase DB
  fetchAndSyncAllDb();
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
    notify();
    return newOrder;
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    initStoreIfNeeded();
    const next = storeState.orders.filter((o) => o.id !== orderId);
    storeState = { ...storeState, orders: next };
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
      notify();
    },
    []
  );

  // Design CRUD with Pure Cloud DB
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
      console.error('Failed to add design to DB:', err);
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
      console.error('Failed to update design in DB:', err);
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
      console.error('Failed to delete design from DB:', err);
    }
  }, []);

  // Master Pricing Mutators (Pure Cloud DB)
  const updateFabric = useCallback(async (id: string, updates: Partial<FabricMaterial>) => {
    initStoreIfNeeded();
    const next = storeState.fabrics.map((f) => (f.id === id ? { ...f, ...updates } : f));
    storeState = { ...storeState, fabrics: next };
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
    notify();
  }, []);

  // ==========================================
  // CMS MUTATORS (Pure Cloud Database - No LocalStorage)
  // ==========================================

  // Hero Banners
  const addHeroBanner = useCallback(async (banner: Omit<CmsHeroBanner, 'id'>) => {
    initStoreIfNeeded();
    const tempId = `temp-${Date.now()}`;
    const newBanner: CmsHeroBanner = { ...banner, id: tempId };
    const next = [...storeState.heroBanners, newBanner];
    storeState = { ...storeState, heroBanners: next };
    notify();

    try {
      const res = await saveHeroBannerDb(banner);
      if (res.success && res.banner) {
        const updated = storeState.heroBanners.map((b) => (b.id === tempId ? res.banner! : b));
        storeState = { ...storeState, heroBanners: updated };
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
    notify();

    try {
      const target = next.find((b) => b.id === id);
      if (target) {
        const res = await saveHeroBannerDb({ ...target, ...updates, id });
        if (res.success && res.banner) {
          const synced = storeState.heroBanners.map((b) => (b.id === id ? res.banner! : b));
          storeState = { ...storeState, heroBanners: synced };
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
    notify();

    try {
      const res = await saveServiceDb(service);
      if (res.success && res.service) {
        const updated = storeState.services.map((s) => (s.id === tempId ? res.service! : s));
        storeState = { ...storeState, services: updated };
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
    notify();

    try {
      const res = await saveProductionVideoDb(video);
      if (res.success && res.video) {
        const updated = storeState.productionVideos.map((v) => (v.id === tempId ? res.video! : v));
        storeState = { ...storeState, productionVideos: updated };
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
    notify();

    try {
      const res = await saveProductionGalleryDb(item);
      if (res.success && res.item) {
        const updated = storeState.productionGallery.map((g) => (g.id === tempId ? res.item! : g));
        storeState = { ...storeState, productionGallery: updated };
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
    notify();

    try {
      const res = await saveTestimonialDb(testi);
      if (res.success && res.testimonial) {
        const updated = storeState.testimonials.map((t) => (t.id === tempId ? res.testimonial! : t));
        storeState = { ...storeState, testimonials: updated };
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
