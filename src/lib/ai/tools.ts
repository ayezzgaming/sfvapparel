import { getCustomerOrdersDb } from '@/app/actions/orderActions';
import { getMasterPricingDb } from '@/app/actions/pricingActions';
import { getDesignsDb } from '@/app/actions/designActions';
import { calculateSublimationPrice, formatCurrency } from '@/lib/pricing-calculator';
import { INITIAL_FABRIC_MATERIALS, INITIAL_APPAREL_CUTS, INITIAL_QUANTITY_TIERS } from '@/lib/store/seed-data';

export interface PricingCalculationInput {
  quantity: number;
  fabricCode?: string;
  cutCode?: string;
}

export interface PricingCalculationOutput {
  quantity: number;
  fabricName: string;
  cutName: string;
  rawUnitPrice: number;
  discountPercentage: number;
  tierLabel: string;
  finalUnitPrice: number;
  totalAmount: number;
  deposit50Percent: number;
  balance50Percent: number;
  formattedSummary: string;
}

/**
 * Executes accurate, live pricing calculations from database
 */
export async function executeLivePricingCalculator(input: PricingCalculationInput): Promise<PricingCalculationOutput> {
  let fabrics = INITIAL_FABRIC_MATERIALS;
  let cuts = INITIAL_APPAREL_CUTS;
  let tiers = INITIAL_QUANTITY_TIERS;

  try {
    const pricingRes = await getMasterPricingDb();
    if (pricingRes.success && pricingRes.data) {
      if (pricingRes.data.fabrics?.length) fabrics = pricingRes.data.fabrics;
      if (pricingRes.data.cuts?.length) cuts = pricingRes.data.cuts;
      if (pricingRes.data.tiers?.length) tiers = pricingRes.data.tiers;
    }
  } catch (err) {
    console.warn('[Pricing Tool] Error fetching live pricing from DB:', err);
  }

  const selectedFabric = fabrics.find(f => f.code === input.fabricCode) || fabrics[0];
  const selectedCut = cuts.find(c => c.code === input.cutCode) || cuts[0];
  const qty = Math.max(1, input.quantity || 1);

  const quote = calculateSublimationPrice({
    fabric: selectedFabric,
    cut: selectedCut,
    quantity: Math.min(qty, 5000),
    tiers,
  });

  const total = quote.finalUnitPrice * qty;
  const deposit = total * 0.5;
  const balance = total * 0.5;

  const formattedSummary = `
- Kuantiti: ${qty} helai
- Fabrik: ${selectedFabric.name} (${selectedFabric.weight_gsm}gsm)
- Potongan/Kolar: ${selectedCut.name}
- Harga Sehelai: ${formatCurrency(quote.finalUnitPrice)} (Diskaun ${quote.discountPercentage}% - ${quote.tierLabel})
- Jumlah Keseluruhan: ${formatCurrency(total)}
- Deposit 50%: ${formatCurrency(deposit)}
- Baki 50%: ${formatCurrency(balance)}
- Percuma: Cetakan nama, nombor & logo pasukan.
  `.trim();

  return {
    quantity: qty,
    fabricName: selectedFabric.name,
    cutName: selectedCut.name,
    rawUnitPrice: quote.rawUnitPrice,
    discountPercentage: quote.discountPercentage,
    tierLabel: quote.tierLabel,
    finalUnitPrice: quote.finalUnitPrice,
    totalAmount: total,
    deposit50Percent: deposit,
    balance50Percent: balance,
    formattedSummary,
  };
}

/**
 * Searches real-time customer orders from database by Order ID or phone number
 */
export async function executeOrderLookup(searchQuery: string): Promise<string | null> {
  const clean = searchQuery.trim();
  if (!clean) return null;

  try {
    const res = await getCustomerOrdersDb(clean);
    if (res.success && res.orders && res.orders.length > 0) {
      const order = res.orders[0];
      const depositVal = Number(order.deposit_amount || order.total_amount * 0.5);
      const balanceVal = Number(order.balance_amount || order.total_amount * 0.5);

      return `
MAKLUMAT PESANAN AKTIF DITEMUI (#${order.order_number}):
- Nama Pelanggan: ${order.customer_name || 'Pelanggan'}
- Rekaan Jersi: ${order.design_title || 'Custom Jersey'}
- Jumlah Kuantiti: ${order.total_quantity} helai
- Nilai Pesanan: RM ${Number(order.total_amount).toFixed(2)}
- Status Deposit: RM ${depositVal.toFixed(2)} (${order.payment_status || 'unpaid'})
- Baki Perlu Dibayar: RM ${balanceVal.toFixed(2)}
- Status Pengeluaran Kilang: ${order.status}
- Tracking Pos: ${order.tracking_number ? `${order.shipping_courier || 'Kurier'}: ${order.tracking_number}` : 'Belum dikeluarkan (masih dalam fasa pengeluaran)'}
- Pautan Semak Invois: https://sfvapparel.my/history
      `.trim();
    }
  } catch {}

  return null;
}
