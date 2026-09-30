import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { dailyBudget = 30, targetingSpec = {} } = body;

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

        if (data?.access_token) {
          token = data.access_token;
        }
        if (data?.account_id) {
          adAccountId = data.account_id;
        }
      }
    } catch (err) {
      console.warn('Could not query platform connection:', err);
    }

    if (!token || !adAccountId) {
      return NextResponse.json(
        { success: false, error: 'Token Meta atau Ad Account ID tidak ditemui dalam konfigurasi sistem' },
        { status: 401 }
      );
    }

    const cleanActId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId.replace(/[^0-9]/g, '')}`;

    const url = new URL(`https://graph.facebook.com/v21.0/${cleanActId}/delivery_estimate`);
    url.searchParams.append('access_token', token);
    url.searchParams.append('optimization_goal', 'LEAD_GENERATION');
    url.searchParams.append('targeting_spec', JSON.stringify(targetingSpec));

    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    const data = await res.json();

    if (data.error || !res.ok) {
      console.warn('Meta delivery estimate API error:', data.error);
      return NextResponse.json(
        { success: false, error: data.error?.message || 'Token Meta tidak valid atau API tidak dapat dihubungi' },
        { status: res.status || 400 }
      );
    }

    if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
      const est = data.data[0];
      const budgetNum = Math.max(10, Number(dailyBudget) || 30);
      return NextResponse.json({
        success: true,
        is_live: true,
        estimate: {
          daily_reach_lower: est.daily_reach_lower_bound || 0,
          daily_reach_upper: est.daily_reach_upper_bound || 0,
          daily_impressions_lower: est.daily_outcomes_curve ? Math.round((est.daily_reach_lower_bound || 1) * 1.3) : Math.round((budgetNum / 8.5) * 1000 * 0.72),
          daily_impressions_upper: est.daily_outcomes_curve ? Math.round((est.daily_reach_upper_bound || 1) * 1.5) : Math.round((budgetNum / 8.5) * 1000 * 0.95),
          daily_leads_lower: Math.max(1, Math.round(budgetNum / 8.5)),
          daily_leads_upper: Math.max(2, Math.round(budgetNum / 4.8)),
          currency: 'MYR',
          cpm_estimate: 8.5
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Tiada data anggaran capaian dipulangkan oleh Meta untuk spesifikasi sasaran ini.'
    }, { status: 404 });
  } catch (error: any) {
    console.error('Reach estimate route error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Token Meta tidak valid atau API tidak dapat dihubungi' },
      { status: 500 }
    );
  }
}
