import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const sessionId = typeof body?.sessionId === 'string' && body.sessionId.length > 0
      ? body.sessionId
      : `anon_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const pagePath = typeof body?.page === 'string' ? body.page : '/';

    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json({
        success: false,
        stats: { online: 1, today: 1, this_week: 1, total: 1 },
      });
    }

    // Try calling the RPC function first
    const { data: rpcData, error: rpcError } = await supabase.rpc('track_and_get_visitor_stats', {
      p_session_id: sessionId,
      p_page_path: pagePath,
    });

    if (!rpcError && rpcData) {
      return NextResponse.json({
        success: true,
        stats: {
          online: Number(rpcData.online || 1),
          today: Number(rpcData.today || 1),
          thisWeek: Number(rpcData.this_week || 1),
          total: Number(rpcData.total || 1),
        },
      });
    }

    // Direct table fallback if RPC is not yet created
    const now = new Date().toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
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

    // Query stats
    const [onlineRes, todayRes, weekRes, totalRes] = await Promise.all([
      supabase.from('site_visits').select('session_id', { count: 'exact', head: true }).gte('last_seen_at', fiveMinutesAgo),
      supabase.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', twentyFourHoursAgo),
      supabase.from('site_visits').select('id', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      supabase.from('site_visits').select('id', { count: 'exact', head: true }),
    ]);

    const online = Math.max(1, onlineRes.count || 1);
    const today = Math.max(1, todayRes.count || 1);
    const thisWeek = Math.max(today, weekRes.count || 1);
    const total = Math.max(thisWeek, totalRes.count || 1);

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
      success: false,
      stats: { online: 1, today: 1, this_week: 1, total: 1 },
    });
  }
}
