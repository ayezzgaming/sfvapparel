import sharp from 'sharp';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

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

async function optimizeBanners() {
  const { data: banners } = await client.from('cms_hero_banners').select('*');
  if (!banners) return;

  for (const b of banners) {
    if (b.image_url && b.image_url.startsWith('http')) {
      console.log('Downloading & optimizing banner:', b.title, b.image_url);
      const res = await fetch(b.image_url);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      const optimized = await sharp(buffer)
        .resize(900, null, { withoutEnlargement: true })
        .webp({ quality: 80, effort: 6 })
        .toBuffer();

      console.log(`Original: ${(buffer.length/1024).toFixed(1)}KB -> Optimized WebP: ${(optimized.length/1024).toFixed(1)}KB`);

      const filename = `hero-banner-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
      const { data: uploadData, error: uploadErr } = await client.storage
        .from('cms-assets')
        .upload(filename, optimized, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true
        });

      if (!uploadErr) {
        const { data: { publicUrl } } = client.storage.from('cms-assets').getPublicUrl(filename);
        await client.from('cms_hero_banners').update({ image_url: publicUrl }).eq('id', b.id);
        console.log(`Updated banner ${b.id} to ${publicUrl}`);
      } else {
        console.error('Upload error:', uploadErr);
      }
    }
  }

  console.log('All hero banners optimized!');
}

optimizeBanners();
