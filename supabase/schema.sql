-- SVF APPAREL Database Schema (Supabase PostgreSQL)
-- Custom Apparel Printing Platform: Sublimation & DTF

-- 1. Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles / Customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    company_or_team TEXT,
    address TEXT,
    city TEXT,
    postal_code TEXT,
    notes TEXT,
    total_orders INTEGER DEFAULT 0,
    total_spent NUMERIC(12,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Catalog & Design Mockups (NO BASE PRICES AS REQUIRED)
CREATE TABLE IF NOT EXISTS designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT, -- e.g. 'SFV0001', 'SFV0002'
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- Jersey, T-Shirt, Hoodie, Polo, Windbreaker, Banner, etc.
    print_type TEXT NOT NULL, -- 'sublimation' | 'dtf' | 'both'
    thumbnail_url TEXT NOT NULL,
    mockup_front_url TEXT NOT NULL,
    mockup_back_url TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Sublimation: Fabric Materials & Base Rates
CREATE TABLE IF NOT EXISTS fabric_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    weight_gsm INTEGER NOT NULL, -- e.g. 150, 180, 220
    breathability TEXT DEFAULT 'High', -- 'Standard', 'High', 'Ultra Breathable'
    sublimation_base_price NUMERIC(10,2) NOT NULL, -- Base rate per jersey in MYR (RM)
    description TEXT,
    is_popular BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- 5. Sublimation: Apparel Cuts & Modifiers
CREATE TABLE IF NOT EXISTS apparel_cuts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- 'short_sleeve_standard', 'raglan', 'long_sleeve', 'polo_collar', 'v_neck', 'oversized'
    cut_add_on_price NUMERIC(10,2) DEFAULT 0.00, -- Extra cost added to fabric base in MYR (RM)
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- 6. DTF: Standard Dimensions & Film Meterage
CREATE TABLE IF NOT EXISTS dtf_dimensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE, -- 'pocket_10x10', 'a4', 'a3', 'a2', 'gang_sheet_meter'
    dimensions_desc TEXT NOT NULL, -- '10 x 10 cm', '21 x 29.7 cm', '58 x 100 cm (Roll)'
    base_price NUMERIC(10,2) NOT NULL, -- Base price in MYR (RM)
    is_meter_rate BOOLEAN DEFAULT false,
    garment_included_base_price NUMERIC(10,2) DEFAULT 0.00, -- Optional when bundled with premium cotton blank in MYR (RM)
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- 7. Quantity Tier Volume Discounts
CREATE TABLE IF NOT EXISTS quantity_tier_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tier_label TEXT NOT NULL,
    min_qty INTEGER NOT NULL,
    max_qty INTEGER, -- NULL means infinity (e.g. 200+)
    discount_percentage NUMERIC(5,2) NOT NULL, -- e.g. 10.00 for 10%
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    print_type TEXT NOT NULL, -- 'sublimation' | 'dtf'
    
    -- Design reference
    design_id UUID REFERENCES designs(id) ON DELETE SET NULL,
    design_title TEXT NOT NULL,
    mockup_url TEXT,
    custom_artwork_url TEXT,
    
    -- Sublimation specific specs
    fabric_material_id UUID REFERENCES fabric_materials(id) ON DELETE SET NULL,
    fabric_name TEXT,
    apparel_cut_id UUID REFERENCES apparel_cuts(id) ON DELETE SET NULL,
    cut_name TEXT,
    
    -- DTF specific specs
    dtf_dimension_id UUID REFERENCES dtf_dimensions(id) ON DELETE SET NULL,
    dtf_dimension_name TEXT,
    dtf_option_type TEXT, -- 'film_only' | 'with_garment'
    garment_blank_color TEXT,
    
    -- Sizing & Breakdown JSON: e.g. {"XS": 2, "S": 5, "M": 10, "L": 8, "XL": 4, "2XL": 1}
    sizing_breakdown JSONB DEFAULT '{}'::jsonb,
    total_quantity INTEGER NOT NULL,
    
    -- Financials calculated by dynamic engine (MYR / RM)
    raw_unit_price NUMERIC(10,2) NOT NULL,
    discount_percentage NUMERIC(5,2) DEFAULT 0.00,
    final_unit_price NUMERIC(10,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    
    -- Status pipeline
    status TEXT NOT NULL DEFAULT 'pending_proof', 
    -- 'pending_proof' | 'proof_approved' | 'in_printing' | 'heat_press' | 'sewing' | 'qc_check' | 'ready_to_ship' | 'delivered' | 'cancelled'
    
    production_notes TEXT,
    shipping_address TEXT,
    shipping_courier TEXT,
    tracking_number TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Order Status History Timeline
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    note TEXT,
    updated_by TEXT DEFAULT 'System',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------
-- SEED DATA (MYR / RM)
-- -------------------------------------------------------------

-- Fabric Materials (Sublimation)
INSERT INTO fabric_materials (name, code, weight_gsm, breathability, sublimation_base_price, description, is_popular, sort_order) VALUES
('Drifit Milano (Premium)', 'drifit_milano', 165, 'Ultra Breathable', 35.00, 'Tekstur zigzag mikro, penyejatan peluh pantas, terbaik untuk jersi bola sepak pro & e-sukan.', true, 1),
('Drifit Microfiber (Smooth)', 'drifit_microfiber', 155, 'High', 32.00, 'Permukaan licin sutera, warna cetakan tajam, sesuai untuk larian dan badminton.', true, 2),
('Poly-Mesh Honeycomb', 'poly_mesh_honeycomb', 180, 'Ultra Breathable', 38.00, 'Sulaman heksagon berventilasi, pengudaraan maksimum untuk sukan berintensiti tinggi.', false, 3),
('Spandex Poly-Blend (4-Way Stretch)', 'spandex_poly', 210, 'High', 42.00, 'Regangan mampatan 4 hala fleksibel, bebas kedutan, sesuai untuk aktiviti berbasikal.', false, 4),
('Coolmax Anti-Bacterial', 'coolmax_antibacterial', 170, 'Ultra Breathable', 45.00, 'Benang ion perak dengan perlindungan anti-bau dan kawalan penyejukan haba.', true, 5)
ON CONFLICT (code) DO NOTHING;

-- Apparel Cuts (Sublimation)
INSERT INTO apparel_cuts (name, code, cut_add_on_price, description, sort_order) VALUES
('Lengan Pendek Standard Crew', 'ss_crew', 0.00, 'Kolar bulat O-Neck klasik dengan potongan lengan standard kemas.', 1),
('Lengan Pendek V-Neck Pro', 'ss_vneck', 2.00, 'Kolar V-Neck sukan dengan pita leher bertetulang jahitan kemas.', 2),
('Potongan Raglan Athletic', 'raglan_ss', 3.00, 'Lengan bersambung diagonal dari leher ke ketiak untuk fleksibiliti lengan.', 3),
('Kolar Polo + Butang Placket', 'polo_collar', 6.00, 'Kolar berbutang kemas tahan lasak sesuai korporat & kelab sukan.', 4),
('Lengan Panjang Berkaf Elastik', 'ls_elastic', 5.00, 'Lengan panjang penuh dengan kaf bergetah lembut di pergelangan tangan.', 5),
('Potongan Oversized Streetwear', 'oversized_box', 4.00, 'Siluet labuh santai moden dengan kolar tebal tahan regangan.', 6)
ON CONFLICT (code) DO NOTHING;

-- DTF Dimensions
INSERT INTO dtf_dimensions (name, code, dimensions_desc, base_price, is_meter_rate, garment_included_base_price, description, sort_order) VALUES
('Logo / Poket (10x10 cm)', 'dtf_pocket', '10 x 10 cm', 5.00, false, 18.00, 'Sesuai untuk lencana dada, logo lengan atau label leher belakang.', 1),
('A4 Cetakan Sederhana (21x29.7 cm)', 'dtf_a4', '21 x 29.7 cm', 12.00, false, 25.00, 'Grafik saiz standard bahagian dada atau belakang baju T dan hoodie.', 2),
('A3 Cetakan Penuh (30x42 cm)', 'dtf_a3', '30 x 42 cm', 18.00, false, 32.00, 'Grafik besar bahagian depan atau belakang dengan ketepatan warna HD.', 3),
('A2 Cetakan Jumbo (42x59.4 cm)', 'dtf_a2', '42 x 59.4 cm', 28.00, false, 45.00, 'Liputan cetakan ekstra besar melintasi bahagian depan atau labuh baju.', 4),
('Gang Sheet Semeter (58x100 cm)', 'dtf_meter', '58 x 100 cm (Gulung)', 32.00, true, 0.00, 'Gulungan cetakan komersial. Susun artwork tanpa had dalam lebar 58cm.', 5)
ON CONFLICT (code) DO NOTHING;

-- Volume Quantity Tiers
INSERT INTO quantity_tier_discounts (tier_label, min_qty, max_qty, discount_percentage) VALUES
('Sample / 1-5 Pcs', 1, 5, 0.00),
('Squad Pack / 6-12 Pcs', 6, 12, 5.00),
('Team Pack / 13-24 Pcs', 13, 24, 10.00),
('Club Pack / 25-50 Pcs', 25, 50, 15.00),
('Bulk / 51-100 Pcs', 51, 100, 20.00),
('Enterprise / 101+ Pcs', 101, NULL, 25.00)
ON CONFLICT DO NOTHING;

-- Catalog Designs (NO BASE PRICES)
INSERT INTO designs (title, category, print_type, thumbnail_url, mockup_front_url, mockup_back_url, description, tags, is_featured) VALUES
('Valkyrie Cyber Esports Jersey', 'Jersey', 'sublimation', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80', 'Futuristic neon geometric sublimation design optimized for high-intensity gaming jerseys.', ARRAY['esports', 'cyberpunk', 'neon', 'jersey'], true),
('Apex Gradient Football Kit', 'Jersey', 'sublimation', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=800&auto=format&fit=crop&q=80', 'Dual-tone fluid wave sublimation graphics engineered for professional football & futsal squads.', ARRAY['football', 'futsal', 'gradient', 'sports'], true),
('Tokyo Drift Neo-Tokyo DTF Tee', 'T-Shirt', 'dtf', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80', 'High-density DTF direct transfer artwork with vibrant Japanese typography and automotive illustration.', ARRAY['dtf', 'streetwear', 'japan', 'oversized'], true),
('Monochrome Glitch Heavy Hoodie', 'Hoodie', 'dtf', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80', 'High-definition elastomeric DTF backpiece with glitch distortion effect on heavyweight cotton fleece.', ARRAY['hoodie', 'streetwear', 'dtf', 'glitch'], true),
('AeroFlow Pro Cycling Jersey', 'Jersey', 'sublimation', 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80', 'Topographic contour print with 3-pocket back panel sublimation cut for road and gravel cyclists.', ARRAY['cycling', 'aerodynamic', 'contour', 'sublimation'], true),
('Signature Club Pique Polo', 'Polo', 'both', 'https://images.unsplash.com/photo-1625910513413-7a718797f1df?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1625910513413-7a718797f1df?w=800&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80', 'Sublimated patterned collar with custom DTF chest crest badge for golf, corporate & staff wear.', ARRAY['polo', 'corporate', 'golf', 'custom'], false)
ON CONFLICT DO NOTHING;

-- -------------------------------------------------------------
-- CMS & DYNAMIC PUBLIC CONTENT MANAGEMENT
-- -------------------------------------------------------------

-- 9. Hero Banners
CREATE TABLE IF NOT EXISTS cms_hero_banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    status_pill TEXT DEFAULT 'Kilang Beroperasi',
    tag_text TEXT DEFAULT 'Koleksi Rasmi 2026',
    title TEXT NOT NULL,
    button_text TEXT DEFAULT 'Katalog',
    button_link TEXT DEFAULT '/catalog',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Services (Pilihan Servis)
CREATE TABLE IF NOT EXISTS cms_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    headline TEXT NOT NULL,
    highlight TEXT NOT NULL,
    price_prefix TEXT DEFAULT 'Bermula',
    price_amount TEXT NOT NULL,
    price_unit TEXT DEFAULT '/ helai',
    image_url TEXT NOT NULL,
    href TEXT NOT NULL,
    details JSONB DEFAULT '[]'::jsonb,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Production Videos (Proses Produksi)
CREATE TABLE IF NOT EXISTS cms_production_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    youtube_id TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Production Showcase Gallery (Hasil Produksi Kilang)
CREATE TABLE IF NOT EXISTS cms_production_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    fabric TEXT NOT NULL,
    image_url TEXT NOT NULL,
    client TEXT NOT NULL,
    tag TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 13. Customer Testimonials (Apa Kata Mereka)
CREATE TABLE IF NOT EXISTS cms_testimonials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    initial TEXT NOT NULL,
    avatar_bg TEXT DEFAULT 'bg-blue-100',
    avatar_text TEXT DEFAULT 'text-blue-600',
    platform TEXT NOT NULL, -- 'google' | 'tiktok' | 'facebook' | 'instagram'
    rating INTEGER DEFAULT 5,
    review TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. Company Settings & Slogan
CREATE TABLE IF NOT EXISTS cms_company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    registration_number TEXT NOT NULL,
    tagline TEXT,
    phone TEXT NOT NULL,
    whatsapp_number TEXT NOT NULL,
    whatsapp_default_message TEXT,
    email TEXT NOT NULL,
    address TEXT NOT NULL,
    working_hours TEXT,
    telegram_catalog_url TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    tiktok_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_slogan_quote (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    headline TEXT NOT NULL,
    highlight_text TEXT NOT NULL,
    question_text TEXT NOT NULL,
    description_text TEXT NOT NULL,
    button_text TEXT NOT NULL,
    whatsapp_message TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_policies (
    id TEXT PRIMARY KEY, -- 'privacy' | 'terms' | 'warranty' | 'shipping'
    badge TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    sections JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 15. Ads Generator: Connected Platform Accounts & API Tokens
CREATE TABLE IF NOT EXISTS ad_platform_connections (
    id TEXT PRIMARY KEY, -- 'facebook', 'instagram', 'whatsapp', 'google', 'tiktok'
    name TEXT NOT NULL,
    account_id TEXT,
    account_name TEXT,
    profile_picture_url TEXT,
    access_token TEXT,
    pixel_id TEXT,
    currency TEXT DEFAULT 'MYR',
    balance NUMERIC(12,2) DEFAULT 0.00,
    is_connected BOOLEAN DEFAULT false,
    last_synced TEXT,
    insight JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 16. Ads Generator: Campaigns & Performance Analytics
CREATE TABLE IF NOT EXISTS ad_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT NOT NULL,
    objective TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'paused' | 'draft' | 'completed'
    daily_budget NUMERIC(10,2) DEFAULT 30.00,
    spent NUMERIC(12,2) DEFAULT 0.00,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    leads_or_conversions INTEGER DEFAULT 0,
    cpc NUMERIC(10,2) DEFAULT 0.00,
    creative JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Open Access / Disable RLS for Ads Generator Tables (Ensures cross-device sync works seamlessly)
ALTER TABLE IF EXISTS ad_platform_connections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ad_campaigns DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS designs DISABLE ROW LEVEL SECURITY;


-- =====================================================
-- AUTH SYSTEM: Customer Authentication (WhatsApp OTP)
-- =====================================================

-- OTP Verifications (short-lived, auto-cleanup)
CREATE TABLE IF NOT EXISTS otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT NOT NULL,             -- WhatsApp number e.g. '601XXXXXXXX'
    otp_code TEXT NOT NULL,          -- 6-digit code
    attempts INTEGER DEFAULT 0,      -- Track failed attempts (max 5)
    expires_at TIMESTAMPTZ NOT NULL, -- 5 minutes from creation
    is_used BOOLEAN DEFAULT false,   -- Prevent reuse
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Customer Sessions (httpOnly cookie token)
CREATE TABLE IF NOT EXISTS customer_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    session_token TEXT NOT NULL UNIQUE, -- Random secure token stored in cookie
    expires_at TIMESTAMPTZ NOT NULL,    -- 30 days
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Extend customers table with WhatsApp fields (safe to run multiple times)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;

-- Index for fast session lookup
CREATE INDEX IF NOT EXISTS idx_customer_sessions_token ON customer_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_otp_verifications_phone ON otp_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_customers_whatsapp ON customers(whatsapp);

-- Disable RLS for auth tables (using service role for all server ops)
ALTER TABLE IF EXISTS otp_verifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS customer_sessions DISABLE ROW LEVEL SECURITY;

