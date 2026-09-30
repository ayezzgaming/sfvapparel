import { NextResponse } from 'next/server';
import { getWahaStatus } from '@/lib/whatsapp/waha-client';
import { syncLinkedPhoneToCompanySettings } from '@/app/actions/cmsActions';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, getAdminFromSessionToken } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    const admin = await getAdminFromSessionToken(sessionToken);

    if (!admin) {
      return NextResponse.json(
        { status: 'UNAUTHORIZED', error: 'Akses tidak dibenarkan' },
        { status: 401 }
      );
    }

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
