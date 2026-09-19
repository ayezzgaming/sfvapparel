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

    // Mathematical baseline calibrated to Malaysian sportswear Meta Ads CPM & CPL averages
    const budgetNum = Math.max(10, Number(dailyBudget) || 30);
    const avgCPM = 8.5; // RM 8.50 per 1,000 impressions in MY Sports/Apparel
    const estImpressions = Math.round((budgetNum / avgCPM) * 1000);
    const estReachLower = Math.round(estImpressions * 0.72);
    const estReachUpper = Math.round(estImpressions * 0.95);
    const estLeadsLower = Math.max(1, Math.round(budgetNum / 8.5));
    const estLeadsUpper = Math.max(2, Math.round(budgetNum / 4.8));

    const fallbackEstimate = {
      daily_reach_lower: estReachLower,
      daily_reach_upper: estReachUpper,
      daily_impressions_lower: estImpressions,
      daily_impressions_upper: Math.round(estImpressions * 1.35),
      daily_leads_lower: estLeadsLower,
      daily_leads_upper: estLeadsUpper,
      currency: 'MYR',
      cpm_estimate: avgCPM
    };

    if (!token || !adAccountId) {
      return NextResponse.json({
        success: true,
        is_live: false,
        estimate: fallbackEstimate
      });
    }

    const cleanActId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId.replace(/[^0-9]/g, '')}`;

    // Query Meta Graph API delivery_estimate
    try {
      const url = new URL(`https://graph.facebook.com/v21.0/${cleanActId}/delivery_estimate`);
      url.searchParams.append('access_token', token);
      url.searchParams.append('optimization_goal', 'LEAD_GENERATION');
      url.searchParams.append('targeting_spec', JSON.stringify(targetingSpec));

      const res = await fetch(url.toString(), {
        headers: { Accept: 'application/json' },
        cache: 'no-store'
      });
      const data = await res.json();

      if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
        const est = data.data[0];
        return NextResponse.json({
          success: true,
          is_live: true,
          estimate: {
            daily_reach_lower: est.daily_reach_lower_bound || estReachLower,
            daily_reach_upper: est.daily_reach_upper_bound || estReachUpper,
            daily_impressions_lower: est.daily_outcomes_curve ? Math.round(estReachLower * 1.3) : estImpressions,
            daily_impressions_upper: est.daily_outcomes_curve ? Math.round(estReachUpper * 1.5) : Math.round(estImpressions * 1.35),
            daily_leads_lower: estLeadsLower,
            daily_leads_upper: estLeadsUpper,
            currency: 'MYR',
            cpm_estimate: avgCPM
          }
        });
      }
    } catch {
      // Ignore Meta API delivery error and use fallback
    }

    return NextResponse.json({
      success: true,
      is_live: false,
      estimate: fallbackEstimate
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
