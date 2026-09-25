import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://solfhbixctrcqthhithr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGZoYml4Y3RyY3F0aGhpdGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1NTU2NywiZXhwIjoyMTA1MjMxNTY3fQ.yZhSFQdJvFSRJzSx6VRg5wFvlyCFDUwvJo6Jlflxu-o';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('=== RESTORING CRISP HIGH-DEFINITION WEBP ASSETS ===');

  // 1. HERO BANNERS (3 Banners) -> Target 800x450 HD WebP (quality 86)
  const heroSources = [
    { id: 'banner_1', file: 'hero-banner-1789950835503-3u510.jpeg' },
    { id: 'banner_2', file: 'hero-banner-1789950845516-fh9oz.jpeg' },
    { id: 'banner_3', file: 'hero-banner-1789950875313-10r9t.jpeg' }
  ];

  let firstHeroUrl = '';
  for (const h of heroSources) {
    const { data: fileData, error: dlErr } = await supabase.storage.from('cms-assets').download(h.file);
    if (!dlErr && fileData) {
      const buf = Buffer.from(await fileData.arrayBuffer());
      const opt = await sharp(buf)
        .resize({ width: 800, height: 450, fit: 'cover', position: 'center' })
        .webp({ quality: 86, effort: 6 })
        .toBuffer();

      const newFileName = `hero-hd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.webp`;
      const { error: upErr } = await supabase.storage.from('cms-assets').upload(newFileName, opt, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true
      });

      if (!upErr) {
        const { data: pUrl } = supabase.storage.from('cms-assets').getPublicUrl(newFileName);
        await supabase.from('cms_hero_banners').update({ image_url: pUrl.publicUrl }).eq('id', h.id);
        console.log(`Updated Hero ${h.id}: ${opt.length} bytes -> ${pUrl.publicUrl}`);
        if (!firstHeroUrl) firstHeroUrl = pUrl.publicUrl;
      }
    } else {
      console.warn(`Could not download ${h.file}, checking existing record...`);
    }
  }

  // 2. SERVICES -> Target 500x375 HD WebP (quality 84)
  const serviceSources = [
    { id: 'srv_sublimation', file: 'service-1789991561500-w6bwn.webp' },
    { id: 'srv_dtf', file: 'service-1789991654738-b2pmj.webp' }
  ];

  for (const s of serviceSources) {
    const { data: fileData, error: dlErr } = await supabase.storage.from('cms-assets').download(s.file);
    if (!dlErr && fileData) {
      const buf = Buffer.from(await fileData.arrayBuffer());
      const opt = await sharp(buf)
        .resize({ width: 500, height: 375, fit: 'cover', position: 'center' })
        .webp({ quality: 84, effort: 6 })
        .toBuffer();

      const newFileName = `service-hd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.webp`;
      const { error: upErr } = await supabase.storage.from('cms-assets').upload(newFileName, opt, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true
      });

      if (!upErr) {
        const { data: pUrl } = supabase.storage.from('cms-assets').getPublicUrl(newFileName);
        await supabase.from('cms_services').update({ image_url: pUrl.publicUrl }).eq('id', s.id);
        console.log(`Updated Service ${s.id}: ${opt.length} bytes -> ${pUrl.publicUrl}`);
      }
    }
  }

  // 3. PRODUCTION GALLERY (All items) -> Target 640x512 HD WebP (quality 84)
  const { data: galleryItems } = await supabase.from('cms_production_gallery').select('*');
  console.log(`Processing ${galleryItems?.length || 0} gallery items...`);
  
  // List storage files to find matching original if available
  const { data: allStorageFiles } = await supabase.storage.from('cms-assets').list('', { limit: 200 });
  const galleryOriginals = allStorageFiles?.filter(f => f.name.startsWith('gallery-') && !f.name.includes('opt') && !f.name.includes('ultra')) || [];

  for (let i = 0; i < (galleryItems || []).length; i++) {
    const item = galleryItems[i];
    let sourceBuf = null;

    // Check if we have an original file matching or download current
    const origFile = galleryOriginals[i % galleryOriginals.length];
    if (origFile) {
      const { data: fData } = await supabase.storage.from('cms-assets').download(origFile.name);
      if (fData) sourceBuf = Buffer.from(await fData.arrayBuffer());
    }

    if (!sourceBuf && item.image_url?.startsWith('http')) {
      try {
        const res = await fetch(item.image_url);
        sourceBuf = Buffer.from(await res.arrayBuffer());
      } catch (e) {}
    }

    if (sourceBuf) {
      try {
        const opt = await sharp(sourceBuf)
          .resize({ width: 640, height: 512, fit: 'cover', position: 'center' })
          .webp({ quality: 84, effort: 6 })
          .toBuffer();

        const newFileName = `gal-hd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.webp`;
        const { error: upErr } = await supabase.storage.from('cms-assets').upload(newFileName, opt, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true
        });

        if (!upErr) {
          const { data: pUrl } = supabase.storage.from('cms-assets').getPublicUrl(newFileName);
          await supabase.from('cms_production_gallery').update({ image_url: pUrl.publicUrl }).eq('id', item.id);
          console.log(`Updated Gallery ${item.title}: ${opt.length} bytes`);
        }
      } catch (e) {
        console.error(`Error processing gallery ${item.title}:`, e.message);
      }
    }
  }

  // 4. VIDEO THUMBNAILS -> Target 480x800 HD WebP (quality 82)
  const { data: videos } = await supabase.from('cms_production_videos').select('*');
  const videoOriginals = allStorageFiles?.filter(f => f.name.startsWith('video-') && !f.name.includes('opt') && !f.name.includes('ultra')) || [];

  for (let i = 0; i < (videos || []).length; i++) {
    const v = videos[i];
    let sourceBuf = null;
    const origFile = videoOriginals[i % videoOriginals.length];
    if (origFile) {
      const { data: fData } = await supabase.storage.from('cms-assets').download(origFile.name);
      if (fData) sourceBuf = Buffer.from(await fData.arrayBuffer());
    }
    if (!sourceBuf && v.thumbnail_url?.startsWith('http')) {
      try {
        const res = await fetch(v.thumbnail_url);
        sourceBuf = Buffer.from(await res.arrayBuffer());
      } catch (e) {}
    }

    if (sourceBuf) {
      try {
        const opt = await sharp(sourceBuf)
          .resize({ width: 480, height: 800, fit: 'cover', position: 'center' })
          .webp({ quality: 82, effort: 6 })
          .toBuffer();

        const newFileName = `vid-hd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}.webp`;
        const { error: upErr } = await supabase.storage.from('cms-assets').upload(newFileName, opt, {
          contentType: 'image/webp',
          cacheControl: '31536000',
          upsert: true
        });

        if (!upErr) {
          const { data: pUrl } = supabase.storage.from('cms-assets').getPublicUrl(newFileName);
          await supabase.from('cms_production_videos').update({ thumbnail_url: pUrl.publicUrl }).eq('id', v.id);
          console.log(`Updated Video ${v.title}: ${opt.length} bytes`);
        }
      } catch (e) {}
    }
  }

  console.log('\nFINAL PRIMARY HERO BANNER URL FOR PRELOAD:\n', firstHeroUrl);
}

run().catch(console.error);
