import { NextResponse } from 'next/server';
import { getCmsDataDb } from '@/app/actions/cmsActions';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Test 1: Direct Supabase query
    const sb = getServiceSupabase();
    let directBanners = null;
    let directError = null;
    
    if (sb) {
      const { data, error } = await sb.from('cms_hero_banners').select('*').order('sort_order');
      directBanners = data;
      directError = error?.message;
    }

    // Test 2: Through getCmsDataDb Server Action logic
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
        bannerTitles: directBanners?.map((b: { title: string }) => b.title) ?? [],
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
      stack: err instanceof Error ? err.stack : null,
    }, { status: 500 });
  }
}
