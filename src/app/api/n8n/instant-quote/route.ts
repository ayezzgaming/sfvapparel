import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { calculateSublimationPrice, formatCurrency } from '@/lib/pricing-calculator';
import {
  INITIAL_FABRIC_MATERIALS,
  INITIAL_APPAREL_CUTS,
  INITIAL_QUANTITY_TIERS,
} from '@/lib/store/seed-data';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      quantity = 20,
      fabricName = 'Microfiber Eyelet',
      cutName = 'Roundneck Raglan',
      customerName = 'Pelanggan',
    } = body;

    const numQty = Math.max(1, Number(quantity) || 20);

    // Fetch live pricing data from Supabase
    let fabrics = INITIAL_FABRIC_MATERIALS;
    let cuts = INITIAL_APPAREL_CUTS;
    let tiers = INITIAL_QUANTITY_TIERS;

    try {
      const supabase = getServiceSupabase();
      if (supabase) {
        const [fabRes, cutRes, tierRes] = await Promise.all([
          supabase.from('fabric_materials').select('*').eq('is_active', true),
          supabase.from('apparel_cuts').select('*').eq('is_active', true),
          supabase.from('quantity_tier_discounts').select('*'),
        ]);

        if (fabRes.data && fabRes.data.length > 0) fabrics = fabRes.data;
        if (cutRes.data && cutRes.data.length > 0) cuts = cutRes.data;
        if (tierRes.data && tierRes.data.length > 0) tiers = tierRes.data;
      }
    } catch (err) {
      console.warn('[instant-quote] Supabase fallback to initial seed data:', err);
    }

    // Match closest fabric and cut
    const matchedFabric =
      fabrics.find(
        (f) =>
          f.name.toLowerCase().includes(fabricName.toLowerCase()) ||
          fabricName.toLowerCase().includes(f.name.toLowerCase())
      ) || fabrics[0];

    const matchedCut =
      cuts.find(
        (c) =>
          c.name.toLowerCase().includes(cutName.toLowerCase()) ||
          cutName.toLowerCase().includes(c.name.toLowerCase())
      ) || cuts[0];

    // Compute price quote
    const quote = calculateSublimationPrice({
      fabric: matchedFabric,
      cut: matchedCut,
      quantity: numQty,
      tiers,
    });

    const depositAmount = Math.round(quote.finalTotal * 0.5 * 100) / 100;
    const balanceAmount = quote.finalTotal - depositAmount;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://sfvapparel.my';

    // Build structured WhatsApp reply text
    const waReplyText = `*SEBUT HARGA RASMI JERSI SUBLIMASI*
*SFV APPAREL (KILANG CETAKAN JERSI)*
========================================
Hai *${customerName}*, berikut adalah anggaran sebut harga bagi tempahan anda:

*SPESIFIKASI TEMPAHAN:*
• *Kuantiti:* ${numQty} helai
• *Fabrik:* ${matchedFabric.name} (${matchedFabric.weight_gsm}gsm, ${matchedFabric.breathability})
• *Potongan:* ${matchedCut.name}
• *Pakej Diskaun:* Tier ${quote.tierLabel} (${quote.discountPercentage}% Diskaun)

*KIRAAN HARGA PUKAL KILANG:*
• Harga Asal Seunit: ${formatCurrency(quote.rawUnitPrice)}
• *Harga Tawaran Seunit:* *${formatCurrency(quote.finalUnitPrice)}* / helai
• *Jumlah Keseluruhan (${numQty} helai):* *${formatCurrency(quote.finalTotal)}*
${quote.totalSavings > 0 ? `• *Penjimatan Anda:* ${formatCurrency(quote.totalSavings)}` : ''}

*STRUKTUR PEMBAYARAN:*
• *Deposit Mula Tempah (50%):* *${formatCurrency(depositAmount)}*
• *Baki Siap Jahit (50%):* *${formatCurrency(balanceAmount)}*

*PERCUMA BERSAMA TEMPAHAN:*
- Percuma cetakan nama, nombor & logo pasukan.
- Jaminan siap 7-10 hari bekerja terus dari kilang.

========================================
*Lihat & Bina Reka Bentuk 3D Sekarang:*
${appUrl}/customize

Balas *SETUJU* atau hantar logo pasukan anda di sini untuk pereka grafik kami sediakan mockup rasmi!`;

    return NextResponse.json({
      success: true,
      quote: {
        quantity: numQty,
        fabric: matchedFabric.name,
        cut: matchedCut.name,
        rawUnitPrice: quote.rawUnitPrice,
        finalUnitPrice: quote.finalUnitPrice,
        discountPercentage: quote.discountPercentage,
        subtotal: quote.subtotal,
        totalSavings: quote.totalSavings,
        finalTotal: quote.finalTotal,
        depositAmount,
        balanceAmount,
      },
      formattedText: waReplyText,
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat semasa mengira sebut harga';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
