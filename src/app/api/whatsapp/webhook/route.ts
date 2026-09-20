import { NextResponse } from 'next/server';
import { processAiCustomerReply } from '@/lib/whatsapp/ai-brain';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const event = payload.event;
    // WAHA sends events: 'message.upsert', 'message', 'message.any'
    if (event === 'message' || event === 'message.any' || event === 'message.upsert') {
      const data = payload.payload || payload.data;
      if (data && data.body) {
        const from = data.from || '';
        const fromMe = !!data.fromMe;
        const body = data.body || '';

        // Process asynchronously without blocking webhook return
        processAiCustomerReply({
          from,
          fromMe,
          body,
          senderName: data._data?.notifyName || data.notifyName,
        }).catch((err) => {
          console.error('[AI WhatsApp Webhook Error]', err);
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Webhook error';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'WAHA AI Webhook Endpoint Active' });
}
