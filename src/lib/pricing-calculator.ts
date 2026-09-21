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
  const actualQty = Math.max(0, quantity || 0);
  const tierLookupQty = Math.max(1, actualQty);
  const rawUnitPrice = (fabric?.sublimation_base_price || 0) + (cut?.cut_add_on_price || 0);
  const tier = getTierDiscount(tierLookupQty, tiers);
  const discountPercent = tier.discount_percentage || 0;
  
  const unitDiscountAmount = Math.round(rawUnitPrice * (discountPercent / 100));
  const finalUnitPrice = rawUnitPrice - unitDiscountAmount;
  const subtotal = rawUnitPrice * actualQty;
  const finalTotal = finalUnitPrice * actualQty;
  const totalSavings = subtotal - finalTotal;

  return {
    rawUnitPrice,
    tierLabel: actualQty > 0 ? tier.tier_label : 'Standard',
    discountPercentage: actualQty > 0 ? discountPercent : 0,
    unitDiscountAmount: actualQty > 0 ? unitDiscountAmount : 0,
    finalUnitPrice,
    subtotal,
    totalSavings,
    finalTotal,
    currency: 'MYR',
  };
}

export function calculateDtfPrice({
  dimension,
  optionType,
  quantity,
  tiers,
}: DtfQuoteParams): PriceQuote {
  const actualQty = Math.max(0, quantity || 0);
  const tierLookupQty = Math.max(1, actualQty);
  const rawUnitPrice = optionType === 'with_garment' 
    ? (dimension?.garment_included_base_price || dimension?.base_price || 0)
    : (dimension?.base_price || 0);

  const tier = getTierDiscount(tierLookupQty, tiers);
  const discountPercent = tier.discount_percentage || 0;
  
  const unitDiscountAmount = Math.round(rawUnitPrice * (discountPercent / 100));
  const finalUnitPrice = rawUnitPrice - unitDiscountAmount;
  const subtotal = rawUnitPrice * actualQty;
  const finalTotal = finalUnitPrice * actualQty;
  const totalSavings = subtotal - finalTotal;

  return {
    rawUnitPrice,
    tierLabel: actualQty > 0 ? tier.tier_label : 'Standard',
    discountPercentage: actualQty > 0 ? discountPercent : 0,
    unitDiscountAmount: actualQty > 0 ? unitDiscountAmount : 0,
    finalUnitPrice,
    subtotal,
    totalSavings,
    finalTotal,
    currency: 'MYR',
  };
}

export function formatCurrency(amount: number, currency: string = 'MYR'): string {
  const validAmount = Number(amount) || 0;
  return `RM ${validAmount.toLocaleString('en-MY', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
