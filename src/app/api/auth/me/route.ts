import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('svf_session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, customer: null }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, customer: null }, { status: 500 });
    }

    const { data: session, error } = await supabase
      .from('customer_sessions')
      .select('*, customers(*)')
      .eq('session_token', sessionToken)
      .single();

    if (error || !session) {
      return NextResponse.json({ success: false, customer: null }, { status: 401 });
    }

    // Check session expiry
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from('customer_sessions').delete().eq('session_token', sessionToken);
      const res = NextResponse.json({ success: false, customer: null, reason: 'expired' }, { status: 401 });
      res.cookies.delete('svf_session');
      return res;
    }

    const customer = session.customers as Record<string, unknown>;

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        whatsapp: customer.whatsapp || customer.phone || null,
        phone: customer.phone || customer.whatsapp || null,
        email: (customer.email as string)?.includes('@whatsapp.noreply') ? null : customer.email,
        company_or_team: customer.company_or_team || null,
        address: customer.address || null,
        city: customer.city || null,
        postal_code: customer.postal_code || null,
        phone_verified: customer.phone_verified,
        total_orders: customer.total_orders,
        total_spent: customer.total_spent,
      },
    });
  } catch (err) {
    console.error('[auth/me] Unexpected error:', err);
    return NextResponse.json({ success: false, customer: null }, { status: 500 });
  }
}
