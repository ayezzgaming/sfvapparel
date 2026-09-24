import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const idx = line.indexOf('=');
  if (idx > 0) {
    const k = line.substring(0, idx).trim();
    const v = line.substring(idx + 1).trim().replace(/(^['"]|['"]$)/g, '');
    env[k] = v;
  }
});

const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: banners } = await client.from('cms_hero_banners').select('*');
  console.log('BANNERS:', JSON.stringify(banners, null, 2));

  const { data: services } = await client.from('cms_services').select('*');
  console.log('SERVICES:', JSON.stringify(services, null, 2));

  const { data: gallery } = await client.from('cms_production_gallery').select('*');
  console.log('GALLERY COUNT:', gallery?.length);
  console.log('GALLERY SAMPLES:', JSON.stringify(gallery?.slice(0, 5), null, 2));
}

check();
