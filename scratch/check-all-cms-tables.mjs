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

async function checkAllTables() {
  const { data: b, error: be } = await supabase.from('cms_hero_banners').select('*');
  const { data: s, error: se } = await supabase.from('cms_services').select('*');
  const { data: v, error: ve } = await supabase.from('cms_production_videos').select('*');
  const { data: g, error: ge } = await supabase.from('cms_production_gallery').select('*');
  const { data: t, error: te } = await supabase.from('cms_testimonials').select('*');

  console.log('cms_hero_banners:', b?.length, be);
  console.log('cms_services:', s?.length, se);
  console.log('cms_production_videos:', v?.length, ve);
  console.log('cms_production_gallery:', g?.length, ge);
  console.log('cms_testimonials:', t?.length, te);
}

checkAllTables();
