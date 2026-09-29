import { NextResponse } from 'next/server';
import { getWahaMessages, sendWahaMessage } from '@/lib/whatsapp/waha-client';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, getAdminFromSessionToken } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return await getAdminFromSessionToken(sessionToken);
}

export async function GET(req: Request) {
  try {
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Akses tidak dibenarkan' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ success: false, error: 'chatId diperlukan' }, { status: 400 });
    }

    const messages = await getWahaMessages(chatId, 50);
    return NextResponse.json({ success: true, messages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuatkan rekod mesej';
    return NextResponse.json({ success: false, error: message, messages: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminAuth();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Akses tidak dibenarkan' }, { status: 401 });
    }

    const { chatId, message } = await req.json();

    if (!chatId || !message) {
      return NextResponse.json({ success: false, error: 'chatId dan message diperlukan' }, { status: 400 });
    }

    const res = await sendWahaMessage(chatId, message);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghantar mesej balasan';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

