import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('svf_session')?.value;

    if (sessionToken) {
      const supabase = getServiceSupabase();
      if (supabase) {
        await supabase
          .from('customer_sessions')
          .delete()
          .eq('session_token', sessionToken);
      }
    }

    const response = NextResponse.json({ success: true, message: 'Log keluar berjaya.' });
    response.cookies.delete('svf_session');
    return response;
  } catch (err) {
    console.error('[auth/logout] error:', err);
    const response = NextResponse.json({ success: true });
    response.cookies.delete('svf_session');
    return response;
  }
}
