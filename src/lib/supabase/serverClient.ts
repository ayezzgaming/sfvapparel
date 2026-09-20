import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://solfhbixctrcqthhithr.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGZoYml4Y3RyY3F0aGhpdGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1NTU2NywiZXhwIjoyMTA1MjMxNTY3fQ.yZhSFQdJvFSRJzSx6VRg5wFvlyCFDUwvJo6Jlflxu-o';
const DEFAULT_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGZoYml4Y3RyY3F0aGhpdGhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NTU1NjcsImV4cCI6MjEwNTIzMTU2N30.auWBL0Q_lkXE3JwswOVPgtSynK9TxBZcR56mC1865Qs';

export function getServiceSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SERVICE_ROLE_KEY || DEFAULT_ANON_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
