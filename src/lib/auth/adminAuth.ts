import crypto from 'crypto';
import { getServiceSupabase } from '@/lib/supabase/serverClient';

export const ADMIN_COOKIE_NAME = 'svf_admin_session';
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Hash a password using PBKDF2 with SHA-512
 */
export function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

/**
 * Verify a plaintext password against a stored hash and salt
 */
export function verifyPassword(password: string, storedHash: string, storedSalt: string): boolean {
  try {
    const { hash } = hashPassword(password, storedSalt);
    const hashBuffer = Buffer.from(hash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');
    if (hashBuffer.length !== storedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(hashBuffer, storedBuffer);
  } catch {
    return false;
  }
}

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export interface AdminPayload {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'operator';
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  last_login_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Validate admin session from cookie token
 */
export async function getAdminFromSessionToken(sessionToken: string | undefined): Promise<AdminPayload | null> {
  if (!sessionToken) return null;

  const supabase = getServiceSupabase();
  if (!supabase) return null;

  try {
    const { data: session, error: sessionErr } = await supabase
      .from('admin_sessions')
      .select('*, admins(*)')
      .eq('session_token', sessionToken)
      .single();

    if (sessionErr || !session || !session.admins) {
      return null;
    }

    // Check expiration
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await supabase.from('admin_sessions').delete().eq('session_token', sessionToken);
      return null;
    }

    const admin = session.admins as Record<string, unknown>;

    // Check if admin is active
    if (admin.is_active === false) {
      return null;
    }

    return {
      id: admin.id as string,
      email: admin.email as string,
      full_name: admin.full_name as string,
      role: (admin.role as 'super_admin' | 'admin' | 'operator') || 'admin',
      phone: (admin.phone as string) || null,
      avatar_url: (admin.avatar_url as string) || null,
      is_active: Boolean(admin.is_active),
      last_login_at: (admin.last_login_at as string) || null,
      created_at: (admin.created_at as string) || undefined,
      updated_at: (admin.updated_at as string) || undefined,
    };
  } catch (err) {
    console.error('[getAdminFromSessionToken] Error:', err);
    return null;
  }
}
