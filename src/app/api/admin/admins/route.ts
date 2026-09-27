import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import {
  ADMIN_COOKIE_NAME,
  getAdminFromSessionToken,
  hashPassword,
} from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

// GET: List all admins
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const currentAdmin = await getAdminFromSessionToken(sessionToken);

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, message: 'Tidak dibenarkan. Sila log masuk pentadbir.' },
        { status: 401 }
      );
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Pangkalan data tidak dapat dihubungi.' },
        { status: 500 }
      );
    }

    const { data: admins, error } = await supabase
      .from('admins')
      .select('id, email, full_name, role, phone, avatar_url, is_active, last_login_at, created_at, updated_at')
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Gagal mendapatkan senarai pentadbir.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      admins: admins || [],
    });
  } catch (err) {
    console.error('[admin/admins GET] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Ralat pelayan.' },
      { status: 500 }
    );
  }
}

// POST: Add new admin
export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const currentAdmin = await getAdminFromSessionToken(sessionToken);

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, message: 'Tidak dibenarkan. Sila log masuk pentadbir.' },
        { status: 401 }
      );
    }

    // Only super_admin or admin can create admins
    if (currentAdmin.role !== 'super_admin' && currentAdmin.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Hanya Super Admin atau Admin dibenarkan menambah pentadbir baru.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { email, password, full_name, role, phone } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        { success: false, message: 'Sila lengkapkan emel, kata laluan, dan nama penuh.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Kata laluan mestilah sekurang-kurangnya 6 aksara.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const assignedRole = ['super_admin', 'admin', 'operator'].includes(role) ? role : 'admin';

    // Operator cannot create super_admin
    if (currentAdmin.role !== 'super_admin' && assignedRole === 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Hanya Super Admin sedia ada boleh melantik Super Admin baru.' },
        { status: 403 }
      );
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Pangkalan data tidak dapat dihubungi.' },
        { status: 500 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('admins')
      .select('id')
      .ilike('email', cleanEmail)
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Emel ini telah didaftarkan untuk akaun pentadbir lain.' },
        { status: 400 }
      );
    }

    const { hash, salt } = hashPassword(password);

    const { data: newAdmin, error: insertErr } = await supabase
      .from('admins')
      .insert({
        email: cleanEmail,
        password_hash: hash,
        password_salt: salt,
        full_name: full_name.trim(),
        role: assignedRole,
        phone: phone ? String(phone).trim() : null,
        is_active: true,
      })
      .select('id, email, full_name, role, phone, avatar_url, is_active, created_at')
      .single();

    if (insertErr || !newAdmin) {
      console.error('[admin/admins POST] Insert error:', insertErr);
      return NextResponse.json(
        { success: false, message: 'Gagal mencipta akaun pentadbir.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Akaun pentadbir ${newAdmin.full_name} berjaya dicipta.`,
      admin: newAdmin,
    });
  } catch (err) {
    console.error('[admin/admins POST] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Ralat pelayan.' },
      { status: 500 }
    );
  }
}
