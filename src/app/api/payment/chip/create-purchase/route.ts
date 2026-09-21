import { NextRequest, NextResponse } from 'next/server';
import { createChipPurchase } from '@/lib/payment/chip-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      orderNumber,
      customerName,
      customerEmail,
      customerPhone,
      totalAmount,
      itemsDescription,
    } = body;

    if (!orderNumber || !totalAmount) {
      return NextResponse.json(
        { success: false, message: 'Nombor pesanan dan jumlah bayaran diperlukan.' },
        { status: 400 }
      );
    }

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    const result = await createChipPurchase({
      orderNumber,
      customerName: customerName || 'Pelanggan SFV Apparel',
      customerEmail: customerEmail || '',
      customerPhone: customerPhone || '',
      totalAmount: Number(totalAmount),
      itemsDescription: itemsDescription || `Tempahan Kustom ${orderNumber}`,
      baseUrl,
    });

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat memproses sesi pembayaran CHIP.';
    console.error('[API create-purchase error]:', err);
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
