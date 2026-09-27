import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import {
  hashPassword,
  verifyPassword,
  generateSessionToken,
  ADMIN_COOKIE_NAME,
  ADMIN_COOKIE_MAX_AGE,
} from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, rememberMe } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Sila masukkan emel dan kata laluan.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabase = getServiceSupabase();

    if (!supabase) {
      return NextResponse.json(
        { success: false, message: 'Pangkalan data tidak dapat dihubungi.' },
        { status: 500 }
      );
    }

    // Query admin by email
    const { data: admin, error } = await supabase
      .from('admins')
      .select('*')
      .ilike('email', cleanEmail)
      .single();

    if (error || !admin) {
      // If no admin exists in table at all, check if this is the default admin credentials to auto-seed
      const { count } = await supabase.from('admins').select('*', { count: 'exact', head: true });
      if (count === 0 && cleanEmail === 'admin@sfvapparel.com' && password === 'Admin@123456') {
        const { hash, salt } = hashPassword('Admin@123456');
        const { data: newAdmin, error: seedErr } = await supabase
          .from('admins')
          .insert({
            email: 'admin@sfvapparel.com',
            password_hash: hash,
            password_salt: salt,
            full_name: 'Super Admin SFV',
            role: 'super_admin',
            is_active: true,
          })
          .select('*')
          .single();

        if (!seedErr && newAdmin) {
          // Generate session
          const sessionToken = generateSessionToken();
          const maxAge = rememberMe ? 60 * 60 * 24 * 30 : ADMIN_COOKIE_MAX_AGE;
          const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();

          await supabase.from('admin_sessions').insert({
            admin_id: newAdmin.id,
            session_token: sessionToken,
            expires_at: expiresAt,
          });

          const res = NextResponse.json({
            success: true,
            message: 'Log masuk berjaya (Akaun Pentadbir Utama dicipta).',
            admin: {
              id: newAdmin.id,
              email: newAdmin.email,
              full_name: newAdmin.full_name,
              role: newAdmin.role,
              phone: newAdmin.phone,
              avatar_url: newAdmin.avatar_url,
            },
          });

          res.cookies.set({
            name: ADMIN_COOKIE_NAME,
            value: sessionToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: maxAge,
          });

          return res;
        }
      }

      return NextResponse.json(
        { success: false, message: 'Emel atau kata laluan tidak sah.' },
        { status: 401 }
      );
    }

    if (!admin.is_active) {
      return NextResponse.json(
        { success: false, message: 'Akaun pentadbir ini telah dinyahaktifkan. Sila hubungi Super Admin.' },
        { status: 403 }
      );
    }

    // Verify password
    const isMatch = verifyPassword(password, admin.password_hash, admin.password_salt);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Emel atau kata laluan tidak sah.' },
        { status: 401 }
      );
    }

    // Generate session
    const sessionToken = generateSessionToken();
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : ADMIN_COOKIE_MAX_AGE;
    const expiresAt = new Date(Date.now() + maxAge * 1000).toISOString();

    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';

    // Insert session into database
    await supabase.from('admin_sessions').insert({
      admin_id: admin.id,
      session_token: sessionToken,
      ip_address: clientIp.slice(0, 45),
      user_agent: userAgent.slice(0, 255),
      expires_at: expiresAt,
    });

    // Update last_login_at
    await supabase
      .from('admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', admin.id);

    // Create Audit Log
    try {
      await supabase.from('admin_audit_logs').insert({
        admin_id: admin.id,
        admin_name: admin.full_name,
        action: 'LOGIN',
        resource_type: 'AUTH',
        details: { ip: clientIp, userAgent: userAgent.slice(0, 100) },
      });
    } catch {
      // Audit log is non-blocking
    }

    const response = NextResponse.json({
      success: true,
      message: 'Log masuk berjaya.',
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        phone: admin.phone,
        avatar_url: admin.avatar_url,
        last_login_at: admin.last_login_at,
      },
    });

    // Set HTTP-only secure cookie
    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAge,
    });

    return response;
  } catch (err) {
    console.error('[admin/auth/login] Error:', err);
    return NextResponse.json(
      { success: false, message: 'Ralat pelayan semasa log masuk.' },
      { status: 500 }
    );
  }
}
