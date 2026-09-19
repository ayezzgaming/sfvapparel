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

  // 1. Ambil token Meta aktif dari database Supabase (mendukung ad_platform_connections & platform_connections)
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

  // Fallback Geolocation Dataset (Malaysia Regions & Major Cities)
  const fallbackGeolocations = [
    { key: 'MY', name: 'Malaysia (Seluruh Negara)', type: 'country', country_code: 'MY' },
    { key: 'MY-10', name: 'Selangor', type: 'region', country_code: 'MY' },
    { key: 'MY-14', name: 'Wilayah Persekutuan Kuala Lumpur', type: 'region', country_code: 'MY' },
    { key: 'MY-01', name: 'Johor', type: 'region', country_code: 'MY' },
    { key: 'MY-07', name: 'Pulau Pinang (Penang)', type: 'region', country_code: 'MY' },
    { key: 'MY-08', name: 'Perak', type: 'region', country_code: 'MY' },
    { key: 'MY-02', name: 'Kedah', type: 'region', country_code: 'MY' },
    { key: 'MY-06', name: 'Pahang', type: 'region', country_code: 'MY' },
    { key: 'MY-05', name: 'Negeri Sembilan', type: 'region', country_code: 'MY' },
    { key: 'MY-04', name: 'Melaka', type: 'region', country_code: 'MY' },
    { key: 'MY-03', name: 'Kelantan', type: 'region', country_code: 'MY' },
    { key: 'MY-11', name: 'Terengganu', type: 'region', country_code: 'MY' },
    { key: 'MY-12', name: 'Sabah', type: 'region', country_code: 'MY' },
    { key: 'MY-13', name: 'Sarawak', type: 'region', country_code: 'MY' },
    { key: 'city-shahalam', name: 'Shah Alam, Selangor', type: 'city', country_code: 'MY' },
    { key: 'city-johorbahru', name: 'Johor Bahru, Johor', type: 'city', country_code: 'MY' },
    { key: 'city-georgetown', name: 'George Town, Penang', type: 'city', country_code: 'MY' }
  ];

  // Fallback Interests Dataset
  const fallbackMetaInterests = [
    { id: '6003139266472', name: 'Futsal', audience_size_lower_bound: 1500000, audience_size_upper_bound: 2500000, path: ['Interests', 'Sports', 'Futsal'] },
    { id: '6003384218943', name: 'Jersey (clothing)', audience_size_lower_bound: 4200000, audience_size_upper_bound: 6500000, path: ['Interests', 'Fashion', 'Clothing', 'Jersey'] },
    { id: '6003102379373', name: 'Sports clothing', audience_size_lower_bound: 3800000, audience_size_upper_bound: 5200000, path: ['Interests', 'Fashion', 'Sportswear'] },
    { id: '6003024827419', name: 'Association football (Soccer)', audience_size_lower_bound: 8500000, audience_size_upper_bound: 12000000, path: ['Interests', 'Sports', 'Football'] },
    { id: '6003358071850', name: 'Sublimation (printmaking)', audience_size_lower_bound: 450000, audience_size_upper_bound: 850000, path: ['Interests', 'Business & Industry', 'Printing'] },
    { id: '6003198547281', name: 'Screen printing', audience_size_lower_bound: 980000, audience_size_upper_bound: 1600000, path: ['Interests', 'Printing', 'Textiles'] },
    { id: '6003264981204', name: 'Direct-to-garment printing', audience_size_lower_bound: 320000, audience_size_upper_bound: 600000, path: ['Interests', 'Apparel Printing'] },
    { id: '6003412958192', name: 'Badminton', audience_size_lower_bound: 2200000, audience_size_upper_bound: 3400000, path: ['Interests', 'Sports', 'Badminton'] },
    { id: '6003215891402', name: 'Running', audience_size_lower_bound: 3100000, audience_size_upper_bound: 4800000, path: ['Interests', 'Sports', 'Fitness', 'Running'] },
    { id: '6003298410294', name: 'Esports', audience_size_lower_bound: 2800000, audience_size_upper_bound: 4500000, path: ['Interests', 'Gaming', 'Esports'] }
  ];

  if (!token) {
    if (type === 'adgeolocation') {
      const filteredGeo = fallbackGeolocations.filter(g =>
        g.name.toLowerCase().includes(query.toLowerCase())
      );
      return NextResponse.json({ data: filteredGeo });
    }

    const filtered = fallbackMetaInterests.filter(i => 
      i.name.toLowerCase().includes(query.toLowerCase())
    );
    return NextResponse.json({ data: filtered });
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

    if (metaData.error) {
      console.warn('Meta targeting search API error, falling back to local dataset:', metaData.error);
      if (type === 'adgeolocation') {
        const filteredGeo = fallbackGeolocations.filter(g =>
          g.name.toLowerCase().includes(query.toLowerCase())
        );
        return NextResponse.json({ data: filteredGeo });
      }
      const filtered = fallbackMetaInterests.filter(i => 
        i.name.toLowerCase().includes(query.toLowerCase())
      );
      return NextResponse.json({ data: filtered });
    }

    return NextResponse.json(metaData);
  } catch (error: any) {
    console.error('Targeting search route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
