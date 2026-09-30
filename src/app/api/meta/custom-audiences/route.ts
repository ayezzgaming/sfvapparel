import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  let token = process.env.META_ACCESS_TOKEN || '';
  let adAccountId = '';

  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      const { data } = await supabase
        .from('ad_platform_connections')
        .select('access_token, account_id')
        .eq('id', 'facebook')
        .single();

      if (data?.access_token) token = data.access_token;
      if (data?.account_id) adAccountId = data.account_id;
    }
  } catch (err) {
    console.warn('Could not query Meta connections from Supabase:', err);
  }

  if (!token || !adAccountId) {
    return NextResponse.json(
      { success: false, error: 'Token Meta atau Ad Account ID tidak ditemui dalam konfigurasi sistem' },
      { status: 401 }
    );
  }

  const cleanActId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId.replace(/[^0-9]/g, '')}`;

  try {
    const url = new URL(`https://graph.facebook.com/v21.0/${cleanActId}/customaudiences`);
    url.searchParams.append('access_token', token);
    url.searchParams.append('fields', 'id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,operation_status');
    url.searchParams.append('limit', '50');

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    const data = await res.json();

    if (data.error || !res.ok) {
      console.warn('Meta custom audiences API error:', data.error);
      return NextResponse.json(
        { success: false, error: data.error?.message || 'Token Meta tidak valid atau API tidak dapat dihubungi' },
        { status: res.status || 400 }
      );
    }

    const liveAudiences = (data.data && Array.isArray(data.data))
      ? data.data.map((aud: any) => ({
          id: aud.id,
          name: aud.name,
          subtype: aud.subtype || 'CUSTOM',
          approximate_count_lower_bound: aud.approximate_count_lower_bound || 0,
          approximate_count_upper_bound: aud.approximate_count_upper_bound || 0,
          type: aud.subtype === 'LOOKALIKE' ? 'lookalike' : aud.name.toLowerCase().includes('exclude') || aud.name.toLowerCase().includes('pembeli') ? 'exclusion' : 'retargeting'
        }))
      : [];

    return NextResponse.json({
      success: true,
      is_live: true,
      audiences: liveAudiences
    });
  } catch (err: any) {
    console.error('Error querying Meta Custom Audiences:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Token Meta tidak valid atau API tidak dapat dihubungi' },
      { status: 500 }
    );
  }
}
