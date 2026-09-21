import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import { sendWahaMessage, formatChatId } from '@/lib/whatsapp/waha-client';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function normalizePhone(raw: string): string {
  let cleaned = raw.replace(/[\s\-\+\(\)]/g, '');
  if (cleaned.startsWith('0')) cleaned = '60' + cleaned.slice(1);
  if (!cleaned.startsWith('6')) cleaned = '60' + cleaned;
  return cleaned;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, name, email } = body as { phone?: string; name?: string; email?: string };

    if (!phone?.trim()) {
      return NextResponse.json({ success: false, message: 'Nombor WhatsApp diperlukan.' }, { status: 400 });
    }

    const normalizedPhone = normalizePhone(phone);

    // Validate Malaysian phone number (e.g. 60123456789, 60111234567)
    if (!/^60\d{8,11}$/.test(normalizedPhone)) {
      return NextResponse.json({ success: false, message: 'Format nombor WhatsApp tidak sah. Contoh: 0123456789' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, message: 'Sambungan pangkalan data gagal.' }, { status: 500 });
    }

    // Check if customer already exists to personalize message
    let customerName = name?.trim();
    if (!customerName) {
      const { data: existingCust } = await supabase
        .from('customers')
        .select('full_name')
        .eq('whatsapp', normalizedPhone)
        .single();
      if (existingCust?.full_name) {
        customerName = existingCust.full_name;
      }
    }

    // Rate limiting: max 3 OTP requests per phone per 10 minutes
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('otp_verifications')
      .select('*', { count: 'exact', head: true })
      .eq('phone', normalizedPhone)
      .gte('created_at', tenMinutesAgo);

    if ((count ?? 0) >= 3) {
      return NextResponse.json(
        { success: false, message: 'Terlalu banyak permintaan OTP. Sila cuba lagi dalam 10 minit.' },
        { status: 429 }
      );
    }

    // Invalidate previous OTPs for this phone
    await supabase
      .from('otp_verifications')
      .update({ is_used: true })
      .eq('phone', normalizedPhone)
      .eq('is_used', false);

    // Generate new OTP
    const otpCode = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes

    const { error: insertError } = await supabase.from('otp_verifications').insert({
      phone: normalizedPhone,
      otp_code: otpCode,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error('[send-otp] DB insert error:', insertError.message);
      return NextResponse.json({ success: false, message: 'Gagal menyimpan OTP.' }, { status: 500 });
    }

    // Send OTP via WAHA (Strictly no emojis)
    const chatId = formatChatId(normalizedPhone);
    const greeting = customerName ? `Assalamualaikum *${customerName}*,` : 'Assalamualaikum,';
    const message = `*SFV Apparel - Kod Pengesahan*\n\n${greeting}\n\nKod OTP anda ialah: *${otpCode}*\n\nKod ini sah selama 5 minit sahaja.\nJangan kongsikan kod ini kepada sesiapa.`;

    const wahaResult = await sendWahaMessage(chatId, message);

    if (!wahaResult.success) {
      console.warn('[send-otp] WAHA send warning/error:', wahaResult.error);
      const isDev = process.env.NODE_ENV !== 'production';
      if (isDev) {
        return NextResponse.json({
          success: true,
          message: `Kod OTP anda: ${otpCode}. (Sesi WhatsApp VPS: Perlu imbas QR di WhatsApp Hub)`,
          phone: normalizedPhone,
          devOtp: otpCode,
        });
      }

      return NextResponse.json(
        { 
          success: false, 
          message: 'Gagal menghantar kod ke WhatsApp. Sila pastikan sistem WhatsApp Hub telah diimbas atau hubungi sokongan.',
          error: wahaResult.error
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `OTP telah dihantar ke WhatsApp ${normalizedPhone.replace(/(\d{2})(\d{4})(\d+)/, '+$1 $2 $3')}`,
      phone: normalizedPhone,
    });
  } catch (err) {
    console.error('[send-otp] Unexpected error:', err);
    return NextResponse.json({ success: false, message: 'Ralat pelayan.' }, { status: 500 });
  }
}
