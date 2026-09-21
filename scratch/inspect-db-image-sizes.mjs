import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envLocal = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envLocal.split('\n').forEach((line) => {
  const [k, v] = line.split('=');
  if (k && v) envVars[k.trim()] = v.trim();
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectImages() {
  const { data: banners } = await supabase.from('cms_hero_banners').select('id, title, image_url');
  for (const b of banners || []) {
    console.log('BANNER URL:', b.image_url);
    if (b.image_url?.startsWith('http')) {
      try {
        const res = await fetch(b.image_url);
        const buf = await res.arrayBuffer();
        console.log(` -> Size: ${Math.round(buf.byteLength / 1024)} KB`);
      } catch (e) {
        console.log(' -> fetch error:', e.message);
      }
    }
  }

  const { data: gallery } = await supabase.from('cms_production_gallery').select('id, title, image_url');
  for (const g of gallery || []) {
    console.log('GALLERY URL:', g.image_url);
    if (g.image_url?.startsWith('http')) {
      try {
        const res = await fetch(g.image_url);
        const buf = await res.arrayBuffer();
        console.log(` -> Size: ${Math.round(buf.byteLength / 1024)} KB`);
      } catch (e) {
        console.log(' -> fetch error:', e.message);
      }
    }
  }
}

inspectImages();
