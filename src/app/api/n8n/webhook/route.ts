import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}));
    console.log('[n8n Webhook Inbound Event]', payload);

    return NextResponse.json({
      success: true,
      message: 'Event diterima daripada enjin n8n',
      receivedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat webhook n8n';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
