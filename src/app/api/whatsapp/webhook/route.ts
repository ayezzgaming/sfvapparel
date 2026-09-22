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
    if (!data) {
      return NextResponse.json({ success: true, message: 'No data in payload' });
    }

    // Extract Message ID for absolute deduplication
    const msgId = data.id?._serialized || data.id?.id || data.id || data._data?.id?._serialized || '';
    const from = data.from || '';
    const fromMe = !!data.fromMe || !!data.id?.fromMe;
    const rawText = (data.body || data.text || data._data?.body || '').trim();
    const rawCaption = (data.caption || data._data?.caption || '').trim();
    const hasMedia = !!(data.hasMedia || data.mediaUrl || data.media?.url || (data._data?.mimetype && !data._data?.mimetype.startsWith('text')));
    const mediaUrl = data.mediaUrl || data.media?.url || (data.media?.id ? `/api/files/${data.media.id}` : '') || '';
    const mediaMimetype = data.media?.mimetype || data._data?.mimetype || '';
    const senderName = data._data?.notifyName || data.notifyName || data.pushName || '';

    // If message is media, prioritize caption or generate contextual prompt
    const effectiveBody = rawCaption || rawText || (hasMedia ? 'Pelanggan menghantar gambar jersi untuk disemak dan dipadankan dengan katalog kilang.' : '');

    if (!effectiveBody && !hasMedia) {
      return NextResponse.json({ success: true, message: 'No text or media content found' });
    }

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

    console.log(`[WhatsApp Webhook] Processing incoming message from: ${from}, text: "${effectiveBody.slice(0, 40)}", hasMedia: ${hasMedia}`);

    // 1. Forward directly to n8n Super Power Multi-Agent AI Engine on VPS (100% n8n Orchestration)
    try {
      const n8nRes = await fetch('http://187.127.223.53:5678/webhook/whatsapp-incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          body: {
            from,
            fromMe,
            body: effectiveBody,
            caption: rawCaption,
            hasMedia,
            mediaUrl,
            mediaMimetype,
            senderName,
            id: msgId
          }
        }),
      });

      if (n8nRes.ok) {
        console.log(`[WhatsApp Webhook] Dispatched to n8n VPS Engine successfully for ${from}`);
        return NextResponse.json({ success: true, engine: 'n8n_superpower_vps' });
      }
    } catch (n8nErr) {
      console.warn('[WhatsApp Webhook] n8n engine unreachable, activating safety fallback:', n8nErr);
    }

    // 2. Safety Fallback: Process AI response locally if VPS n8n is offline
    const aiResult = await processAiCustomerReply({
      from,
      fromMe,
      body: effectiveBody,
      senderName,
      hasMedia,
      mediaUrl,
      mediaMimetype,
    });

    return NextResponse.json({ success: true, engine: 'safety_fallback', aiResult });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Webhook error';
    console.error('[AI WhatsApp Webhook Error]', err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'WAHA AI Webhook Endpoint Active', time: new Date().toISOString() });
}


