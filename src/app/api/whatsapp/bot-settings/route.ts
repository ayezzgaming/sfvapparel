import { NextResponse } from 'next/server';
import { getWhatsAppBotSettings, updateWhatsAppBotSettings } from '@/lib/whatsapp/bot-config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getWhatsAppBotSettings(true);
    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Gagal memuatkan tetapan bot WhatsApp';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { auto_reply_enabled, paused_reason, updated_by } = body;

    if (typeof auto_reply_enabled !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'Parameter auto_reply_enabled (boolean) diperlukan' 
      }, { status: 400 });
    }

    const updated = await updateWhatsAppBotSettings({
      auto_reply_enabled,
      paused_reason,
      updated_by,
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: auto_reply_enabled
        ? 'Balasan automatik Chatbot WhatsApp telah DIAKTIFKAN.'
        : 'Balasan automatik Chatbot WhatsApp telah DINYAHAKTIFKAN (OTP & Notifikasi pesanan tetap berfungsi normal).',
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Gagal mengemaskini tetapan bot WhatsApp';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
