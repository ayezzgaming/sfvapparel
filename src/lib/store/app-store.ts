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
} from '@/types/database';
import {
  INITIAL_APPAREL_CUTS,
  INITIAL_CUSTOMERS,
  INITIAL_DESIGNS,
  INITIAL_DTF_DIMENSIONS,
  INITIAL_FABRIC_MATERIALS,
  INITIAL_ORDERS,
  INITIAL_QUANTITY_TIERS,
} from './seed-data';

const STORAGE_KEYS = {
  DESIGNS: 'svf_designs_v2',
  FABRICS: 'svf_fabrics_v2',
  CUTS: 'svf_cuts_v2',
  DTF_DIMS: 'svf_dtf_dims_v2',
  TIERS: 'svf_tiers_v2',
  CUSTOMERS: 'svf_customers_v2',
  ORDERS: 'svf_orders_v2',
  FAVORITES: 'svf_favorites_v2',
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
    isInitialized: true,
  };
  notify();
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

  const addDesign = useCallback((design: Omit<Design, 'id'>) => {
    initStoreIfNeeded();
    const newDesign: Design = { ...design, id: `des-${Date.now()}` };
    const nextDesigns = [newDesign, ...storeState.designs];
    storeState = { ...storeState, designs: nextDesigns };
    setLocalData(STORAGE_KEYS.DESIGNS, nextDesigns);
    notify();
    return newDesign;
  }, []);

  const updateDesign = useCallback((id: string, updates: Partial<Design>) => {
    initStoreIfNeeded();
    const nextDesigns = storeState.designs.map((d) => (d.id === id ? { ...d, ...updates } : d));
    storeState = { ...storeState, designs: nextDesigns };
    setLocalData(STORAGE_KEYS.DESIGNS, nextDesigns);
    notify();
  }, []);

  const deleteDesign = useCallback((id: string) => {
    initStoreIfNeeded();
    const nextDesigns = storeState.designs.filter((d) => d.id !== id);
    storeState = { ...storeState, designs: nextDesigns };
    setLocalData(STORAGE_KEYS.DESIGNS, nextDesigns);
    notify();
  }, []);

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
    resetToSeedData,
  };
}
