import { NextResponse } from 'next/server';
import { triggerN8nWorkflow } from '@/lib/n8n/n8n-client';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { webhookPath, payload = {} } = body;

    if (!webhookPath) {
      return NextResponse.json(
        { success: false, error: 'webhookPath diperlukan' },
        { status: 400 }
      );
    }

    const result = await triggerN8nWorkflow(webhookPath, payload);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat semasa mencetuskan n8n';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
