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
  CmsTrustBadge,
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
  saveTrustBadgesDb,
  saveTrustBadgeDb,
  deleteTrustBadgeDb,
  seedAllCmsToDb,
} from '@/app/actions/cmsActions';
import {
  getMasterPricingDb,
  saveFabricDb,
  deleteFabricDb,
  saveCutDb,
  deleteCutDb,
  saveDtfDimensionDb,
  deleteDtfDimensionDb,
  saveQuantityTierDb,
  deleteQuantityTierDb,
} from '@/app/actions/pricingActions';
import { getCustomersDb } from '@/app/actions/customerActions';
import { getOrdersDb, saveOrderDb, updateOrderStatusDb, deleteOrderDb, markOrderBalancePaidAction } from '@/app/actions/orderActions';
import {
  INITIAL_APPAREL_CUTS,
  INITIAL_CUSTOMERS,
  INITIAL_DTF_DIMENSIONS,
  INITIAL_FABRIC_MATERIALS,
  INITIAL_ORDERS,
  INITIAL_QUANTITY_TIERS,
  INITIAL_CMS_HERO_BANNERS,
  INITIAL_CMS_TRUST_BADGES,
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
  trustBadges: CmsTrustBadge[];
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

// NOTE: storeState MUST start identical to serverSnapshot to avoid React hydration mismatch.
// Seed data is injected only in initStoreIfNeeded() which runs client-side only.
let storeState: AppStoreState = {
  designs: [],
  fabrics: INITIAL_FABRIC_MATERIALS,
  cuts: INITIAL_APPAREL_CUTS,
  dtfDimensions: INITIAL_DTF_DIMENSIONS,
  tiers: INITIAL_QUANTITY_TIERS,
  customers: [],
  orders: [],
  favorites: [],
  heroBanners: [], // Must match serverSnapshot to avoid hydration mismatch
  trustBadges: INITIAL_CMS_TRUST_BADGES,
  services: INITIAL_CMS_SERVICES,
  productionVideos: [],
  productionGallery: [],
  testimonials: [],
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
 * Using 2-Stage Chunking to prevent network congestion and unblock critical UI rendering immediately
 */
async function fetchAndSyncAllDb() {
  const isDesignsEmpty = storeState.designs.length === 0;
  const isCmsEmpty = storeState.heroBanners.length === 0 && storeState.productionVideos.length === 0;

  if (isDesignsEmpty || isCmsEmpty) {
    storeState = {
      ...storeState,
      isLoadingDesigns: isDesignsEmpty,
      isLoadingCms: isCmsEmpty,
    };
    notify();
  }

  try {
    // -------------------------------------------------------------
    // STAGE 1: CRITICAL UI DATA (Designs & CMS content for fast view)
    // -------------------------------------------------------------
    const designsPromise = getDesignsDb()
      .then((res) => {
        if (res.success && Array.isArray(res.designs)) {
          storeState = { ...storeState, designs: res.designs };
        }
      })
      .catch((e) => console.error('Error fetching designs from DB:', e));

    const cmsPromise = getCmsDataDb()
      .then((res) => {
        if (res.success && res.data) {
          const {
            heroBanners,
            trustBadges,
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
            heroBanners: Array.isArray(heroBanners) && heroBanners.length > 0 ? heroBanners : storeState.heroBanners,
            trustBadges: Array.isArray(trustBadges) && trustBadges.length > 0 ? trustBadges : storeState.trustBadges,
            services: Array.isArray(services) && services.length > 0 ? services : storeState.services,
            productionVideos: Array.isArray(productionVideos) ? productionVideos : [],
            productionGallery: Array.isArray(productionGallery) ? productionGallery : [],
            testimonials: Array.isArray(testimonials) ? testimonials : [],
            sloganQuote: sloganQuote || storeState.sloganQuote,
            companySettings: companySettings || storeState.companySettings,
            policies: policies || storeState.policies,
          };
        }
      })
      .catch((e) => console.error('Error fetching CMS data from DB:', e));

    // Await ONLY Stage 1 so UI unblocks in record time (<300ms)
    await Promise.all([designsPromise, cmsPromise]);
  } finally {
    storeState = { ...storeState, isLoadingDesigns: false, isLoadingCms: false };
    notify();
  }

  // -------------------------------------------------------------
  // STAGE 2: SECONDARY DATA (Pricing, Customers, Orders)
  // Executes asynchronously in background without blocking the UI
  // -------------------------------------------------------------
  const pricingPromise = getMasterPricingDb()
    .then((res) => {
      if (res.success && res.data) {
        const { fabrics, cuts, dtfDimensions, tiers } = res.data;
        storeState = {
          ...storeState,
          fabrics: fabrics.length > 0 ? fabrics : storeState.fabrics,
          cuts: cuts.length > 0 ? cuts : storeState.cuts,
          dtfDimensions: dtfDimensions.length > 0 ? dtfDimensions : storeState.dtfDimensions,
          tiers: tiers.length > 0 ? tiers : storeState.tiers,
        };
        notify();
      }
    })
    .catch((e) => console.error('Error fetching pricing data from DB:', e));

  const customersPromise = getCustomersDb()
    .then((res) => {
      if (res.success && Array.isArray(res.customers)) {
        storeState = { ...storeState, customers: res.customers };
        notify();
      }
    })
    .catch((e) => console.error('Error fetching customers from DB:', e));

  const ordersPromise = getOrdersDb()
    .then((res) => {
      if (res.success && Array.isArray(res.orders)) {
        storeState = { ...storeState, orders: res.orders };
        notify();
      }
    })
    .catch((e) => console.error('Error fetching orders from DB:', e));

  // Run secondary sync concurrently without awaiting in main render path
  Promise.all([pricingPromise, customersPromise, ordersPromise]).catch((e) => {
    console.error('Stage 2 secondary data sync background error:', e);
  });
}

function initStoreIfNeeded() {
  if (typeof window === 'undefined' || storeState.isInitialized) return;
  purgeLegacyLocalCmsKeys();

  // Inject seed data as client-side fallbacks (safe here — only runs in browser)
  storeState = {
    ...storeState,
    heroBanners: INITIAL_CMS_HERO_BANNERS,
    isInitialized: true,
  };

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
  customers: [],
  orders: [],
  favorites: [],
  heroBanners: [],
  trustBadges: INITIAL_CMS_TRUST_BADGES,
  services: INITIAL_CMS_SERVICES,
  productionVideos: [],
  productionGallery: [],
  testimonials: [],
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

  const addOrder = useCallback(async (orderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) => {
    initStoreIfNeeded();
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const timestamp = now.getTime();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const tempId = `ord-${timestamp}`;
    const newOrder: Order = {
      ...orderData,
      id: tempId,
      order_number: `SFV-${yy}${mm}-${randomSuffix}`,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const next = [newOrder, ...storeState.orders];
    storeState = { ...storeState, orders: next };
    notify();

    try {
      const res = await saveOrderDb(newOrder);
      if (res.success && res.order) {
        storeState = {
          ...storeState,
          orders: storeState.orders.map((o) => (o.id === tempId ? res.order! : o)),
        };
        notify();
        return res.order;
      }
    } catch (e) {
      console.error('[app-store] Failed to save order to DB:', e);
    }
    return newOrder;
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    initStoreIfNeeded();
    const next = storeState.orders.filter((o) => o.id !== orderId);
    storeState = { ...storeState, orders: next };
    notify();

    try {
      await deleteOrderDb(orderId);
    } catch (e) {
      console.error('[app-store] Failed to delete order from DB:', e);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus, trackingNumber?: string, notes?: string) => {
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

      try {
        await updateOrderStatusDb(orderId, status, trackingNumber, notes);
      } catch (e) {
        console.error('[app-store] Failed to update order in DB:', e);
      }
    },
    []
  );

  const markOrderBalancePaid = useCallback(
    async (orderId: string, paymentMethod: string = 'Manual Transfer / Cash', paymentId?: string) => {
      initStoreIfNeeded();
      const next = storeState.orders.map((o) =>
        o.id === orderId
          ? {
              ...o,
              payment_status: 'paid' as const,
              balance_amount: 0,
              paid_amount: o.total_amount,
              balance_paid_at: new Date().toISOString(),
              balance_payment_method: paymentMethod,
              balance_payment_id: paymentId,
              updated_at: new Date().toISOString(),
            }
          : o
      );
      storeState = { ...storeState, orders: next };
      notify();

      try {
        const res = await markOrderBalancePaidAction(orderId, paymentMethod, paymentId);
        if (!res.success) {
          console.error('[app-store] Failed to mark order balance paid in DB:', res.message);
        }
      } catch (e) {
        console.error('[app-store] Error in markOrderBalancePaid:', e);
      }
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
  const addFabric = useCallback(async (fabric: Omit<FabricMaterial, 'id'>) => {
    initStoreIfNeeded();
    // Optimistic: use temp ID while waiting for DB UUID
    const tempId = `temp-fabric-${Date.now()}`;
    const tempFabric: FabricMaterial = { ...fabric, id: tempId };
    storeState = { ...storeState, fabrics: [...storeState.fabrics, tempFabric] };
    notify();

    try {
      // Save without ID so Supabase generates UUID
      const res = await saveFabricDb(tempFabric);
      if (!res.success) console.error('Error adding fabric to DB:', res.message);
      // Re-fetch to get real UUID from DB
      await fetchAndSyncAllDb();
    } catch (e) {
      console.error('Error adding fabric to DB:', e);
      // Rollback on error
      storeState = { ...storeState, fabrics: storeState.fabrics.filter(f => f.id !== tempId) };
      notify();
    }
  }, []);

  const updateFabric = useCallback(async (id: string, updates: Partial<FabricMaterial>) => {
    initStoreIfNeeded();
    const next = storeState.fabrics.map((f) => (f.id === id ? { ...f, ...updates } : f));
    storeState = { ...storeState, fabrics: next };
    notify();

    const target = next.find((f) => f.id === id);
    if (target) {
      saveFabricDb(target).then(res => {
        if (!res.success) console.error('Error saving fabric to DB:', res.message);
      }).catch((e) => console.error('Error saving fabric to DB:', e));
    }
  }, []);

  const deleteFabric = useCallback(async (id: string) => {
    initStoreIfNeeded();
    const next = storeState.fabrics.filter((f) => f.id !== id);
    storeState = { ...storeState, fabrics: next };
    notify();

    deleteFabricDb(id).then(res => {
      if (!res.success) console.error('Error deleting fabric from DB:', res.message);
    }).catch((e) => console.error('Error deleting fabric from DB:', e));
  }, []);

  const addCut = useCallback(async (cut: Omit<ApparelCut, 'id'>) => {
    initStoreIfNeeded();
    const tempId = `temp-cut-${Date.now()}`;
    const tempCut: ApparelCut = { ...cut, id: tempId };
    storeState = { ...storeState, cuts: [...storeState.cuts, tempCut] };
    notify();

    try {
      const res = await saveCutDb(tempCut);
      if (!res.success) console.error('Error adding cut to DB:', res.message);
      await fetchAndSyncAllDb();
    } catch (e) {
      console.error('Error adding cut to DB:', e);
      storeState = { ...storeState, cuts: storeState.cuts.filter(c => c.id !== tempId) };
      notify();
    }
  }, []);

  const updateCut = useCallback(async (id: string, updates: Partial<ApparelCut>) => {
    initStoreIfNeeded();
    const next = storeState.cuts.map((c) => (c.id === id ? { ...c, ...updates } : c));
    storeState = { ...storeState, cuts: next };
    notify();

    const target = next.find((c) => c.id === id);
    if (target) {
      saveCutDb(target).then(res => {
        if (!res.success) console.error('Error saving cut to DB:', res.message);
      }).catch((e) => console.error('Error saving cut to DB:', e));
    }
  }, []);

  const deleteCut = useCallback(async (id: string) => {
    initStoreIfNeeded();
    const next = storeState.cuts.filter((c) => c.id !== id);
    storeState = { ...storeState, cuts: next };
    notify();

    deleteCutDb(id).then(res => {
      if (!res.success) console.error('Error deleting cut from DB:', res.message);
    }).catch((e) => console.error('Error deleting cut from DB:', e));
  }, []);

  const addDtfDimension = useCallback(async (dim: Omit<DtfDimension, 'id'>) => {
    initStoreIfNeeded();
    const tempId = `temp-dtf-${Date.now()}`;
    const tempDim: DtfDimension = { ...dim, id: tempId };
    storeState = { ...storeState, dtfDimensions: [...storeState.dtfDimensions, tempDim] };
    notify();

    try {
      const res = await saveDtfDimensionDb(tempDim);
      if (!res.success) console.error('Error adding DTF dim to DB:', res.message);
      await fetchAndSyncAllDb();
    } catch (e) {
      console.error('Error adding DTF dim to DB:', e);
      storeState = { ...storeState, dtfDimensions: storeState.dtfDimensions.filter(d => d.id !== tempId) };
      notify();
    }
  }, []);

  const updateDtfDimension = useCallback(async (id: string, updates: Partial<DtfDimension>) => {
    initStoreIfNeeded();
    const next = storeState.dtfDimensions.map((d) => (d.id === id ? { ...d, ...updates } : d));
    storeState = { ...storeState, dtfDimensions: next };
    notify();

    const target = next.find((d) => d.id === id);
    if (target) {
      saveDtfDimensionDb(target).then(res => {
        if (!res.success) console.error('Error saving DTF dim to DB:', res.message);
      }).catch((e) => console.error('Error saving DTF dim to DB:', e));
    }
  }, []);

  const deleteDtfDimension = useCallback(async (id: string) => {
    initStoreIfNeeded();
    const next = storeState.dtfDimensions.filter((d) => d.id !== id);
    storeState = { ...storeState, dtfDimensions: next };
    notify();

    deleteDtfDimensionDb(id).then(res => {
      if (!res.success) console.error('Error deleting DTF dim from DB:', res.message);
    }).catch((e) => console.error('Error deleting DTF dim from DB:', e));
  }, []);

  const addQuantityTier = useCallback(async (tier: Omit<QuantityTierDiscount, 'id'>) => {
    initStoreIfNeeded();
    const tempId = `temp-tier-${Date.now()}`;
    const tempTier: QuantityTierDiscount = { ...tier, id: tempId };
    const next = [...storeState.tiers, tempTier].sort((a, b) => a.min_qty - b.min_qty);
    storeState = { ...storeState, tiers: next };
    notify();

    try {
      const res = await saveQuantityTierDb(tempTier);
      if (!res.success) console.error('Error adding tier to DB:', res.message);
      await fetchAndSyncAllDb();
    } catch (e) {
      console.error('Error adding tier to DB:', e);
      storeState = { ...storeState, tiers: storeState.tiers.filter(t => t.id !== tempId) };
      notify();
    }
  }, []);

  const updateQuantityTier = useCallback(async (id: string, updates: Partial<QuantityTierDiscount>) => {
    initStoreIfNeeded();
    const next = storeState.tiers.map((t) => (t.id === id ? { ...t, ...updates } : t)).sort((a, b) => a.min_qty - b.min_qty);
    storeState = { ...storeState, tiers: next };
    notify();

    const target = next.find((t) => t.id === id);
    if (target) {
      saveQuantityTierDb(target).then(res => {
        if (!res.success) console.error('Error saving tier to DB:', res.message);
      }).catch((e) => console.error('Error saving tier to DB:', e));
    }
  }, []);

  const deleteQuantityTier = useCallback(async (id: string) => {
    initStoreIfNeeded();
    const next = storeState.tiers.filter((t) => t.id !== id);
    storeState = { ...storeState, tiers: next };
    notify();

    deleteQuantityTierDb(id).then(res => {
      if (!res.success) console.error('Error deleting tier from DB:', res.message);
    }).catch((e) => console.error('Error deleting tier from DB:', e));
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

  // Trust Badges / Value Proposition Cards
  const addTrustBadge = useCallback(async (badge: Omit<CmsTrustBadge, 'id'>) => {
    initStoreIfNeeded();
    const tempId = `badge-${Date.now()}`;
    const newBadge: CmsTrustBadge = { ...badge, id: tempId };
    const next = [...storeState.trustBadges, newBadge];
    storeState = { ...storeState, trustBadges: next };
    notify();

    try {
      const res = await saveTrustBadgeDb(badge);
      if (res.success && res.badge) {
        const synced = storeState.trustBadges.map((b) => (b.id === tempId ? res.badge! : b));
        storeState = { ...storeState, trustBadges: synced };
        notify();
        return res.badge;
      }
    } catch (e) {
      console.error('Failed to save Trust Badge to DB:', e);
    }
    return newBadge;
  }, []);

  const updateTrustBadge = useCallback(async (id: string, updates: Partial<CmsTrustBadge>) => {
    initStoreIfNeeded();
    const next = storeState.trustBadges.map((b) => (b.id === id ? { ...b, ...updates } : b));
    storeState = { ...storeState, trustBadges: next };
    notify();

    try {
      const target = next.find((b) => b.id === id);
      if (target) {
        const res = await saveTrustBadgeDb({ ...target, ...updates, id });
        if (res.success && res.badge) {
          const synced = storeState.trustBadges.map((b) => (b.id === id ? res.badge! : b));
          storeState = { ...storeState, trustBadges: synced };
          notify();
        }
      }
    } catch (e) {
      console.error('Failed to update Trust Badge in DB:', e);
    }
  }, []);

  const deleteTrustBadge = useCallback(async (id: string) => {
    initStoreIfNeeded();
    const next = storeState.trustBadges.filter((b) => b.id !== id);
    storeState = { ...storeState, trustBadges: next };
    notify();

    try {
      await deleteTrustBadgeDb(id);
    } catch (e) {
      console.error('Failed to delete Trust Badge from DB:', e);
    }
  }, []);

  const reorderTrustBadges = useCallback(async (badges: CmsTrustBadge[]) => {
    initStoreIfNeeded();
    const updated = badges.map((b, idx) => ({ ...b, sort_order: idx + 1 }));
    storeState = { ...storeState, trustBadges: updated };
    notify();

    try {
      await saveTrustBadgesDb(updated);
    } catch (e) {
      console.error('Failed to reorder Trust Badges in DB:', e);
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
      trustBadges: INITIAL_CMS_TRUST_BADGES,
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
    trustBadges: state.trustBadges,
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
    markOrderBalancePaid,
    addDesign,
    updateDesign,
    deleteDesign,
    addFabric,
    updateFabric,
    deleteFabric,
    addCut,
    updateCut,
    deleteCut,
    addDtfDimension,
    updateDtfDimension,
    deleteDtfDimension,
    addQuantityTier,
    updateQuantityTier,
    deleteQuantityTier,
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
    updateThemeSettings,
    applyThemePreset,
    resetToSeedData,
  };
}
