import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('svf_session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ success: false, message: 'Sila log masuk terlebih dahulu.' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, message: 'Sambungan pangkalan data gagal.' }, { status: 500 });
    }

    // Verify session
    const { data: sessionData, error: sessionErr } = await supabase
      .from('customer_sessions')
      .select('customer_id, expires_at')
      .eq('session_token', sessionToken)
      .single();

    if (sessionErr || !sessionData || new Date(sessionData.expires_at) < new Date()) {
      return NextResponse.json({ success: false, message: 'Sesi tamat tempoh.' }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, email, company_or_team } = body as {
      full_name?: string;
      email?: string;
      company_or_team?: string;
    };

    if (!full_name?.trim()) {
      return NextResponse.json({ success: false, message: 'Nama penuh diperlukan.' }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      full_name: full_name.trim(),
    };

    if (email?.trim()) {
      updates.email = email.trim();
    }

    if (company_or_team !== undefined) {
      updates.company_or_team = company_or_team?.trim() || null;
    }

    const { data: updatedCustomer, error: updateErr } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', sessionData.customer_id)
      .select()
      .single();

    if (updateErr) {
      console.error('[profile-update] DB update error:', updateErr.message);
      return NextResponse.json({ success: false, message: 'Gagal mengemaskini profil.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profil berjaya dikemaskini.',
      customer: {
        id: updatedCustomer.id,
        full_name: updatedCustomer.full_name,
        whatsapp: updatedCustomer.whatsapp,
        email: updatedCustomer.email !== `${updatedCustomer.whatsapp}@whatsapp.noreply` ? updatedCustomer.email : null,
        company_or_team: updatedCustomer.company_or_team,
        address: updatedCustomer.address,
        city: updatedCustomer.city,
        postal_code: updatedCustomer.postal_code,
        phone_verified: updatedCustomer.phone_verified,
      },
    });
  } catch (err) {
    console.error('[profile-update] Unexpected error:', err);
    return NextResponse.json({ success: false, message: 'Ralat pelayan.' }, { status: 500 });
  }
}
