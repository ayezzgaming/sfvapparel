-- =====================================================
-- SVF APPAREL: Auth System Migration
-- Jalankan ini di Supabase SQL Editor (Dashboard)
-- =====================================================

-- 1. OTP Verifications Table (short-lived, auto-cleanup)
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,
    otp_code TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Customer Sessions Table (httpOnly cookie)
CREATE TABLE IF NOT EXISTS customer_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Extend customers table with WhatsApp fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- 4. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_customer_sessions_token ON customer_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp);

-- 5. Disable RLS (semua server ops guna service role key)
ALTER TABLE IF EXISTS otp_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_sessions DISABLE ROW LEVEL SECURITY;

-- SELESAI! ✅
