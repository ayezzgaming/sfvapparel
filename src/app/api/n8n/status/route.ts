import { NextResponse } from 'next/server';
import { checkN8nHealth } from '@/lib/n8n/n8n-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = await checkN8nHealth();
    return NextResponse.json({
      success: true,
      data: health,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Gagal menyemak status n8n';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
