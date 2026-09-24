import { NextResponse } from 'next/server';
import { processAiCustomerReply } from '@/lib/whatsapp/ai-brain';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// ─── Anti-Ban Rate Limiting & Deduplication ─────────────────────────────────
const PROCESSED_MESSAGES = new Map<string, number>();  // msgId → timestamp
const RECENT_REPLIES = new Map<string, number>();       // from → last reply timestamp
const OUTBOUND_COUNTER = { count: 0, resetAt: Date.now() + 86400000 }; // 24h window

const MAX_DAILY_REPLIES = 200;     // Hard daily limit for AI outbound replies
const MIN_REPLY_INTERVAL_MS = 5000; // Minimum 5s between replies to same contact

function cleanDeduplicationCache() {
  const now = Date.now();
  PROCESSED_MESSAGES.forEach((time, id) => {
    if (now - time > 120000) PROCESSED_MESSAGES.delete(id);
  });
  RECENT_REPLIES.forEach((time, from) => {
    if (now - time > 60000) RECENT_REPLIES.delete(from);
  });
  if (now > OUTBOUND_COUNTER.resetAt) {
    OUTBOUND_COUNTER.count = 0;
    OUTBOUND_COUNTER.resetAt = now + 86400000;
  }
}

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ success: false, message: 'Invalid payload' }, { status: 400 });
    }

    const event = payload.event;

    // ── Gate 1: Only process primary message events ──────────────────────────
    if (event && event !== 'message' && event !== 'message.create') {
      return NextResponse.json({ success: true, message: `Ignored secondary event: ${event}` });
    }

    const data = payload.payload || payload.data || payload;
    if (!data) {
      return NextResponse.json({ success: true, message: 'No data in payload' });
    }

    const from = (data.from || '').trim();
    const fromMe = !!data.fromMe || !!data.id?.fromMe;

    // ── Gate 2: Reject group chats, broadcasts, status AT THE GATEWAY ────────
    if (
      !from ||
      from.includes('@g.us') ||
      from.includes('@broadcast') ||
      from.includes('status@') ||
      from.includes('@newsletter')
    ) {
      return NextResponse.json({ success: true, message: 'Ignored: group/broadcast/status' });
    }

    // ── Gate 3: Reject fromMe messages unless self-test ───────────────────────
    const to = data.to || data._data?.to || '';
    const isSelfTest = fromMe && (!to || to === from || to.replace('@c.us','') === from.replace('@c.us',''));
    if (fromMe && !isSelfTest) {
      return NextResponse.json({ success: true, message: 'Ignored fromMe message' });
    }

    // ── Gate 4: Anti-ban daily outbound rate limit ────────────────────────────
    cleanDeduplicationCache();
    if (OUTBOUND_COUNTER.count >= MAX_DAILY_REPLIES) {
      console.warn(`[Webhook] Daily reply limit reached (${MAX_DAILY_REPLIES}). Throttling.`);
      return NextResponse.json({ success: true, message: 'Daily limit reached — throttled' });
    }

    // ── Gate 5: Message ID deduplication ──────────────────────────────────────
    const msgId = data.id?._serialized || data.id?.id || data.id || data._data?.id?._serialized || '';
    if (msgId) {
      if (PROCESSED_MESSAGES.has(msgId)) {
        return NextResponse.json({ success: true, message: 'Duplicate message ID ignored' });
      }
      PROCESSED_MESSAGES.set(msgId, Date.now());
    }

    // ── Gate 6: Per-contact debounce (5s cooldown) ────────────────────────────
    const lastReplied = RECENT_REPLIES.get(from) || 0;
    if (Date.now() - lastReplied < MIN_REPLY_INTERVAL_MS) {
      console.log(`[Webhook] Debounced rapid message from ${from}`);
      return NextResponse.json({ success: true, message: 'Debounced rapid message' });
    }
    RECENT_REPLIES.set(from, Date.now());

    // ── Extract message content ───────────────────────────────────────────────
    const rawText = (data.body || data.text || data._data?.body || '').trim();
    const rawCaption = (data.caption || data._data?.caption || '').trim();
    const hasMedia = !!(data.hasMedia || data.mediaUrl || data.media?.url || (data._data?.mimetype && !data._data?.mimetype.startsWith('text')));
    const mediaUrl = data.mediaUrl || data.media?.url || (data.media?.id ? `/api/files/${data.media.id}` : '') || '';
    const mediaMimetype = data.media?.mimetype || data._data?.mimetype || '';
    const senderName = data._data?.notifyName || data.notifyName || data.pushName || '';

    const effectiveBody = rawCaption || rawText || (hasMedia ? 'Pelanggan menghantar gambar jersi untuk disemak dan dipadankan dengan katalog kilang.' : '');

    if (!effectiveBody && !hasMedia) {
      return NextResponse.json({ success: true, message: 'No text or media content found' });
    }

    console.log(`[Webhook] Processing from: ${from} | "${effectiveBody.slice(0, 50)}" | media: ${hasMedia}`);

    // ── Process AI Response ───────────────────────────────────────────────────
    const aiResult = await processAiCustomerReply({
      from,
      fromMe,
      body: effectiveBody,
      senderName,
      hasMedia,
      mediaUrl,
      mediaMimetype,
    });

    if (aiResult.replied) {
      OUTBOUND_COUNTER.count++;
    }

    // ── Forward to N8N for logging (background, fire-and-forget) ─────────────
    fetch('http://187.127.223.53:5678/webhook/whatsapp-incoming', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: { from, fromMe, body: effectiveBody, caption: rawCaption, hasMedia, mediaUrl, mediaMimetype, senderName, id: msgId, aiResult }
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true, aiResult });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Webhook error';
    console.error('[AI WhatsApp Webhook Error]', err);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'WAHA AI Webhook Endpoint Active',
    dailyReplies: OUTBOUND_COUNTER.count,
    dailyLimit: MAX_DAILY_REPLIES,
    time: new Date().toISOString()
  });
}
