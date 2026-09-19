import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

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
      const { data: connection } = await supabase
        .from('platform_connections')
        .select('access_token, ad_account_id')
        .eq('platform', 'facebook')
        .single();

      if (connection?.access_token) {
        token = connection.access_token;
      }
    }
  } catch (err) {
    console.warn('Could not query platform_connections from Supabase:', err);
  }

  if (!token) {
    // Fallback official Meta interests dataset for offline or unauthenticated local dev
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

    const filtered = fallbackMetaInterests.filter(i => 
      i.name.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({ data: filtered });
  }

  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/search?type=${type}&q=${encodeURIComponent(query)}&access_token=${token}&limit=10`
    );
    const metaData = await metaRes.json();

    if (metaData.error) {
      console.error('Meta targeting search error:', metaData.error);
      return NextResponse.json({ data: [] });
    }

    return NextResponse.json(metaData);
  } catch (error: any) {
    console.error('Targeting search route error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
