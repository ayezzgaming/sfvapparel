-- =====================================================
-- SVF APPAREL: Order Visual Proofing & Revision History
-- Jalankan skrip ini di Supabase SQL Editor (Dashboard)
-- =====================================================

-- 1. Tambah kolum sistem semakan visual proof & histori revisi pada jadual orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_status TEXT DEFAULT 'waiting_for_artwork';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_revisions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_artwork_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_artwork_back_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_feedback TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS proof_approved_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS current_revision_number INTEGER DEFAULT 0;

-- 2. Indeks prestasi untuk semakan status proof
CREATE INDEX IF NOT EXISTS idx_orders_proof_status ON orders(proof_status);

-- SELESAI! ✅
