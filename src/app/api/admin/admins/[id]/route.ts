import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import {
  ADMIN_COOKIE_NAME,
  getAdminFromSessionToken,
  hashPassword,
} from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

// PATCH: Update admin details / status / password
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const currentAdmin = await getAdminFromSessionToken(sessionToken);

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, message: 'Tidak dibenarkan. Sila log masuk pentadbir.' },
        { status: 401 }
      );
    }

    if (currentAdmin.role !== 'super_admin' && currentAdmin.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Hanya Super Admin atau Admin dibenarkan mengubah maklumat pentadbir.' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { full_name, role, is_active, phone, new_password } = body;

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Pangkalan data tidak dapat dihubungi.' },
        { status: 500 }
      );
    }

    // Get targeted admin
    const { data: targetAdmin, error: findErr } = await supabase
      .from('admins')
      .select('*')
      .eq('id', id)
      .single();

    if (findErr || !targetAdmin) {
      return NextResponse.json(
        { success: false, message: 'Pentadbir tidak dijumpai.' },
        { status: 404 }
      );
    }

    // Protection: only super_admin can modify another super_admin
    if (targetAdmin.role === 'super_admin' && currentAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Hanya Super Admin boleh mengubah akaun Super Admin.' },
        { status: 403 }
      );
    }

    // Protection: Prevent disabling self
    if (currentAdmin.id === id && is_active === false) {
      return NextResponse.json(
        { success: false, message: 'Anda tidak boleh menyahaktifkan akaun anda sendiri.' },
        { status: 400 }
      );
    }

    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.email !== undefined && typeof body.email === 'string') {
      const cleanEmail = body.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return NextResponse.json(
          { success: false, message: 'Format emel tidak sah.' },
          { status: 400 }
        );
      }

      // Check if email already taken by another admin
      const { data: existingEmail } = await supabase
        .from('admins')
        .select('id')
        .ilike('email', cleanEmail)
        .neq('id', id)
        .single();

      if (existingEmail) {
        return NextResponse.json(
          { success: false, message: 'Emel ini telah digunakan oleh akaun pentadbir lain.' },
          { status: 400 }
        );
      }

      updatePayload.email = cleanEmail;
    }

    if (full_name !== undefined && typeof full_name === 'string') {
      updatePayload.full_name = full_name.trim();
    }

    if (role !== undefined && ['super_admin', 'admin', 'operator'].includes(role)) {
      if (role === 'super_admin' && currentAdmin.role !== 'super_admin') {
        return NextResponse.json(
          { success: false, message: 'Hanya Super Admin boleh melantik Super Admin.' },
          { status: 403 }
        );
      }
      updatePayload.role = role;
    }

    if (is_active !== undefined) {
      updatePayload.is_active = Boolean(is_active);
    }

    if (phone !== undefined) {
      updatePayload.phone = phone ? String(phone).trim() : null;
    }

    if (new_password) {
      if (typeof new_password !== 'string' || new_password.length < 6) {
        return NextResponse.json(
          { success: false, message: 'Kata laluan baru mestilah sekurang-kurangnya 6 aksara.' },
          { status: 400 }
        );
      }
      const { hash, salt } = hashPassword(new_password);
      updatePayload.password_hash = hash;
      updatePayload.password_salt = salt;

      // Invalidate existing sessions for this updated admin so they must re-login with new password
      await supabase.from('admin_sessions').delete().eq('admin_id', id);
    }

    const { data: updated, error: updateErr } = await supabase
      .from('admins')
      .update(updatePayload)
      .eq('id', id)
      .select('id, email, full_name, role, phone, avatar_url, is_active, last_login_at, updated_at')
      .single();

    if (updateErr || !updated) {
      return NextResponse.json(
        { success: false, message: 'Gagal mengemaskini pentadbir.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Maklumat pentadbir berjaya dikemaskini.',
      admin: updated,
    });
  } catch (err) {
    console.error('[admin/admins/[id] PATCH] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Ralat pelayan.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete admin account
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const currentAdmin = await getAdminFromSessionToken(sessionToken);

    if (!currentAdmin) {
      return NextResponse.json(
        { success: false, message: 'Tidak dibenarkan. Sila log masuk pentadbir.' },
        { status: 401 }
      );
    }

    // Only super_admin can delete admins
    if (currentAdmin.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Hanya Super Admin dibenarkan memadam akaun pentadbir.' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Protection: Cannot delete self
    if (currentAdmin.id === id) {
      return NextResponse.json(
        { success: false, message: 'Anda tidak boleh memadam akaun anda sendiri.' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Pangkalan data tidak dapat dihubungi.' },
        { status: 500 }
      );
    }

    // Check target admin
    const { data: targetAdmin } = await supabase
      .from('admins')
      .select('role, full_name')
      .eq('id', id)
      .single();

    if (!targetAdmin) {
      return NextResponse.json(
        { success: false, message: 'Pentadbir tidak dijumpai.' },
        { status: 404 }
      );
    }

    // If target is super_admin, verify there is at least one other super_admin
    if (targetAdmin.role === 'super_admin') {
      const { count } = await supabase
        .from('admins')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'super_admin');

      if ((count || 0) <= 1) {
        return NextResponse.json(
          { success: false, message: 'Tidak boleh memadam satu-satunya akaun Super Admin sistem.' },
          { status: 400 }
        );
      }
    }

    const { error: deleteErr } = await supabase
      .from('admins')
      .delete()
      .eq('id', id);

    if (deleteErr) {
      return NextResponse.json(
        { success: false, message: 'Gagal memadam pentadbir.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Akaun pentadbir ${targetAdmin.full_name} berjaya dipadam.`,
    });
  } catch (err) {
    console.error('[admin/admins/[id] DELETE] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Ralat pelayan.' },
      { status: 500 }
    );
  }
}
