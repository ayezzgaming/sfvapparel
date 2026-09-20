import { NextResponse } from 'next/server';
import { sendWahaMessage, sendWahaImage } from '@/lib/whatsapp/waha-client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, message, imageUrl, caption } = body;

    if (!to) {
      return NextResponse.json({ success: false, error: 'Nombor telefon WhatsApp diperlukan' }, { status: 400 });
    }

    if (imageUrl) {
      const res = await sendWahaImage(to, imageUrl, caption || message);
      return NextResponse.json(res);
    }

    if (!message) {
      return NextResponse.json({ success: false, error: 'Mesej teks diperlukan' }, { status: 400 });
    }

    const res = await sendWahaMessage(to, message);
    return NextResponse.json(res);
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat semasa menghantar WhatsApp';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
