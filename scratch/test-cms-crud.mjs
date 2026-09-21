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

async function testCrud() {
  console.log('--- 1. CURRENT BANNERS IN DB ---');
  let { data: b1 } = await supabase.from('cms_hero_banners').select('*');
  console.log('Count:', b1?.length, b1?.map(b => ({ id: b.id, title: b.title })));

  // Test insert new banner
  const newId = crypto.randomUUID();
  console.log('--- 2. INSERTING NEW BANNER ---', newId);
  const { error: insErr } = await supabase.from('cms_hero_banners').insert({
    id: newId,
    title: 'Test Banner Audit',
    image_url: '/hero1.png',
    status_pill: 'Ujian Audit',
    tag_text: 'Audit Tag',
    button_text: 'Lihat',
    button_link: '/catalog',
    sort_order: 99,
    is_active: true
  });
  console.log('Insert error:', insErr);

  let { data: b2 } = await supabase.from('cms_hero_banners').select('*');
  console.log('Count after insert:', b2?.length);

  // Test delete that banner
  console.log('--- 3. DELETING THE NEW BANNER ---', newId);
  const { error: delErr } = await supabase.from('cms_hero_banners').delete().eq('id', newId);
  console.log('Delete error:', delErr);

  let { data: b3 } = await supabase.from('cms_hero_banners').select('*');
  console.log('Count after delete (should be same as step 1):', b3?.length);
  console.log('Remaining banners in DB:', b3?.map(b => ({ id: b.id, title: b.title })));
}

testCrud();
