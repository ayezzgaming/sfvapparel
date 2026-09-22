import { NextResponse } from 'next/server';
import { getOrdersDb } from '@/app/actions/orderActions';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { query, phone } = await req.json();

    const cleanQuery = (query || '').trim().toLowerCase();
    const cleanPhone = (phone || '').replace(/[\s\-\+\(\)]/g, '');

    const ordersRes = await getOrdersDb();
    const liveOrders = ordersRes.success && ordersRes.orders ? ordersRes.orders : [];

    const found = liveOrders.find((o) => {
      const matchNum = o.order_number.toLowerCase().includes(cleanQuery);
      const matchPhone = cleanPhone && o.customer_phone.replace(/[\s\-\+\(\)]/g, '').includes(cleanPhone);
      const matchCustomer = cleanQuery && o.customer_name.toLowerCase().includes(cleanQuery);
      return matchNum || matchPhone || matchCustomer;
    });

    if (!found) {
      return NextResponse.json({
        found: false,
        message: 'Tiada rekod pesanan ditemui untuk carian ini. Sila pastikan nombor pesanan (cth: ORD-2026-001) betul.',
      });
    }

    const statusLabels: Record<string, string> = {
      pending_proof: 'Menunggu Pengesahan Mockup Rekaan',
      proof_approved: 'Mockup Telah Diluluskan, Masuk Giliran Pengeluaran',
      in_printing: 'Sedang Dicetak di Mesin Sublimasi / DTF Kilang',
      heat_press: 'Proses Pindahan Haba (Heat Press)',
      sewing: 'Proses Jahitan & Kemasan Jersi',
      qc_check: 'Pemeriksaan Kualiti (QC)',
      ready_to_ship: 'Pesanan Sedia Untuk Dihantar / Dipos',
      delivered: 'Selesai & Telah Diterima',
      cancelled: 'Dibatalkan',
    };

    return NextResponse.json({
      found: true,
      order: {
        orderNumber: found.order_number,
        customerName: found.customer_name,
        designTitle: found.design_title,
        printType: found.print_type === 'sublimation' ? 'Sublimasi Penuh' : 'DTF Premium',
        totalQuantity: found.total_quantity,
        totalAmount: `RM${found.total_amount}`,
        status: statusLabels[found.status] || found.status,
        trackingNumber: found.tracking_number || 'Belum dikeluarkan (menunggu proses pos)',
        productionNotes: found.production_notes || 'Tiada catatan khas.',
        createdAt: found.created_at,
      },
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat semakan status pesanan';
    return NextResponse.json({ found: false, error }, { status: 500 });
  }
}
