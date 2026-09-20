import { NextResponse } from 'next/server';
import { getWahaQrCode, startWahaSession, restartWahaSession, getWahaStatus } from '@/lib/whatsapp/waha-client';
import { syncLinkedPhoneToCompanySettings } from '@/app/actions/cmsActions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let status = await getWahaStatus();

    if (status.status === 'WORKING') {
      if (status.me?.id) {
        const pairedPhone = status.me.id.split('@')[0].split(':')[0];
        if (pairedPhone) {
          syncLinkedPhoneToCompanySettings(pairedPhone).catch(() => {});
        }
      }

      return NextResponse.json({
        status: status.status,
        qr: null,
        me: status.me,
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    // If session is failed, attempt clean restart
    if (status.status === 'FAILED') {
      await restartWahaSession();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      status = await getWahaStatus();
    } else if (status.status === 'STOPPED' || status.status === 'UNKNOWN') {
      await startWahaSession();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      status = await getWahaStatus();
    }

    const qrDataUrl = await getWahaQrCode();

    return NextResponse.json({
      status: status.status,
      qr: qrDataUrl,
      me: status.me,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuatkan QR Code WhatsApp';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
