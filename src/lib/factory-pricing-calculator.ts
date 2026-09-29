import { PartnerFactory, FactoryPricingMatrix } from '@/types/database';

export interface CalculatedFactoryCost {
  baseCost: number;
  tierApplied: string | null;
  fabricSurcharge: number;
  cutSurcharge: number;
  collarSurcharge: number;
  finalUnitCost: number;
  totalCost: number;
}

/**
 * Calculates the exact factory production unit cost based on the factory's rate card matrix
 */
export function calculateFactoryUnitCost(
  factory?: PartnerFactory | null,
  quantity: number = 1,
  fabricName?: string,
  cutName?: string,
  collarName?: string
): CalculatedFactoryCost {
  if (!factory) {
    return {
      baseCost: 22,
      tierApplied: null,
      fabricSurcharge: 0,
      cutSurcharge: 0,
      collarSurcharge: 0,
      finalUnitCost: 22,
      totalCost: 22 * (quantity || 1),
    };
  }

  const matrix = factory.pricing_matrix;
  let baseCost = Number(matrix?.base_unit_cost) || Number(factory.default_unit_cost) || 22.0;
  let tierApplied: string | null = null;

  // 1. Check volume tier discounts from factory
  if (matrix?.tier_discounts && Array.isArray(matrix.tier_discounts) && matrix.tier_discounts.length > 0) {
    for (const tier of matrix.tier_discounts) {
      const min = Number(tier.min_qty) || 0;
      const max = tier.max_qty !== null && tier.max_qty !== undefined ? Number(tier.max_qty) : Infinity;
      if (quantity >= min && quantity <= max) {
        baseCost = Number(tier.unit_cost);
        tierApplied = `${min}${tier.max_qty ? `-${tier.max_qty}` : '+'} pcs`;
        break;
      }
    }
  }

  // 2. Fabric Surcharges
  let fabricSurcharge = 0;
  if (fabricName && matrix?.fabric_surcharges) {
    const key = Object.keys(matrix.fabric_surcharges).find(
      (k) => fabricName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(fabricName.toLowerCase())
    );
    if (key) {
      fabricSurcharge = Number(matrix.fabric_surcharges[key]) || 0;
    }
  }

  // 3. Cut Surcharges (e.g. Long Sleeve, Muslimah)
  let cutSurcharge = 0;
  if (cutName && matrix?.cut_surcharges) {
    const key = Object.keys(matrix.cut_surcharges).find(
      (k) => cutName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(cutName.toLowerCase())
    );
    if (key) {
      cutSurcharge = Number(matrix.cut_surcharges[key]) || 0;
    }
  }

  // 4. Collar Surcharges (e.g. Collar Polo, Zip)
  let collarSurcharge = 0;
  if (collarName && matrix?.collar_surcharges) {
    const key = Object.keys(matrix.collar_surcharges).find(
      (k) => collarName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(collarName.toLowerCase())
    );
    if (key) {
      collarSurcharge = Number(matrix.collar_surcharges[key]) || 0;
    }
  }

  const finalUnitCost = Math.max(0, baseCost + fabricSurcharge + cutSurcharge + collarSurcharge);
  const totalCost = finalUnitCost * (quantity || 0);

  return {
    baseCost,
    tierApplied,
    fabricSurcharge,
    cutSurcharge,
    collarSurcharge,
    finalUnitCost: Math.round(finalUnitCost * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}
