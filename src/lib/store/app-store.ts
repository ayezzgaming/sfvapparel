'use client';

import { useEffect, useState, useCallback } from 'react';
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

export function useAppStore() {
  const [designs, setDesigns] = useState<Design[]>(INITIAL_DESIGNS);
  const [fabrics, setFabrics] = useState<FabricMaterial[]>(INITIAL_FABRIC_MATERIALS);
  const [cuts, setCuts] = useState<ApparelCut[]>(INITIAL_APPAREL_CUTS);
  const [dtfDimensions, setDtfDimensions] = useState<DtfDimension[]>(INITIAL_DTF_DIMENSIONS);
  const [tiers, setTiers] = useState<QuantityTierDiscount[]>(INITIAL_QUANTITY_TIERS);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from LocalStorage
  useEffect(() => {
    setDesigns(getLocalData(STORAGE_KEYS.DESIGNS, INITIAL_DESIGNS));
    setFabrics(getLocalData(STORAGE_KEYS.FABRICS, INITIAL_FABRIC_MATERIALS));
    setCuts(getLocalData(STORAGE_KEYS.CUTS, INITIAL_APPAREL_CUTS));
    setDtfDimensions(getLocalData(STORAGE_KEYS.DTF_DIMS, INITIAL_DTF_DIMENSIONS));
    setTiers(getLocalData(STORAGE_KEYS.TIERS, INITIAL_QUANTITY_TIERS));
    setCustomers(getLocalData(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS));
    setOrders(getLocalData(STORAGE_KEYS.ORDERS, INITIAL_ORDERS));
    setIsInitialized(true);
  }, []);

  // Listen for storage events (multi-tab sync between Public PWA and Admin)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.DESIGNS && e.newValue) setDesigns(JSON.parse(e.newValue));
      if (e.key === STORAGE_KEYS.FABRICS && e.newValue) setFabrics(JSON.parse(e.newValue));
      if (e.key === STORAGE_KEYS.CUTS && e.newValue) setCuts(JSON.parse(e.newValue));
      if (e.key === STORAGE_KEYS.DTF_DIMS && e.newValue) setDtfDimensions(JSON.parse(e.newValue));
      if (e.key === STORAGE_KEYS.TIERS && e.newValue) setTiers(JSON.parse(e.newValue));
      if (e.key === STORAGE_KEYS.ORDERS && e.newValue) setOrders(JSON.parse(e.newValue));
      if (e.key === STORAGE_KEYS.CUSTOMERS && e.newValue) setCustomers(JSON.parse(e.newValue));
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Actions
  const addOrder = useCallback((newOrderData: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>) => {
    const nextOrderNum = `SFV-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const newOrder: Order = {
      ...newOrderData,
      id: `ord-${Date.now()}`,
      order_number: nextOrderNum,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      setLocalData(STORAGE_KEYS.ORDERS, updated);
      return updated;
    });

    return newOrder;
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: OrderStatus, trackingNumber?: string, notes?: string) => {
    setOrders((prev) => {
      const updated = prev.map((ord) => {
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
      setLocalData(STORAGE_KEYS.ORDERS, updated);
      return updated;
    });
  }, []);

  const addDesign = useCallback((design: Omit<Design, 'id'>) => {
    const newDesign: Design = {
      ...design,
      id: `des-${Date.now()}`,
    };
    setDesigns((prev) => {
      const updated = [newDesign, ...prev];
      setLocalData(STORAGE_KEYS.DESIGNS, updated);
      return updated;
    });
    return newDesign;
  }, []);

  const updateDesign = useCallback((id: string, updates: Partial<Design>) => {
    setDesigns((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      setLocalData(STORAGE_KEYS.DESIGNS, updated);
      return updated;
    });
  }, []);

  const deleteDesign = useCallback((id: string) => {
    setDesigns((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      setLocalData(STORAGE_KEYS.DESIGNS, updated);
      return updated;
    });
  }, []);

  const updateFabric = useCallback((id: string, updates: Partial<FabricMaterial>) => {
    setFabrics((prev) => {
      const updated = prev.map((f) => (f.id === id ? { ...f, ...updates } : f));
      setLocalData(STORAGE_KEYS.FABRICS, updated);
      return updated;
    });
  }, []);

  const updateCut = useCallback((id: string, updates: Partial<ApparelCut>) => {
    setCuts((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      setLocalData(STORAGE_KEYS.CUTS, updated);
      return updated;
    });
  }, []);

  const updateDtfDimension = useCallback((id: string, updates: Partial<DtfDimension>) => {
    setDtfDimensions((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, ...updates } : d));
      setLocalData(STORAGE_KEYS.DTF_DIMS, updated);
      return updated;
    });
  }, []);

  const updateQuantityTier = useCallback((id: string, updates: Partial<QuantityTierDiscount>) => {
    setTiers((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      setLocalData(STORAGE_KEYS.TIERS, updated);
      return updated;
    });
  }, []);

  const resetToSeedData = useCallback(() => {
    setDesigns(INITIAL_DESIGNS);
    setFabrics(INITIAL_FABRIC_MATERIALS);
    setCuts(INITIAL_APPAREL_CUTS);
    setDtfDimensions(INITIAL_DTF_DIMENSIONS);
    setTiers(INITIAL_QUANTITY_TIERS);
    setCustomers(INITIAL_CUSTOMERS);
    setOrders(INITIAL_ORDERS);

    setLocalData(STORAGE_KEYS.DESIGNS, INITIAL_DESIGNS);
    setLocalData(STORAGE_KEYS.FABRICS, INITIAL_FABRIC_MATERIALS);
    setLocalData(STORAGE_KEYS.CUTS, INITIAL_APPAREL_CUTS);
    setLocalData(STORAGE_KEYS.DTF_DIMS, INITIAL_DTF_DIMENSIONS);
    setLocalData(STORAGE_KEYS.TIERS, INITIAL_QUANTITY_TIERS);
    setLocalData(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    setLocalData(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }, []);

  return {
    isInitialized,
    designs,
    fabrics,
    cuts,
    dtfDimensions,
    tiers,
    customers,
    orders,
    addOrder,
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
