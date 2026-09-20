import { NextResponse } from 'next/server';
import { getWahaStatus } from '@/lib/whatsapp/waha-client';
import { syncLinkedPhoneToCompanySettings } from '@/app/actions/cmsActions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getWahaStatus();

    // Auto-sync paired WhatsApp phone number to database company settings
    if (status.status === 'WORKING' && status.me?.id) {
      const pairedPhone = status.me.id.split('@')[0].split(':')[0];
      if (pairedPhone) {
        syncLinkedPhoneToCompanySettings(pairedPhone).catch(() => {});
      }
    }

    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyemak status WhatsApp';
    return NextResponse.json(
      { status: 'UNKNOWN', error: message },
      { status: 500 }
    );
  }
}
