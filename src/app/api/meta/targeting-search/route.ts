import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'adinterest'; // 'adinterest' | 'adgeolocation'

  if (!query || query.length < 2) {
    return NextResponse.json({ data: [] });
  }

  let token = process.env.META_ACCESS_TOKEN || '';

  // 1. Ambil token Meta aktif dari database Supabase
  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      const { data: adConn } = await supabase
        .from('ad_platform_connections')
        .select('access_token, account_id')
        .eq('id', 'facebook')
        .single();

      if (adConn?.access_token) {
        token = adConn.access_token;
      } else {
        const { data: legacyConn } = await supabase
          .from('platform_connections')
          .select('access_token, ad_account_id')
          .eq('platform', 'facebook')
          .single();

        if (legacyConn?.access_token) {
          token = legacyConn.access_token;
        }
      }
    }
  } catch (err) {
    console.warn('Could not query connections from Supabase:', err);
  }

  if (!token) {
    return NextResponse.json(
      { success: false, error: 'Token Meta tidak valid atau sambungan akaun belum dikonfigurasikan' },
      { status: 401 }
    );
  }

  try {
    const searchUrl = type === 'adgeolocation'
      ? `https://graph.facebook.com/v21.0/search?type=adgeolocation&q=${encodeURIComponent(query)}&location_types=['region','city','country']&country_code=MY&access_token=${encodeURIComponent(token)}&limit=10`
      : `https://graph.facebook.com/v21.0/search?type=${type}&q=${encodeURIComponent(query)}&access_token=${encodeURIComponent(token)}&limit=10`;

    const metaRes = await fetch(searchUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    const metaData = await metaRes.json();

    if (metaData.error || !metaRes.ok) {
      console.warn('Meta targeting search API error:', metaData.error);
      return NextResponse.json(
        { success: false, error: metaData.error?.message || 'Token Meta tidak valid atau API tidak dapat dihubungi' },
        { status: metaRes.status || 400 }
      );
    }

    return NextResponse.json(metaData);
  } catch (error: any) {
    console.error('Targeting search route error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Token Meta tidak valid atau API tidak dapat dihubungi' },
      { status: 500 }
    );
  }
}
