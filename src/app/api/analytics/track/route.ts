import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export const dynamic = 'force-dynamic';

const BASE_VISITS_OFFSET = 5698;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === 'string' && body.sessionId.trim().length > 0
      ? body.sessionId.trim()
      : `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const pagePath = typeof body?.page === 'string' ? body.page : '/';

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json({
        success: true,
        stats: { online: 1, today: 1, thisWeek: 1, total: BASE_VISITS_OFFSET + 1 },
      });
    }

    // 1. Try calling the RPC function first (atomic, ultra-fast & accurate)
    const { data: rpcData, error: rpcError } = await supabase.rpc('track_and_get_visitor_stats', {
      p_session_id: sessionId,
      p_page_path: pagePath,
    });

    if (!rpcError && rpcData) {
      const rawTotal = Number(rpcData.total || 0);
      return NextResponse.json({
        success: true,
        stats: {
          online: Math.max(1, Number(rpcData.online || 1)),
          today: Math.max(1, Number(rpcData.today || 1)),
          thisWeek: Math.max(1, Number(rpcData.this_week || 1)),
          total: rawTotal < BASE_VISITS_OFFSET ? BASE_VISITS_OFFSET + rawTotal : rawTotal,
        },
      });
    }

    // 2. Direct table fallback if RPC is not yet registered in Supabase
    const now = new Date().toISOString();
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Check if session exists in last 24h
    const { data: existing } = await supabase
      .from('site_visits')
      .select('id')
      .eq('session_id', sessionId)
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      await supabase
        .from('site_visits')
        .update({ last_seen_at: now, page_path: pagePath })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('site_visits')
        .insert({
          session_id: sessionId,
          page_path: pagePath,
          created_at: now,
          last_seen_at: now,
        });
    }

    // Query active online sessions & total
    const [onlineRes, todayRes, weekRes, totalRes] = await Promise.all([
      supabase.from('site_visits').select('session_id').gte('last_seen_at', threeMinutesAgo),
      supabase.from('site_visits').select('session_id').gte('created_at', twentyFourHoursAgo),
      supabase.from('site_visits').select('session_id').gte('created_at', sevenDaysAgo),
      supabase.from('site_visits').select('session_id'),
    ]);

    const uniqueOnline = new Set((onlineRes.data || []).map((r: any) => r.session_id)).size;
    const uniqueToday = new Set((todayRes.data || []).map((r: any) => r.session_id)).size;
    const uniqueWeek = new Set((weekRes.data || []).map((r: any) => r.session_id)).size;
    const uniqueTotal = new Set((totalRes.data || []).map((r: any) => r.session_id)).size;

    const online = Math.max(1, uniqueOnline);
    const today = Math.max(1, uniqueToday);
    const thisWeek = Math.max(today, uniqueWeek);
    const total = BASE_VISITS_OFFSET + uniqueTotal;

    return NextResponse.json({
      success: true,
      stats: {
        online,
        today,
        thisWeek,
        total,
      },
    });
  } catch (error: any) {
    console.error('Analytics tracking error:', error?.message);
    return NextResponse.json({
      success: true,
      stats: { online: 1, today: 1, thisWeek: 1, total: BASE_VISITS_OFFSET + 1 },
    });
  }
}

export async function GET() {
  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({
      success: true,
      stats: { online: 1, today: 1, thisWeek: 1, total: BASE_VISITS_OFFSET + 1 },
    });
  }

  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('track_and_get_visitor_stats', {
      p_session_id: 'readonly_query',
      p_page_path: '/',
    });

    if (!rpcError && rpcData) {
      const rawTotal = Number(rpcData.total || 0);
      return NextResponse.json({
        success: true,
        stats: {
          online: Math.max(1, Number(rpcData.online || 1)),
          today: Math.max(1, Number(rpcData.today || 1)),
          thisWeek: Math.max(1, Number(rpcData.this_week || 1)),
          total: rawTotal < BASE_VISITS_OFFSET ? BASE_VISITS_OFFSET + rawTotal : rawTotal,
        },
      });
    }
  } catch {
    // Fallback
  }

  return NextResponse.json({
    success: true,
    stats: { online: 1, today: 1, thisWeek: 1, total: BASE_VISITS_OFFSET },
  });
}

