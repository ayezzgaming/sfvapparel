import { NextResponse } from 'next/server';
import { getWahaStatus } from '@/lib/whatsapp/waha-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getWahaStatus();
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyemak status WhatsApp';
    return NextResponse.json(
      { status: 'UNKNOWN', error: message },
      { status: 500 }
    );
  }
}
