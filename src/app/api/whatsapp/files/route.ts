import { NextResponse } from 'next/server';

const WAHA_URL = process.env.WHATSAPP_API_URL || 'http://187.127.223.53:3000';
const WAHA_KEY = process.env.WHATSAPP_API_KEY || 'sfv_waha_master_key_2026';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fileParam = searchParams.get('file');
    const urlParam = searchParams.get('url');

    let targetUrl = '';
    if (fileParam) {
      // Decode if encoded, and normalize
      const cleanPath = decodeURIComponent(fileParam).replace(/^\/+/, '');
      targetUrl = `${WAHA_URL}/api/files/${cleanPath}`;
    } else if (urlParam) {
      const decoded = decodeURIComponent(urlParam);
      if (decoded.startsWith('http://localhost:3000/api/files/')) {
        const path = decoded.replace('http://localhost:3000/api/files/', '');
        targetUrl = `${WAHA_URL}/api/files/${path}`;
      } else if (decoded.startsWith('/api/files/')) {
        const path = decoded.replace('/api/files/', '');
        targetUrl = `${WAHA_URL}/api/files/${path}`;
      } else if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        // Direct proxy
        targetUrl = decoded;
      }
    }

    if (!targetUrl) {
      return NextResponse.json({ error: 'Parameter fail tidak sah' }, { status: 400 });
    }

    const res = await fetch(targetUrl, {
      headers: {
        'X-Api-Key': WAHA_KEY,
      },
      cache: 'force-cache',
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Fail tidak dijumpai di server WhatsApp' },
        { status: res.status }
      );
    }

    const contentType = res.headers.get('content-type') || 'application/octet-stream';
    const contentDisposition = res.headers.get('content-disposition');
    const buffer = await res.arrayBuffer();

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
    };

    if (contentDisposition) {
      responseHeaders['Content-Disposition'] = contentDisposition;
    }

    return new NextResponse(buffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ralat proksi media WhatsApp';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
