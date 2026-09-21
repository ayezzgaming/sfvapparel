import { NextResponse } from 'next/server';
import { startWahaSession, logoutWahaSession, restartWahaSession, getWahaStatus, getWahaQrCode } from '@/lib/whatsapp/waha-client';
import { syncLinkedPhoneToCompanySettings } from '@/app/actions/cmsActions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let status = await getWahaStatus();

    // Auto-sync paired phone number if WORKING
    if (status.status === 'WORKING') {
      if (status.me?.id) {
        const pairedPhone = status.me.id.split('@')[0].split(':')[0];
        if (pairedPhone) {
          syncLinkedPhoneToCompanySettings(pairedPhone).catch(() => {});
        }
      }
      return NextResponse.json({
        success: true,
        data: {
          name: status.name,
          status: status.status,
          qr: null,
          me: status.me,
        },
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }

    // If STOPPED or UNKNOWN, attempt starting session
    if (status.status === 'STOPPED' || status.status === 'UNKNOWN') {
      await startWahaSession();
      await new Promise((r) => setTimeout(r, 1500));
      status = await getWahaStatus();
    } else if (status.status === 'FAILED') {
      await restartWahaSession();
      await new Promise((r) => setTimeout(r, 1500));
      status = await getWahaStatus();
    }

    let qr: string | null = null;
    if (status.status === 'SCAN_QR_CODE' || status.status === 'STARTING') {
      qr = await getWahaQrCode();
    }

    return NextResponse.json({
      success: true,
      data: {
        name: status.name,
        status: status.status,
        qr,
        me: status.me,
      },
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyemak status sesi WhatsApp';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { action } = await req.json().catch(() => ({ action: 'start' }));

    if (action === 'logout') {
      const res = await logoutWahaSession();
      // Immediately trigger start so WAHA generates fresh QR code
      await new Promise((r) => setTimeout(r, 1000));
      await startWahaSession();
      return NextResponse.json(res);
    }

    if (action === 'restart') {
      const res = await restartWahaSession();
      return NextResponse.json(res);
    }

    const res = await startWahaSession();
    return NextResponse.json(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ralat operasi sesi WhatsApp';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
