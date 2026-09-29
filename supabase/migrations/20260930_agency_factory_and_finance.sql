-- =========================================================================
-- SVF APPAREL AGENCY, ALL-IN-ONE FACTORY JOBS & FINANCIAL MANAGEMENT TABLES
-- Date: 2026-09-30
-- =========================================================================

-- 1. PARTNER FACTORIES DIRECTORY (Kilang Sublimasi All-in-One Rakan Kongsi)
CREATE TABLE IF NOT EXISTS partner_factories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factory_name VARCHAR(255) NOT NULL,
    pic_name VARCHAR(150),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    specialty VARCHAR(100) DEFAULT 'Full Sublimation All-in-One',
    default_unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    lead_time_days INT DEFAULT 7,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FACTORY PRODUCTION JOB SHEETS (Job Sheet Tech Pack All-in-One)
CREATE TABLE IF NOT EXISTS factory_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    factory_id UUID REFERENCES partner_factories(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'sent_to_factory', 'in_production', 'factory_completed', 'received_at_svf', 'closed'
    
    -- Production Dates
    target_ready_date DATE,
    sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Production Costing (COGS Job Level)
    total_quantity INT NOT NULL DEFAULT 0,
    cost_per_unit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total_factory_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    factory_payment_status VARCHAR(50) DEFAULT 'unpaid', -- 'unpaid', 'deposit_paid', 'fully_paid'
    
    -- Agency Gross Profit Calculations
    customer_price_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    gross_profit NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    gross_margin_percent NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    
    -- Technical Specs
    fabric_spec VARCHAR(150),
    collar_spec VARCHAR(150),
    cutting_spec VARCHAR(150),
    sizing_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    player_roster JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Artwork & Instructions
    artwork_hd_url TEXT,
    mockup_preview_url TEXT,
    factory_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GLOBAL OPERATING EXPENSES (Perbelanjaan Operasi & Iklan Global)
CREATE TABLE IF NOT EXISTS operating_expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'ads_meta', 'ads_google', 'ads_tiktok', 'rent', 'utilities', 'payroll', 'software', 'general_opex'
    title VARCHAR(255) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'bank_transfer',
    vendor_merchant VARCHAR(255),
    receipt_attachment_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FINANCIAL TRANSACTIONS LEDGER (Lejar Aliran Tunai Mutlak)
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'income', 'cogs_expense', 'opex_expense'
    category VARCHAR(50) NOT NULL, -- 'customer_deposit', 'customer_balance', 'factory_payment', 'ads_spend', 'operating_expense'
    
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    factory_job_id UUID REFERENCES factory_jobs(id) ON DELETE SET NULL,
    expense_id UUID REFERENCES operating_expenses(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    factory_id UUID REFERENCES partner_factories(id) ON DELETE SET NULL,
    
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'chip_gateway', 'bank_transfer', 'duitnow', 'cash'
    payment_gateway_ref VARCHAR(255),
    status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'pending', 'cancelled'
    description TEXT,
    receipt_url TEXT,
    transaction_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ultra-fast queries & reporting
CREATE INDEX IF NOT EXISTS idx_factory_jobs_order_id ON factory_jobs(order_id);
CREATE INDEX IF NOT EXISTS idx_factory_jobs_factory_id ON factory_jobs(factory_id);
CREATE INDEX IF NOT EXISTS idx_factory_jobs_status ON factory_jobs(status);
CREATE INDEX IF NOT EXISTS idx_operating_expenses_category ON operating_expenses(category);
CREATE INDEX IF NOT EXISTS idx_operating_expenses_date ON operating_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_category ON financial_transactions(category);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);

-- Seed Initial Default Partner Factory (Kilang Contoh)
INSERT INTO partner_factories (factory_name, pic_name, phone, address, specialty, default_unit_cost, lead_time_days, notes)
VALUES 
('Kilang Sublimasi Utama (Selangor)', 'En. Rizal (Pengurus Kilang)', '60123456789', 'Shah Alam, Selangor', 'Full Sublimation All-in-One (Cetak + Potong + Jahit)', 22.00, 7, 'Kilang rakan kongsi utama untuk tempahan jersi sukan standard & interlock.'),
('Sublimation Pro Hub (Johor)', 'Pn. Aisyah', '60198765432', 'Johor Bahru, Johor', 'Full Sublimation & Muslimah Cut', 24.00, 8, 'Khusus untuk potongan Muslimah dan kolar polo.')
ON CONFLICT DO NOTHING;
