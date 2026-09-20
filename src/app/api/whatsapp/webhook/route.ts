import { NextResponse } from 'next/server';
import { processAiCustomerReply } from '@/lib/whatsapp/ai-brain';

export const dynamic = 'force-dynamic';
export const maxDuration = 30; // Allow sufficient execution time for LiteLLM inference and WAHA response

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const event = payload.event;
    // WAHA sends events: 'message', 'message.any', 'message.upsert', 'message.create'
    if (
      event === 'message' || 
      event === 'message.any' || 
      event === 'message.upsert' || 
      event === 'message.create' ||
      !event // fallback if raw message payload is sent
    ) {
      const data = payload.payload || payload.data || payload;
      if (data && (data.body || data.text)) {
        const from = data.from || '';
        const fromMe = !!data.fromMe;
        const body = data.body || data.text || '';
        const senderName = data._data?.notifyName || data.notifyName || data.pushName || '';

        console.log(`[WhatsApp Webhook] Incoming message from: ${from}, fromMe: ${fromMe}, text: ${body.slice(0, 50)}`);

        // Await AI response processing so Vercel Serverless Function does not freeze execution
        const aiResult = await processAiCustomerReply({
          from,
          fromMe,
          body,
          senderName,
        });

        console.log(`[WhatsApp Webhook] AI processing completed:`, aiResult);
        return NextResponse.json({ success: true, aiResult });
      }
    }

    return NextResponse.json({ success: true, message: 'Event ignored' });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Webhook error';
    console.error('[AI WhatsApp Webhook Error]', err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'WAHA AI Webhook Endpoint Active', time: new Date().toISOString() });
}

