import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://solfhbixctrcqthhithr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGZoYml4Y3RyY3F0aGhpdGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1NTU2NywiZXhwIjoyMTA1MjMxNTY3fQ.yZhSFQdJvFSRJzSx6VRg5wFvlyCFDUwvJo6Jlflxu-o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function optimizeLocalImages() {
  console.log('Optimizing local images...');
  
  // 1. Optimize hero1.webp
  const heroPath = path.resolve('public/hero1.webp');
  if (fs.existsSync(heroPath)) {
    const origBuf = fs.readFileSync(heroPath);
    const optimized = await sharp(origBuf)
      .resize({ width: 720, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toBuffer();
    fs.writeFileSync(heroPath, optimized);
    console.log(`Optimized public/hero1.webp: ${origBuf.length} -> ${optimized.length} bytes`);
  }

  // 2. Optimize public/images/*.webp
  const imagesDir = path.resolve('public/images');
  if (fs.existsSync(imagesDir)) {
    const files = fs.readdirSync(imagesDir);
    for (const f of files) {
      if (f.endsWith('.webp')) {
        const fPath = path.join(imagesDir, f);
        const origBuf = fs.readFileSync(fPath);
        const optimized = await sharp(origBuf)
          .resize({ width: 600, withoutEnlargement: true })
          .webp({ quality: 78, effort: 6 })
          .toBuffer();
        fs.writeFileSync(fPath, optimized);
        console.log(`Optimized public/images/${f}: ${origBuf.length} -> ${optimized.length} bytes`);
      }
    }
  }
}

async function optimizeCmsBannersAndServices() {
  console.log('Optimizing CMS Banners & Services...');

  // 1. Fetch hero banners
  const { data: banners, error: bErr } = await supabase
    .from('cms_hero_banners')
    .select('*')
    .order('sort_order', { ascending: true });

  if (bErr) console.error('Error fetching banners:', bErr);
  else {
    for (const banner of banners || []) {
      if (banner.image_url && banner.image_url.startsWith('http')) {
        try {
          const res = await fetch(banner.image_url);
          const arrayBuf = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);
          
          const optBuffer = await sharp(buffer)
            .resize({ width: 640, withoutEnlargement: true })
            .webp({ quality: 78, effort: 6 })
            .toBuffer();

          const fileName = `hero-banner-opt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
          const { error: upErr } = await supabase.storage
            .from('cms-assets')
            .upload(fileName, optBuffer, {
              contentType: 'image/webp',
              cacheControl: '31536000',
              upsert: true
            });

          if (!upErr) {
            const { data: pubUrl } = supabase.storage.from('cms-assets').getPublicUrl(fileName);
            await supabase
              .from('cms_hero_banners')
              .update({ image_url: pubUrl.publicUrl })
              .eq('id', banner.id);
            console.log(`Banner ${banner.title} updated: ${pubUrl.publicUrl} (${optBuffer.length} bytes)`);
          } else {
            console.error('Upload err:', upErr);
          }
        } catch (e) {
          console.error('Banner err:', e.message);
        }
      }
    }
  }

  // 2. Fetch services
  const { data: services, error: sErr } = await supabase
    .from('cms_services')
    .select('*');

  if (sErr) console.error('Error fetching services:', sErr);
  else {
    for (const service of services || []) {
      if (service.image_url && service.image_url.startsWith('http')) {
        try {
          const res = await fetch(service.image_url);
          const arrayBuf = await res.arrayBuffer();
          const buffer = Buffer.from(arrayBuf);

          const optBuffer = await sharp(buffer)
            .resize({ width: 480, withoutEnlargement: true })
            .webp({ quality: 78, effort: 6 })
            .toBuffer();

          const fileName = `service-opt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.webp`;
          const { error: upErr } = await supabase.storage
            .from('cms-assets')
            .upload(fileName, optBuffer, {
              contentType: 'image/webp',
              cacheControl: '31536000',
              upsert: true
            });

          if (!upErr) {
            const { data: pubUrl } = supabase.storage.from('cms-assets').getPublicUrl(fileName);
            await supabase
              .from('cms_services')
              .update({ image_url: pubUrl.publicUrl })
              .eq('id', service.id);
            console.log(`Service ${service.name} updated: ${pubUrl.publicUrl} (${optBuffer.length} bytes)`);
          }
        } catch (e) {
          console.error('Service err:', e.message);
        }
      }
    }
  }
}

async function main() {
  await optimizeLocalImages();
  await optimizeCmsBannersAndServices();
  console.log('Done optimizing banners, services, and local images!');
}

main().catch(console.error);
