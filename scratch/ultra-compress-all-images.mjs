import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://solfhbixctrcqthhithr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGZoYml4Y3RyY3F0aGhpdGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1NTU2NywiZXhwIjoyMTA1MjMxNTY3fQ.yZhSFQdJvFSRJzSx6VRg5wFvlyCFDUwvJo6Jlflxu-o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function optimizeAll() {
  console.log('--- 1. Optimizing Local Public Images ---');
  const imgDir = path.resolve('public/images');
  if (fs.existsSync(imgDir)) {
    for (const f of fs.readdirSync(imgDir)) {
      if (f.endsWith('.webp')) {
        const p = path.join(imgDir, f);
        const orig = fs.readFileSync(p);
        const opt = await sharp(orig)
          .resize({ width: 280, withoutEnlargement: true })
          .webp({ quality: 68, effort: 6 })
          .toBuffer();
        fs.writeFileSync(p, opt);
        console.log(`Local ${f}: ${orig.length} -> ${opt.length} bytes`);
      }
    }
  }

  console.log('\n--- 2. Optimizing Supabase Hero Banners ---');
  const { data: banners } = await supabase.from('cms_hero_banners').select('*').order('sort_order');
  let firstBannerUrl = '';
  for (const b of banners || []) {
    if (b.image_url?.startsWith('http')) {
      try {
        const res = await fetch(b.image_url);
        const buf = Buffer.from(await res.arrayBuffer());
        const opt = await sharp(buf)
          .resize({ width: 480, height: 270, fit: 'cover' })
          .webp({ quality: 72, effort: 6 })
          .toBuffer();

        const fName = `hero-ultra-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
        const { error: upErr } = await supabase.storage.from('cms-assets').upload(fName, opt, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true
        });

        if (!upErr) {
          const { data: pUrl } = supabase.storage.from('cms-assets').getPublicUrl(fName);
          await supabase.from('cms_hero_banners').update({ image_url: pUrl.publicUrl }).eq('id', b.id);
          console.log(`Hero Banner ${b.title}: ${opt.length} bytes -> ${pUrl.publicUrl}`);
          if (!firstBannerUrl) firstBannerUrl = pUrl.publicUrl;
        }
      } catch (e) {
        console.error('Banner err:', e.message);
      }
    }
  }

  console.log('\n--- 3. Optimizing Supabase Services ---');
  const { data: services } = await supabase.from('cms_services').select('*');
  for (const s of services || []) {
    if (s.image_url?.startsWith('http')) {
      try {
        const res = await fetch(s.image_url);
        const buf = Buffer.from(await res.arrayBuffer());
        const opt = await sharp(buf)
          .resize({ width: 280, height: 210, fit: 'cover' })
          .webp({ quality: 68, effort: 6 })
          .toBuffer();

        const fName = `service-ultra-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
        const { error: upErr } = await supabase.storage.from('cms-assets').upload(fName, opt, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true
        });

        if (!upErr) {
          const { data: pUrl } = supabase.storage.from('cms-assets').getPublicUrl(fName);
          await supabase.from('cms_services').update({ image_url: pUrl.publicUrl }).eq('id', s.id);
          console.log(`Service ${s.title}: ${opt.length} bytes -> ${pUrl.publicUrl}`);
        }
      } catch (e) {
        console.error('Service err:', e.message);
      }
    }
  }

  console.log('\n--- 4. Optimizing Supabase Production Gallery ---');
  const { data: gallery } = await supabase.from('cms_production_gallery').select('*');
  for (const g of gallery || []) {
    if (g.image_url?.startsWith('http')) {
      try {
        const res = await fetch(g.image_url);
        const buf = Buffer.from(await res.arrayBuffer());
        const opt = await sharp(buf)
          .resize({ width: 320, height: 256, fit: 'cover' })
          .webp({ quality: 68, effort: 6 })
          .toBuffer();

        const fName = `gal-ultra-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
        const { error: upErr } = await supabase.storage.from('cms-assets').upload(fName, opt, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true
        });

        if (!upErr) {
          const { data: pUrl } = supabase.storage.from('cms-assets').getPublicUrl(fName);
          await supabase.from('cms_production_gallery').update({ image_url: pUrl.publicUrl }).eq('id', g.id);
          console.log(`Gallery ${g.title}: ${opt.length} bytes`);
        }
      } catch (e) {
        console.error('Gal err:', e.message);
      }
    }
  }

  console.log('\n--- 5. Optimizing Supabase Video Thumbs ---');
  const { data: videos } = await supabase.from('cms_production_videos').select('*');
  for (const v of videos || []) {
    if (v.thumbnail_url?.startsWith('http')) {
      try {
        const res = await fetch(v.thumbnail_url);
        const buf = Buffer.from(await res.arrayBuffer());
        const opt = await sharp(buf)
          .resize({ width: 270, height: 450, fit: 'cover' })
          .webp({ quality: 68, effort: 6 })
          .toBuffer();

        const fName = `vid-ultra-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.webp`;
        const { error: upErr } = await supabase.storage.from('cms-assets').upload(fName, opt, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true
        });

        if (!upErr) {
          const { data: pUrl } = supabase.storage.from('cms-assets').getPublicUrl(fName);
          await supabase.from('cms_production_videos').update({ thumbnail_url: pUrl.publicUrl }).eq('id', v.id);
          console.log(`Video ${v.title}: ${opt.length} bytes`);
        }
      } catch (e) {
        console.error('Vid err:', e.message);
      }
    }
  }

  console.log('\nFIRST BANNER URL FOR PRELOAD:', firstBannerUrl);
}

optimizeAll().catch(console.error);
