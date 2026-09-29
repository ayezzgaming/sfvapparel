-- =====================================================
-- SVF APPAREL: WhatsApp Bot & Chatbot Auto-Reply Settings
-- =====================================================

CREATE TABLE IF NOT EXISTS whatsapp_bot_settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    auto_reply_enabled BOOLEAN DEFAULT true NOT NULL,
    paused_reason TEXT,
    updated_by TEXT DEFAULT 'admin',
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Nyahaktifkan RLS untuk akses service role backend
ALTER TABLE IF EXISTS whatsapp_bot_settings DISABLE ROW LEVEL SECURITY;

-- Masukkan rekod lalai jika belum wujud
INSERT INTO whatsapp_bot_settings (id, auto_reply_enabled, updated_by, updated_at)
VALUES ('default', true, 'system', now())
ON CONFLICT (id) DO NOTHING;
