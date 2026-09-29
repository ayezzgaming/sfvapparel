import { NextResponse } from 'next/server';
import { getCmsDataDb, deleteHeroBannerDb } from '@/app/actions/cmsActions';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, getAdminFromSessionToken } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

async function verifyAdminAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  return await getAdminFromSessionToken(sessionToken);
}

export async function GET() {
  try {
    const admin = await verifyAdminAuth();
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Tidak dibenarkan' }, { status: 401 });
    }

    const sb = getServiceSupabase();
    let directBanners = null;
    let directError = null;
    
    if (sb) {
      const { data, error } = await sb.from('cms_hero_banners').select('id, title, sort_order').order('sort_order');
      directBanners = data;
      directError = error?.message;
    }

    const cmsResult = await getCmsDataDb();

    return NextResponse.json({
      directQuery: {
        hasSbClient: !!sb,
        bannersCount: directBanners?.length ?? 0,
        error: directError,
        banners: directBanners ?? [],
      },
      cmsAction: {
        success: cmsResult.success,
        message: cmsResult.message,
        bannersCount: cmsResult.data?.heroBanners?.length ?? 0,
        servicesCount: cmsResult.data?.services?.length ?? 0,
      }
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const admin = await verifyAdminAuth();
    if (!admin || admin.role !== 'super_admin') {
      return NextResponse.json({ error: 'Tidak dibenarkan' }, { status: 401 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    
    const result = await deleteHeroBannerDb(id);
    
    const sb = getServiceSupabase();
    const { data: remaining } = sb ? await sb.from('cms_hero_banners').select('id, title') : { data: [] };
    
    return NextResponse.json({
      deleteResult: result,
      remaining: remaining?.map((b: { id: string; title: string }) => ({ id: b.id, title: b.title })) ?? [],
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

