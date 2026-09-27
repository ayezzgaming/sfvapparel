-- =====================================================
-- SVF APPAREL: Admin Authentication & Management Schema
-- Jalankan skrip ini di Supabase SQL Editor (Dashboard)
-- =====================================================

-- 1. Pastikan Extension UUID aktif
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Jadual Pentadbir (Admins)
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'admin', -- 'super_admin' | 'admin' | 'operator'
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Jadual Sesi Pentadbir (Admin Sessions)
CREATE TABLE IF NOT EXISTS admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Jadual Log Audit Pentadbir (Audit Trail)
CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    admin_name TEXT,
    action TEXT NOT NULL, -- e.g. 'LOGIN', 'CREATE_ADMIN', 'UPDATE_PRICE', 'UPDATE_STATUS'
    resource_type TEXT,   -- e.g. 'ORDER', 'PRODUCT', 'ADMIN', 'SETTINGS'
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Indeks Prestasi (Performance Indexes)
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);

-- 6. Nyahaktifkan RLS untuk operasi pelayan (API backend menggunakan Service Role Key)
ALTER TABLE IF EXISTS admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS admin_audit_logs DISABLE ROW LEVEL SECURITY;

-- 7. Masukkan Akaun Super Admin Lalai jika belum wujud
-- Kata laluan lalai: Admin@123456
-- Hash yang dijanakan menggunakan sha256 pbkdf2 / crypto standard
INSERT INTO admins (
    id,
    email,
    password_hash,
    password_salt,
    full_name,
    role,
    is_active,
    created_at,
    updated_at
)
VALUES (
    'a0000000-0000-0000-0000-000000000001',
    'admin@sfvapparel.com',
    '52b52430fde7c1054002a5476170d3d4817154ee3eef4baf48d9a7f5f520850bb584d37b256a487eea034dd108abc97e4437d8d68cd05c6e9a860954ba29ffb5',
    'sfv_apparel_admin_salt_2026',
    'Super Admin SFV',
    'super_admin',
    true,
    now(),
    now()
)
ON CONFLICT (email) DO NOTHING;

-- SELESAI! ✅
