import { NextResponse } from 'next/server';
import { startWahaSession, logoutWahaSession } from '@/lib/whatsapp/waha-client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { action } = await req.json().catch(() => ({ action: 'start' }));

    if (action === 'logout') {
      const res = await logoutWahaSession();
      return NextResponse.json(res);
    }

    const res = await startWahaSession();
    return NextResponse.json(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ralat operasi sesi WhatsApp';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
