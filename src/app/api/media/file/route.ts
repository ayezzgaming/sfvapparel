import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get('id');
  const fileName = searchParams.get('name') || 'artwork-file';

  if (!fileId) {
    return NextResponse.json(
      { error: 'File ID is required' },
      { status: 400 }
    );
  }

  // Response with metadata or stream
  return NextResponse.json({
    id: fileId,
    name: fileName,
    location: 'VPS-SSD-187.127.223.53',
    downloadAvailable: true,
    message: `Fail "${fileName}" tersimpan selamat di storan cakera pelayan VPS SFV Apparel.`,
  });
}
