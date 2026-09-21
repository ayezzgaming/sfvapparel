import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import crypto from 'crypto';

function generateSessionToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp, name, email } = body as {
      phone?: string;
      otp?: string;
      name?: string;
      email?: string;
    };

    if (!phone || !otp) {
      return NextResponse.json({ success: false, message: 'Nombor telefon dan OTP diperlukan.' }, { status: 400 });
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ success: false, message: 'OTP mesti 6 digit.' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, message: 'Sambungan pangkalan data gagal.' }, { status: 500 });
    }

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone', phone)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpRecord) {
      return NextResponse.json({ success: false, message: 'OTP tidak dijumpai atau sudah digunakan. Sila minta OTP baru.' }, { status: 400 });
    }

    // Check expiry
    if (new Date(otpRecord.expires_at) < new Date()) {
      await supabase.from('otp_verifications').update({ is_used: true }).eq('id', otpRecord.id);
      return NextResponse.json({ success: false, message: 'OTP telah tamat tempoh. Sila minta OTP baru.' }, { status: 400 });
    }

    // Check attempt limit
    if (otpRecord.attempts >= 5) {
      await supabase.from('otp_verifications').update({ is_used: true }).eq('id', otpRecord.id);
      return NextResponse.json({ success: false, message: 'Terlalu banyak percubaan. Sila minta OTP baru.' }, { status: 400 });
    }

    // Verify OTP code
    if (otpRecord.otp_code !== otp) {
      await supabase.from('otp_verifications').update({ attempts: otpRecord.attempts + 1 }).eq('id', otpRecord.id);
      const remaining = 5 - (otpRecord.attempts + 1);
      return NextResponse.json(
        { success: false, message: `OTP tidak sah. ${remaining} percubaan lagi.` },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await supabase.from('otp_verifications').update({ is_used: true }).eq('id', otpRecord.id);

    // Find or create customer
    let customer;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('whatsapp', phone)
      .single();

    if (existingCustomer) {
      // Update name if provided and different
      const updates: Record<string, unknown> = { phone_verified: true };
      if (name && name !== existingCustomer.full_name) updates.full_name = name;
      if (email && !existingCustomer.email) updates.email = email;

      const { data: updated } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', existingCustomer.id)
        .select()
        .single();
      customer = updated || existingCustomer;
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          full_name: name || 'Pelanggan Baru',
          email: email || `${phone}@whatsapp.noreply`,
          phone: phone,
          whatsapp: phone,
          phone_verified: true,
          total_orders: 0,
          total_spent: 0,
        })
        .select()
        .single();

      if (createError || !newCustomer) {
        console.error('[verify-otp] create customer error:', createError?.message);
        return NextResponse.json({ success: false, message: 'Gagal mencipta akaun. Sila cuba lagi.' }, { status: 500 });
      }
      customer = newCustomer;
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    const { error: sessionError } = await supabase.from('customer_sessions').insert({
      customer_id: customer.id,
      session_token: sessionToken,
      expires_at: expiresAt,
    });

    if (sessionError) {
      console.error('[verify-otp] session create error:', sessionError.message);
      return NextResponse.json({ success: false, message: 'Gagal mencipta sesi. Sila cuba lagi.' }, { status: 500 });
    }

    // Set secure httpOnly cookie
    const isProduction = process.env.NODE_ENV === 'production';
    const response = NextResponse.json({
      success: true,
      message: 'Log masuk berjaya!',
      customer: {
        id: customer.id,
        full_name: customer.full_name,
        whatsapp: customer.whatsapp,
        email: customer.email !== `${phone}@whatsapp.noreply` ? customer.email : null,
        phone_verified: true,
      },
    });

    response.cookies.set('svf_session', sessionToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
      path: '/',
    });

    return response;
  } catch (err) {
    console.error('[verify-otp] Unexpected error:', err);
    return NextResponse.json({ success: false, message: 'Ralat pelayan.' }, { status: 500 });
  }
}
