import { NextResponse } from 'next/server';
import { getWahaMessages, sendWahaMessage } from '@/lib/whatsapp/waha-client';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'chatId diperlukan' }, { status: 400 });
    }

    const messages = await getWahaMessages(chatId, 50);
    return NextResponse.json({ messages });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal memuatkan rekod mesej';
    return NextResponse.json({ error: message, messages: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { chatId, message } = await req.json();

    if (!chatId || !message) {
      return NextResponse.json({ error: 'chatId dan message diperlukan' }, { status: 400 });
    }

    const res = await sendWahaMessage(chatId, message);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menghantar mesej balasan';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
