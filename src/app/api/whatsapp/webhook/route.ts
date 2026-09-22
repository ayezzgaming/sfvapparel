import { NextResponse } from 'next/server';
import { processAiCustomerReply } from '@/lib/whatsapp/ai-brain';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// In-memory deduplication cache (messageId -> timestamp)
const PROCESSED_MESSAGES = new Map<string, number>();
const RECENT_REPLIES = new Map<string, number>();

function cleanDeduplicationCache() {
  const now = Date.now();
  PROCESSED_MESSAGES.forEach((time, id) => {
    if (now - time > 60000) PROCESSED_MESSAGES.delete(id);
  });
  RECENT_REPLIES.forEach((time, from) => {
    if (now - time > 15000) RECENT_REPLIES.delete(from);
  });
}


export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const event = payload.event;

    // WAHA sends multiple duplicate events: 'message', 'message.any', 'message.upsert', 'message.create'
    // We STRICTLY process ONLY 'message' or 'message.create' to prevent 2x-3x duplicate triggers
    if (event && event !== 'message' && event !== 'message.create') {
      return NextResponse.json({ success: true, message: `Ignored secondary event: ${event}` });
    }

    const data = payload.payload || payload.data || payload;
    if (!data || (!data.body && !data.text)) {
      return NextResponse.json({ success: true, message: 'No message body' });
    }

    // Extract Message ID for absolute deduplication
    const msgId = data.id?._serialized || data.id?.id || data.id || data._data?.id?._serialized || '';
    const from = data.from || '';
    const fromMe = !!data.fromMe || !!data.id?.fromMe;
    const body = (data.body || data.text || '').trim();
    const senderName = data._data?.notifyName || data.notifyName || data.pushName || '';

    cleanDeduplicationCache();

    // Check 1: Deduplicate identical message ID
    if (msgId) {
      if (PROCESSED_MESSAGES.has(msgId)) {
        console.log(`[WhatsApp Webhook] Duplicate message ID ignored: ${msgId}`);
        return NextResponse.json({ success: true, message: 'Duplicate message ID ignored' });
      }
      PROCESSED_MESSAGES.set(msgId, Date.now());
    }

    // Check 2: Ignore if from me (sent by bot or human admin)
    if (fromMe) {
      return NextResponse.json({ success: true, message: 'Ignored fromMe message' });
    }

    // Check 3: Debounce lock per sender (must be at least 3s apart)
    const lastReplied = RECENT_REPLIES.get(from) || 0;
    if (Date.now() - lastReplied < 3000) {
      console.log(`[WhatsApp Webhook] Debounced rapid message from ${from}`);
      return NextResponse.json({ success: true, message: 'Debounced rapid message' });
    }
    RECENT_REPLIES.set(from, Date.now());

    console.log(`[WhatsApp Webhook] Processing single incoming message from: ${from}, text: "${body.slice(0, 40)}"`);

    // Process AI response
    const aiResult = await processAiCustomerReply({
      from,
      fromMe,
      body,
      senderName,
    });

    return NextResponse.json({ success: true, aiResult });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Webhook error';
    console.error('[AI WhatsApp Webhook Error]', err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'WAHA AI Webhook Endpoint Active', time: new Date().toISOString() });
}


