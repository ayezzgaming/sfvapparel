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

async function test() {
  const { data: before } = await supabase.from('cms_hero_banners').select('*');
  console.log('Before delete:', before.map(b => ({ id: b.id, title: b.title })));

  // Test deleting with hero-2 (seed string) vs UUID
  const idToDelete = 'hero-2';
  const { error: delErr } = await supabase.from('cms_hero_banners').delete().eq('id', idToDelete);
  console.log('Delete with id="hero-2" result error:', delErr);

  const { data: afterLegacy } = await supabase.from('cms_hero_banners').select('*');
  console.log('After delete "hero-2" count:', afterLegacy.length);

  // Now test with toUuid('hero-2')
  const uuid = '00000000-0000-0000-0001-000000000002';
  const { error: delUuidErr } = await supabase.from('cms_hero_banners').delete().eq('id', uuid);
  console.log('Delete with UUID result error:', delUuidErr);

  const { data: afterUuid } = await supabase.from('cms_hero_banners').select('*');
  console.log('After delete UUID count:', afterUuid.length);
}

test();
