import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://solfhbixctrcqthhithr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGZoYml4Y3RyY3F0aGhpdGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1NTU2NywiZXhwIjoyMTA1MjMxNTY3fQ.yZhSFQdJvFSRJzSx6VRg5wFvlyCFDUwvJo6Jlflxu-o';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function listAllTables() {
  // Test common tables
  const tables = [
    'orders',
    'customers',
    'designs',
    'fabric_materials',
    'apparel_cuts',
    'dtf_dimensions',
    'quantity_tiers',
    'cms_hero_banners',
    'cms_trust_badges',
    'cms_services',
    'cms_production_videos',
    'cms_production_gallery',
    'cms_testimonials',
    'cms_slogan_quote',
    'cms_company_settings',
    'cms_policies',
    'cms_theme_settings',
    'ads_platforms',
    'payment_gateways'
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table ${t}: ERROR ->`, error.message);
    } else {
      console.log(`Table ${t}: OK (rows: ${data.length})`);
    }
  }
}

listAllTables().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
