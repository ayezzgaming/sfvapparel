import { NextResponse } from 'next/server';
import { calculateSublimationPrice, calculateDtfPrice, formatCurrency } from '@/lib/pricing-calculator';
import { INITIAL_APPAREL_CUTS, INITIAL_FABRIC_MATERIALS, INITIAL_DTF_DIMENSIONS, INITIAL_QUANTITY_TIERS } from '@/lib/store/seed-data';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { quantity = 10, printType = 'sublimation', collarType = 'roundneck' } = await req.json();

    const cleanQty = Math.max(1, Number(quantity) || 10);
    const cleanPrint = printType === 'dtf' ? 'dtf' : 'sublimation';

    if (cleanPrint === 'dtf') {
      const dimension = INITIAL_DTF_DIMENSIONS[1] || INITIAL_DTF_DIMENSIONS[0]; // A4 default
      const quote = calculateDtfPrice({
        dimension,
        optionType: 'with_garment',
        quantity: cleanQty,
        tiers: INITIAL_QUANTITY_TIERS,
      });

      return NextResponse.json({
        success: true,
        quantity: cleanQty,
        printType: 'Cetakan DTF (Siap Baju)',
        sizeSpec: dimension.dimensions_desc,
        tierLabel: quote.tierLabel,
        unitPrice: formatCurrency(quote.finalUnitPrice),
        totalAmount: formatCurrency(quote.finalTotal),
        savings: formatCurrency(quote.totalSavings),
        discountPercent: `${quote.discountPercentage}%`,
        estimatedDays: '3 - 5 Hari Bekerja',
        note: cleanQty < 5 ? 'Nota: Kuantiti disyorkan adalah minima 5 helai untuk penjimatan harga pukal kilang.' : 'Harga direct kilang siap baju t-shirt cotton berkualiti & cetakan premium.',
      });
    } else {
      const fabric = INITIAL_FABRIC_MATERIALS[0]; // Drifit Milano
      const cut = collarType === 'polo' ? INITIAL_APPAREL_CUTS[3] : INITIAL_APPAREL_CUTS[0]; // Polo or Roundneck Crew
      
      const quote = calculateSublimationPrice({
        fabric,
        cut,
        quantity: cleanQty,
        tiers: INITIAL_QUANTITY_TIERS,
      });

      return NextResponse.json({
        success: true,
        quantity: cleanQty,
        printType: 'Sublimasi Penuh (Full Sublimation)',
        fabricName: fabric.name,
        cutName: cut.name,
        tierLabel: quote.tierLabel,
        unitPrice: formatCurrency(quote.finalUnitPrice),
        totalAmount: formatCurrency(quote.finalTotal),
        savings: formatCurrency(quote.totalSavings),
        discountPercent: `${quote.discountPercentage}%`,
        estimatedDays: '7 - 10 Hari Bekerja',
        note: cleanQty < 5 ? 'Nota: Kuantiti disyorkan adalah minima 5 helai untuk penjimatan harga pukal kilang.' : 'Harga direct kilang siap kustom penuh corak, logo, nama dan nombor percuma.',
      });
    }
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat pengiraan sebut harga';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
