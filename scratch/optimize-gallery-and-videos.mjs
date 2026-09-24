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

async function optimizeGalleryAndVideos() {
  console.log('Optimizing Gallery Images...');
  const { data: gallery } = await client.from('cms_production_gallery').select('*');
  if (gallery) {
    for (const item of gallery) {
      if (item.image_url && item.image_url.startsWith('http')) {
        try {
          const res = await fetch(item.image_url);
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Resize to max 480px width for mobile display
          const optimized = await sharp(buffer)
            .resize(480, null, { withoutEnlargement: true })
            .webp({ quality: 75, effort: 6 })
            .toBuffer();

          const filename = `gallery-opt-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
          const { error: uploadErr } = await client.storage
            .from('cms-assets')
            .upload(filename, optimized, {
              contentType: 'image/webp',
              cacheControl: '31536000',
              upsert: true
            });

          if (!uploadErr) {
            const { data: { publicUrl } } = client.storage.from('cms-assets').getPublicUrl(filename);
            await client.from('cms_production_gallery').update({ image_url: publicUrl }).eq('id', item.id);
            console.log(`Gallery ${item.title}: ${(buffer.length/1024).toFixed(0)}KB -> ${(optimized.length/1024).toFixed(0)}KB`);
          }
        } catch (e) {
          console.error(`Error on gallery item ${item.title}:`, e.message);
        }
      }
    }
  }

  console.log('Optimizing Video Thumbnails...');
  const { data: videos } = await client.from('cms_production_videos').select('*');
  if (videos) {
    for (const v of videos) {
      if (v.thumbnail_url && v.thumbnail_url.startsWith('http')) {
        try {
          const res = await fetch(v.thumbnail_url);
          const arrayBuffer = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          const optimized = await sharp(buffer)
            .resize(360, null, { withoutEnlargement: true })
            .webp({ quality: 75, effort: 6 })
            .toBuffer();

          const filename = `video-thumb-opt-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
          const { error: uploadErr } = await client.storage
            .from('cms-assets')
            .upload(filename, optimized, {
              contentType: 'image/webp',
              cacheControl: '31536000',
              upsert: true
            });

          if (!uploadErr) {
            const { data: { publicUrl } } = client.storage.from('cms-assets').getPublicUrl(filename);
            await client.from('cms_production_videos').update({ thumbnail_url: publicUrl }).eq('id', v.id);
            console.log(`Video ${v.title}: ${(buffer.length/1024).toFixed(0)}KB -> ${(optimized.length/1024).toFixed(0)}KB`);
          }
        } catch (e) {
          console.error(`Error on video item ${v.title}:`, e.message);
        }
      }
    }
  }

  console.log('All gallery and videos successfully optimized to high-efficiency WebP with 1-year cache!');
}

optimizeGalleryAndVideos();
