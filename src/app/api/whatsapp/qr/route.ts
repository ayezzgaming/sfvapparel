import { NextResponse } from 'next/server';
import { getWahaQrCode, startWahaSession, getWahaStatus } from '@/lib/whatsapp/waha-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getWahaStatus();

    if (status.status === 'WORKING') {
      return NextResponse.json({
        status: status.status,
        qr: null,
        me: status.me,
      });
    }

    // If session is stopped or unknown, initiate start
    if (status.status === 'STOPPED' || status.status === 'UNKNOWN') {
      await startWahaSession();
      // Wait a moment for engine to initialize QR
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }

    const qrDataUrl = await getWahaQrCode();

    return NextResponse.json({
      status: status.status,
      qr: qrDataUrl,
      me: status.me,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuatkan QR Code WhatsApp';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
