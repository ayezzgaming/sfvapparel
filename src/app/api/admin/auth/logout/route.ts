import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { ADMIN_COOKIE_NAME } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (sessionToken) {
      const supabase = getServiceSupabase();
      if (supabase) {
        await supabase.from('admin_sessions').delete().eq('session_token', sessionToken);
      }
    }

    const res = NextResponse.json({
      success: true,
      message: 'Log keluar berjaya.',
    });

    res.cookies.delete(ADMIN_COOKIE_NAME);
    return res;
  } catch (err) {
    console.error('[admin/auth/logout] Error:', err);
    const res = NextResponse.json({ success: true, message: 'Log keluar.' });
    res.cookies.delete(ADMIN_COOKIE_NAME);
    return res;
  }
}
