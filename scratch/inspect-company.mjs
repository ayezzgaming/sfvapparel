import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://solfhbixctrcqthhithr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGZoYml4Y3RyY3F0aGhpdGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1NTU2NywiZXhwIjoyMTA1MjMxNTY3fQ.yZhSFQdJvFSRJzSx6VRg5wFvlyCFDUwvJo6Jlflxu-o';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function inspectCompanySettings() {
  const { data, error } = await supabase.from('cms_company_settings').select('*');
  console.log('company settings error:', error);
  console.log('company settings data:', data);
}

inspectCompanySettings().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
