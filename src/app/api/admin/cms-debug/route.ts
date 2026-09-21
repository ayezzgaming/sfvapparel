import { NextResponse } from 'next/server';
import { getCmsDataDb, deleteHeroBannerDb } from '@/app/actions/cmsActions';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sb = getServiceSupabase();
    let directBanners = null;
    let directError = null;
    
    if (sb) {
      const { data, error } = await sb.from('cms_hero_banners').select('*').order('sort_order');
      directBanners = data;
      directError = error?.message;
    }

    const cmsResult = await getCmsDataDb();

    return NextResponse.json({
      env: {
        has_service_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        has_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        service_key_prefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) || 'NOT SET',
      },
      directQuery: {
        hasSbClient: !!sb,
        bannersCount: directBanners?.length ?? 0,
        error: directError,
        banners: directBanners?.map((b: { id: string; title: string }) => ({ id: b.id, title: b.title })) ?? [],
      },
      cmsAction: {
        success: cmsResult.success,
        message: cmsResult.message,
        bannersCount: cmsResult.data.heroBanners.length,
        servicesCount: cmsResult.data.services.length,
        bannerTitles: cmsResult.data.heroBanners.map((b) => b.title),
      }
    });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error',
    }, { status: 500 });
  }
}

// POST /api/admin/cms-debug  { "id": "<bannerId>" }  => test delete via Server Action
export async function POST(req: Request) {
  try {
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
