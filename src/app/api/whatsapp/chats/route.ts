import { NextResponse } from 'next/server';
import { getWahaChats, getWahaStatus } from '@/lib/whatsapp/waha-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = await getWahaStatus();
    if (status.status !== 'WORKING') {
      return NextResponse.json({
        success: true,
        connected: false,
        status: status.status,
        chats: [],
      });
    }

    const chats = await getWahaChats(40);
    return NextResponse.json({
      success: true,
      connected: true,
      status: status.status,
      chats,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuatkan senarai perbualan';
    return NextResponse.json({ success: false, connected: false, error: message, chats: [] }, { status: 500 });
  }
}
