import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import {
  ADMIN_COOKIE_NAME,
  getAdminFromSessionToken,
  hashPassword,
  verifyPassword,
} from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const currentAdmin = await getAdminFromSessionToken(sessionToken);

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, message: 'Sila log masuk semula.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { full_name, phone, current_password, new_password } = body;

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Pangkalan data tidak dapat dihubungi.' },
        { status: 500 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (full_name && typeof full_name === 'string' && full_name.trim().length > 0) {
      updatePayload.full_name = full_name.trim();
    }

    if (phone !== undefined) {
      updatePayload.phone = phone ? String(phone).trim() : null;
    }

    // If changing password, verify old password
    if (new_password) {
      if (!current_password) {
        return NextResponse.json(
          { success: false, message: 'Sila masukkan kata laluan semasa untuk menukar kata laluan baru.' },
          { status: 400 }
        );
      }

      if (typeof new_password !== 'string' || new_password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Kata laluan baru mestilah sekurang-kurangnya 6 aksara.' },
          { status: 400 }
        );
      }

      // Fetch stored credentials
      const { data: dbAdmin } = await supabase
        .from('admins')
        .select('password_hash, password_salt')
        .eq('id', currentAdmin.id)
        .single();

      if (!dbAdmin || !verifyPassword(current_password, dbAdmin.password_hash, dbAdmin.password_salt)) {
        return NextResponse.json(
          { success: false, message: 'Kata laluan semasa tidak tepat.' },
          { status: 400 }
        );
      }

      const { hash, salt } = hashPassword(new_password);
      updatePayload.password_hash = hash;
      updatePayload.password_salt = salt;
    }

    const { data: updatedAdmin, error } = await supabase
      .from('admins')
      .update(updatePayload)
      .eq('id', currentAdmin.id)
      .select('id, email, full_name, role, phone, avatar_url, last_login_at')
      .single();

    if (error || !updatedAdmin) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengemaskini profil pentadbir.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profil berjaya dikemaskini.',
      admin: updatedAdmin,
    });
  } catch (err) {
    console.error('[admin/auth/profile] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Ralat pelayan.' },
      { status: 500 }
    );
  }
}
