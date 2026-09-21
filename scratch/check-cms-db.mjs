import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const envMap = {};
lines.forEach(l => {
  const parts = l.trim().split('=');
  if (parts[0]) envMap[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
});

const url = envMap.NEXT_PUBLIC_SUPABASE_URL || envMap.SUPABASE_URL;
const key = envMap.SUPABASE_SERVICE_ROLE_KEY || envMap.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function main() {
  const { data: banners, error } = await supabase.from('cms_hero_banners').select('*');
  console.log('BANNERS COUNT:', banners?.length);
  console.log('BANNERS DATA:', banners);
}

main();
