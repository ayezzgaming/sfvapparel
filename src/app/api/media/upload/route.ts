import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import sharp from 'sharp';

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

    const originalFileName = file.name || `artwork-${Date.now()}.png`;
    const originalMime = file.type || 'application/octet-stream';
    const rawBuffer = Buffer.from(await file.arrayBuffer());
    const originalSize = rawBuffer.length;

    let processedBuffer = rawBuffer;
    let finalMime = originalMime;
    let finalFileName = originalFileName;

    // 🌟 High-Definition Smart Compression (Sharp) for images
    if (originalMime.startsWith('image/')) {
      try {
        const image = sharp(rawBuffer);
        const metadata = await image.metadata();

        // 1. Resize if unreasonably oversized (> 2560px) while maintaining crisp aspect ratio
        let transform = image.rotate(); // auto-orient from EXIF
        if (metadata.width && metadata.width > 2560) {
          transform = transform.resize(2560, null, {
            withoutEnlargement: true,
            fit: 'inside',
          });
        }

        // 2. High-fidelity compression: WebP or PNG with high visual fidelity (no degradation)
        if (originalMime.includes('png') || originalMime.includes('jpeg') || originalMime.includes('jpg') || originalMime.includes('webp')) {
          processedBuffer = await transform
            .webp({
              quality: 90, // High quality, crystal crisp logo & typography
              effort: 6,   // Maximum compression algorithm effort
              smartSubsample: true,
            })
            .toBuffer();
          finalMime = 'image/webp';
          finalFileName = originalFileName.replace(/\.[^/.]+$/, '') + '.webp';
        }
      } catch (sharpErr) {
        console.warn('[MediaUpload] Sharp compression warning, using original:', sharpErr);
        processedBuffer = rawBuffer;
      }
    }

    const compressedSize = processedBuffer.length;
    const fileBase64 = processedBuffer.toString('base64');
    const savedPercentage = originalSize > 0 ? Math.round(((originalSize - compressedSize) / originalSize) * 100) : 0;

    // 1. PRIMARY: Upload directly to VPS Media Vault (0 bytes Supabase quota consumed)
    try {
      const vpsRes = await fetch(VPS_VAULT_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: finalFileName,
          mimeType: finalMime,
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
            fileName: vpsData.fileName || finalFileName,
            storedOn: 'VPS-SSD-187.127.223.53',
            sizeBytes: compressedSize,
            originalSizeBytes: originalSize,
            savedPercentage,
          });
        }
      }
    } catch (vpsErr) {
      console.warn('[MediaUpload] VPS Vault unreachable, falling back to Supabase Storage:', vpsErr);
    }

    // 2. FALLBACK: If VPS is temporarily offline, use Supabase Storage as backup
    const supabase = getServiceSupabase();
    if (supabase) {
      const cleanName = finalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${cleanName}`;

      const { error: upErr } = await supabase.storage
        .from('designs')
        .upload(storagePath, processedBuffer, {
          contentType: finalMime,
          upsert: false,
        });

      if (!upErr) {
        const { data: pubData } = supabase.storage.from('designs').getPublicUrl(storagePath);
        if (pubData?.publicUrl) {
          return NextResponse.json({
            success: true,
            url: pubData.publicUrl,
            fileName: finalFileName,
            storedOn: 'Supabase-Storage-Backup',
            sizeBytes: compressedSize,
            originalSizeBytes: originalSize,
            savedPercentage,
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
