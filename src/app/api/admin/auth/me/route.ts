import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE_NAME, getAdminFromSessionToken } from '@/lib/auth/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, admin: null, authenticated: false },
        { status: 200 }
      );
    }

    const admin = await getAdminFromSessionToken(sessionToken);

    if (!admin) {
      const res = NextResponse.json(
        { success: false, admin: null, authenticated: false },
        { status: 200 }
      );
      res.cookies.delete(ADMIN_COOKIE_NAME);
      return res;
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      admin: {
        id: admin.id,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role,
        phone: admin.phone,
        avatar_url: admin.avatar_url,
        last_login_at: admin.last_login_at,
        created_at: admin.created_at,
      },
    });
  } catch (err) {
    console.error('[admin/auth/me] Error:', err);
    return NextResponse.json(
      { success: false, admin: null, authenticated: false },
      { status: 500 }
    );
  }
}
