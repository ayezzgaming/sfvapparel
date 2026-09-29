-- =========================================================================
-- SVF APPAREL: COMPLETE ROW LEVEL SECURITY (RLS) & DATABASE HARDENING
-- =========================================================================

-- 1. KUNCI DATA SENSITIF & DALAMAN (ADMIN, AUDIT, PESANAN, PELANGGAN, KILANG, KEWANGAN)
-- Akses awam (anon) DISEKAT SEPENUHNYA. Hanya backend (service_role) boleh akses.

ALTER TABLE IF EXISTS admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admins_service_role_all" ON admins;
CREATE POLICY "admins_service_role_all" ON admins FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_audit_logs_service_role_all" ON admin_audit_logs;
CREATE POLICY "admin_audit_logs_service_role_all" ON admin_audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers_service_role_all" ON customers;
CREATE POLICY "customers_service_role_all" ON customers FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders_service_role_all" ON orders;
CREATE POLICY "orders_service_role_all" ON orders FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS partner_factories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partner_factories_service_role_all" ON partner_factories;
CREATE POLICY "partner_factories_service_role_all" ON partner_factories FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS factory_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "factory_jobs_service_role_all" ON factory_jobs;
CREATE POLICY "factory_jobs_service_role_all" ON factory_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS operating_expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "operating_expenses_service_role_all" ON operating_expenses;
CREATE POLICY "operating_expenses_service_role_all" ON operating_expenses FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "financial_transactions_service_role_all" ON financial_transactions;
CREATE POLICY "financial_transactions_service_role_all" ON financial_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 2. KATALOG AWAM & FORMULA HARGA (BACA SAHAJA UNTUK AWAM, CIPTA/PADAM UNTUK SERVICE ROLE)
ALTER TABLE IF EXISTS designs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "designs_public_read" ON designs;
CREATE POLICY "designs_public_read" ON designs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "designs_service_role_all" ON designs;
CREATE POLICY "designs_service_role_all" ON designs FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS fabric_materials ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "fabric_materials_public_read" ON fabric_materials;
CREATE POLICY "fabric_materials_public_read" ON fabric_materials FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "fabric_materials_service_role_all" ON fabric_materials;
CREATE POLICY "fabric_materials_service_role_all" ON fabric_materials FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS apparel_cuts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "apparel_cuts_public_read" ON apparel_cuts;
CREATE POLICY "apparel_cuts_public_read" ON apparel_cuts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "apparel_cuts_service_role_all" ON apparel_cuts;
CREATE POLICY "apparel_cuts_service_role_all" ON apparel_cuts FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS dtf_dimensions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dtf_dimensions_public_read" ON dtf_dimensions;
CREATE POLICY "dtf_dimensions_public_read" ON dtf_dimensions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "dtf_dimensions_service_role_all" ON dtf_dimensions;
CREATE POLICY "dtf_dimensions_service_role_all" ON dtf_dimensions FOR ALL TO service_role USING (true) WITH CHECK (true);

ALTER TABLE IF EXISTS quantity_tier_discounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quantity_tier_discounts_public_read" ON quantity_tier_discounts;
CREATE POLICY "quantity_tier_discounts_public_read" ON quantity_tier_discounts FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "quantity_tier_discounts_service_role_all" ON quantity_tier_discounts;
CREATE POLICY "quantity_tier_discounts_service_role_all" ON quantity_tier_discounts FOR ALL TO service_role USING (true) WITH CHECK (true);


-- 3. JADUAL KANDUNGAN CMS (BACA SAHAJA UNTUK AWAM, CIPTA/PADAM UNTUK SERVICE ROLE)
DO $$
DECLARE
    cms_table text;
    cms_tables text[] := ARRAY[
        'cms_hero_banners', 'cms_services', 'cms_production_videos', 'cms_production_gallery',
        'cms_testimonials', 'cms_slogan_quotes', 'cms_company_settings', 'cms_policies',
        'cms_theme_settings', 'cms_trust_badges'
    ];
BEGIN
    FOREACH cms_table IN ARRAY cms_tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = cms_table) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', cms_table);
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', cms_table || '_public_read', cms_table);
            EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO anon, authenticated USING (true);', cms_table || '_public_read', cms_table);
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I;', cms_table || '_service_all', cms_table);
            EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO service_role USING (true) WITH CHECK (true);', cms_table || '_service_all', cms_table);
        END IF;
    END LOOP;
END $$;
