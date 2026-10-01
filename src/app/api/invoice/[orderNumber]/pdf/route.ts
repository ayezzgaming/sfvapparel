import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { generateOrderInvoicePdf } from '@/lib/invoice/pdf-invoice-generator';
import { Order } from '@/types/database';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const rawParam = params.orderNumber;
    if (!rawParam) {
      return new NextResponse('Order identifier is required', { status: 400 });
    }

    const orderNumber = decodeURIComponent(rawParam).trim();
    const supabase = getServiceSupabase();
    if (!supabase) {
      return new NextResponse('Database connection error', { status: 500 });
    }

    // Lookup order by order_number or ID
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .or(`order_number.eq.${orderNumber},id.eq.${orderNumber}`)
      .maybeSingle();

    if (error || !order) {
      return new NextResponse('Pesanan tidak dijumpai', { status: 404 });
    }

    const pdfBytes = await generateOrderInvoicePdf(order as Order);
    const filename = `Invois_SFV_${(order.order_number || 'INV').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'public, max-age=60, s-maxage=300',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gagal menjana fail PDF invois';
    console.error('[API /api/invoice/[orderNumber]/pdf] Error:', msg);
    return new NextResponse(msg, { status: 500 });
  }
}
