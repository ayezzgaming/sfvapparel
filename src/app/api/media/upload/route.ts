import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const VPS_VAULT_WEBHOOK = 'http://187.127.223.53:5678/webhook/sfv-media-vault';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'order-artwork';

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Tiada fail diberikan.' },
        { status: 400 }
      );
    }

    const fileName = file.name || `artwork-${Date.now()}.png`;
    const mimeType = file.type || 'application/octet-stream';
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileBase64 = buffer.toString('base64');

    // 1. PRIMARY: Upload directly to VPS Media Vault (0 bytes Supabase quota consumed)
    try {
      const vpsRes = await fetch(VPS_VAULT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          mimeType,
          fileBase64,
          folder,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (vpsRes.ok) {
        const vpsData = await vpsRes.json();
        if (vpsData.success && vpsData.url) {
          return NextResponse.json({
            success: true,
            url: vpsData.url,
            fileName: vpsData.fileName || fileName,
            storedOn: 'VPS-SSD-187.127.223.53',
            sizeBytes: buffer.length,
          });
        }
      }
    } catch (vpsErr) {
      console.warn('[MediaUpload] VPS Vault unreachable, falling back to Supabase Storage:', vpsErr);
    }

    // 2. FALLBACK: If VPS is temporarily offline, use Supabase Storage as backup
    const supabase = getServiceSupabase();
    if (supabase) {
      const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${cleanName}`;

      const { error: upErr } = await supabase.storage
        .from('designs')
        .upload(storagePath, buffer, {
          contentType: mimeType,
          upsert: false,
        });

      if (!upErr) {
        const { data: pubData } = supabase.storage.from('designs').getPublicUrl(storagePath);
        if (pubData?.publicUrl) {
          return NextResponse.json({
            success: true,
            url: pubData.publicUrl,
            fileName,
            storedOn: 'Supabase-Storage-Backup',
            sizeBytes: buffer.length,
          });
        }
      }
    }

    return NextResponse.json(
      { success: false, message: 'Gagal memuat naik fail ke storan VPS mahupun storan sandaran.' },
      { status: 500 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ralat semasa memproses muat naik fail';
    console.error('[MediaUpload Error]:', err);
    return NextResponse.json(
      { success: false, message: msg },
      { status: 500 }
    );
  }
}
