import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://solfhbixctrcqthhithr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGZoYml4Y3RyY3F0aGhpdGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1NTU2NywiZXhwIjoyMTA1MjMxNTY3fQ.yZhSFQdJvFSRJzSx6VRg5wFvlyCFDUwvJo6Jlflxu-o';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testSql() {
  const sql = `
    CREATE TABLE IF NOT EXISTS payment_gateways (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      provider TEXT NOT NULL DEFAULT 'chip',
      brand_id TEXT,
      api_key TEXT,
      public_key TEXT,
      is_active BOOLEAN DEFAULT false,
      is_sandbox BOOLEAN DEFAULT true,
      webhook_url TEXT,
      payment_methods JSONB DEFAULT '["fpx", "card", "duitnow_qr", "ewallet"]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Try RPC if available
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  console.log('rpc exec_sql result:', { data, error });
}

testSql().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
