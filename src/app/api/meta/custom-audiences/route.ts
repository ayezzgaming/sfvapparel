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

  // Fallback Custom Audiences dataset (for offline dev or accounts without created audiences)
  const fallbackAudiences = [
    {
      id: 'aud_retarget_web_30d',
      name: 'Pelawat Laman Web (30 Hari Terakhir)',
      subtype: 'WEBSITE',
      approximate_count_lower_bound: 1200,
      approximate_count_upper_bound: 3500,
      type: 'retargeting'
    },
    {
      id: 'aud_ig_engagers_60d',
      name: 'Interaksi Instagram & FB Page (60 Hari)',
      subtype: 'ENGAGEMENT',
      approximate_count_lower_bound: 4800,
      approximate_count_upper_bound: 9200,
      type: 'retargeting'
    },
    {
      id: 'aud_wa_leads_90d',
      name: 'Database Prospek WhatsApp (90 Hari)',
      subtype: 'CUSTOM',
      approximate_count_lower_bound: 850,
      approximate_count_upper_bound: 1600,
      type: 'retargeting'
    },
    {
      id: 'aud_lal_1pct_my_buyers',
      name: 'Lookalike 1% Pembeli Jersi Malaysia',
      subtype: 'LOOKALIKE',
      approximate_count_lower_bound: 180000,
      approximate_count_upper_bound: 250000,
      type: 'lookalike'
    },
    {
      id: 'aud_exclude_past_buyers',
      name: 'Pelanggan Sedia Ada (Kecualikan / Exclude)',
      subtype: 'CUSTOM',
      approximate_count_lower_bound: 450,
      approximate_count_upper_bound: 1200,
      type: 'exclusion'
    }
  ];

  if (!token || !adAccountId) {
    return NextResponse.json({
      success: true,
      is_live: false,
      audiences: fallbackAudiences
    });
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

    if (data.data && Array.isArray(data.data) && data.data.length > 0) {
      const liveAudiences = data.data.map((aud: any) => ({
        id: aud.id,
        name: aud.name,
        subtype: aud.subtype || 'CUSTOM',
        approximate_count_lower_bound: aud.approximate_count_lower_bound || 0,
        approximate_count_upper_bound: aud.approximate_count_upper_bound || 0,
        type: aud.subtype === 'LOOKALIKE' ? 'lookalike' : aud.name.toLowerCase().includes('exclude') || aud.name.toLowerCase().includes('pembeli') ? 'exclusion' : 'retargeting'
      }));

      return NextResponse.json({
        success: true,
        is_live: true,
        audiences: liveAudiences
      });
    }

    return NextResponse.json({
      success: true,
      is_live: false,
      audiences: fallbackAudiences
    });
  } catch (err: any) {
    console.error('Error querying Meta Custom Audiences:', err);
    return NextResponse.json({
      success: true,
      is_live: false,
      audiences: fallbackAudiences
    });
  }
}
