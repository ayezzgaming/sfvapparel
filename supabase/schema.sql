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
    sublimation_base_price NUMERIC(10,2) NOT NULL, -- Base rate per jersey in IDR/USD
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
    cut_add_on_price NUMERIC(10,2) DEFAULT 0.00, -- Extra cost added to fabric base
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
    base_price NUMERIC(10,2) NOT NULL,
    is_meter_rate BOOLEAN DEFAULT false,
    garment_included_base_price NUMERIC(10,2) DEFAULT 0.00, -- Optional when bundled with premium cotton blank
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
    
    -- Financials calculated by dynamic engine
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
-- SEED DATA
-- -------------------------------------------------------------

-- Fabric Materials (Sublimation)
INSERT INTO fabric_materials (name, code, weight_gsm, breathability, sublimation_base_price, description, is_popular, sort_order) VALUES
('Drifit Milano (Premium)', 'drifit_milano', 165, 'Ultra Breathable', 115000, 'Micro-pore zigzag texture, swift sweat evaporation, best for pro football & esports jerseys.', true, 1),
('Drifit Microfiber (Smooth)', 'drifit_microfiber', 155, 'High', 105000, 'Silky smooth handfeel, sharpest color reproduction, great for running and badminton.', true, 2),
('Poly-Mesh Honeycomb', 'poly_mesh_honeycomb', 180, 'Ultra Breathable', 120000, 'Hexagonal aerated knit, maximum ventilation for high-heat sports and basketball.', false, 3),
('Spandex Poly-Blend (4-Way Stretch)', 'spandex_poly', 210, 'High', 135000, 'Flexible compression stretch, wrinkle-free, perfect for cycling and compression wear.', false, 4),
('Coolmax Anti-Bacterial', 'coolmax_antibacterial', 170, 'Ultra Breathable', 145000, 'Silver-ion infused yarn with anti-odor protection and thermal cooling regulation.', true, 5)
ON CONFLICT (code) DO NOTHING;

-- Apparel Cuts (Sublimation)
INSERT INTO apparel_cuts (name, code, cut_add_on_price, description, sort_order) VALUES
('Short Sleeve Standard Crew', 'ss_crew', 0, 'Classic O-Neck crew collar with standard fitted short sleeves.', 1),
('Short Sleeve V-Neck Pro', 'ss_vneck', 5000, 'Athletic V-Neck collar with reinforced stitch neck tape.', 2),
('Raglan Sleeve Athletic Cut', 'raglan_ss', 8000, 'Diagonal continuous sleeve from collar to underarm for enhanced arm mobility.', 3),
('Polo Collar + 3-Button Placket', 'polo_collar', 18000, 'Ribbed knit or sublimated collar with concealed reinforced button placket.', 4),
('Long Sleeve Elastic Cuff', 'ls_elastic', 15000, 'Full length sleeves with ribbed cuffs, ideal for goalkeeper, cycling & outdoor.', 5),
('Oversized Streetwear Fit', 'oversized_box', 12000, 'Modern relaxed drop-shoulder silhouette with heavy-duty ribbed collar.', 6)
ON CONFLICT (code) DO NOTHING;

-- DTF Dimensions
INSERT INTO dtf_dimensions (name, code, dimensions_desc, base_price, is_meter_rate, garment_included_base_price, description, sort_order) VALUES
('Logo / Pocket Size (10x10 cm)', 'dtf_pocket', '10 x 10 cm', 8000, false, 45000, 'Ideal for chest pocket emblems, sleeve badges, or neck labels.', 1),
('A4 Medium Print (21x29.7 cm)', 'dtf_a4', '21 x 29.7 cm', 22000, false, 65000, 'Standard chest or back center graphic on t-shirts and hoodies.', 2),
('A3 Large Statement (30x42 cm)', 'dtf_a3', '30 x 42 cm', 38000, false, 85000, 'Oversized front or full-back artwork with vivid gradient saturation.', 3),
('A2 Poster / Jumbo (42x59.4 cm)', 'dtf_a2', '42 x 59.4 cm', 65000, false, 115000, 'Jumbo print coverage across seams, front and bottom hem.', 4),
('Gang Sheet per Meter (58x100 cm)', 'dtf_meter', '58 x 100 cm (Roll)', 75000, true, 0, 'Commercial print-only roll. Arrange unlimited graphics within 58cm width.', 5)
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
