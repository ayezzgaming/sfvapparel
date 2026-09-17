import { ApparelCut, DtfDimension, FabricMaterial, QuantityTierDiscount } from '@/types/database';

export interface SublimationQuoteParams {
  fabric: FabricMaterial;
  cut: ApparelCut;
  quantity: number;
  tiers: QuantityTierDiscount[];
}

export interface DtfQuoteParams {
  dimension: DtfDimension;
  optionType: 'film_only' | 'with_garment';
  quantity: number;
  tiers: QuantityTierDiscount[];
}

export interface PriceQuote {
  rawUnitPrice: number;
  tierLabel: string;
  discountPercentage: number;
  unitDiscountAmount: number;
  finalUnitPrice: number;
  subtotal: number;
  totalSavings: number;
  finalTotal: number;
  currency: string;
}

export function getTierDiscount(quantity: number, tiers: QuantityTierDiscount[]): QuantityTierDiscount {
  // Sort descending by min_qty to find highest match
  const sorted = [...tiers].sort((a, b) => b.min_qty - a.min_qty);
  const match = sorted.find(t => {
    if (t.max_qty === null) {
      return quantity >= t.min_qty;
    }
    return quantity >= t.min_qty && quantity <= t.max_qty;
  });

  return match || {
    id: 'default',
    tier_label: 'Standard',
    min_qty: 1,
    max_qty: null,
    discount_percentage: 0,
  };
}

export function calculateSublimationPrice({
  fabric,
  cut,
  quantity,
  tiers,
}: SublimationQuoteParams): PriceQuote {
  const safeQty = Math.max(1, quantity || 1);
  const rawUnitPrice = (fabric?.sublimation_base_price || 0) + (cut?.cut_add_on_price || 0);
  const tier = getTierDiscount(safeQty, tiers);
  const discountPercent = tier.discount_percentage || 0;
  
  const unitDiscountAmount = Math.round(rawUnitPrice * (discountPercent / 100));
  const finalUnitPrice = rawUnitPrice - unitDiscountAmount;
  const subtotal = rawUnitPrice * safeQty;
  const finalTotal = finalUnitPrice * safeQty;
  const totalSavings = subtotal - finalTotal;

  return {
    rawUnitPrice,
    tierLabel: tier.tier_label,
    discountPercentage: discountPercent,
    unitDiscountAmount,
    finalUnitPrice,
    subtotal,
    totalSavings,
    finalTotal,
    currency: 'IDR',
  };
}

export function calculateDtfPrice({
  dimension,
  optionType,
  quantity,
  tiers,
}: DtfQuoteParams): PriceQuote {
  const safeQty = Math.max(1, quantity || 1);
  const rawUnitPrice = optionType === 'with_garment' 
    ? (dimension?.garment_included_base_price || dimension?.base_price || 0)
    : (dimension?.base_price || 0);

  const tier = getTierDiscount(safeQty, tiers);
  const discountPercent = tier.discount_percentage || 0;
  
  const unitDiscountAmount = Math.round(rawUnitPrice * (discountPercent / 100));
  const finalUnitPrice = rawUnitPrice - unitDiscountAmount;
  const subtotal = rawUnitPrice * safeQty;
  const finalTotal = finalUnitPrice * safeQty;
  const totalSavings = subtotal - finalTotal;

  return {
    rawUnitPrice,
    tierLabel: tier.tier_label,
    discountPercentage: discountPercent,
    unitDiscountAmount,
    finalUnitPrice,
    subtotal,
    totalSavings,
    finalTotal,
    currency: 'IDR',
  };
}

export function formatCurrency(amount: number, currency: string = 'IDR'): string {
  if (currency === 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}
