import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://solfhbixctrcqthhithr.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGZoYml4Y3RyY3F0aGhpdGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1NTU2NywiZXhwIjoyMTA1MjMxNTY3fQ.yZhSFQdJvFSRJzSx6VRg5wFvlyCFDUwvJo6Jlflxu-o';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function check() {
  console.log('Testing payment_gateways table...');
  const { data, error } = await supabase.from('payment_gateways').select('*').limit(1);
  if (error) {
    console.log('payment_gateways error:', error.message, error.code);
  } else {
    console.log('payment_gateways exists! rows:', data);
  }

  console.log('Testing orders columns...');
  const { data: orders, error: oError } = await supabase.from('orders').select('*').limit(1);
  if (oError) {
    console.log('orders error:', oError.message);
  } else if (orders && orders[0]) {
    console.log('Order sample keys:', Object.keys(orders[0]));
  }
}

check().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
