import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
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

async function optimizeImages() {
  console.log('Optimizing local images with Sharp...');
  
  const imagesDir = path.join(process.cwd(), 'public', 'images');
  const files = [
    { in: 'prod_embroidery.jpg', out: 'prod_embroidery.webp', width: 800, quality: 80 },
    { in: 'prod_merchandise.jpg', out: 'prod_merchandise.webp', width: 800, quality: 80 },
    { in: 'prod_sportswear.jpg', out: 'prod_sportswear.webp', width: 800, quality: 80 },
    { in: 'prod_tshirt.jpg', out: 'prod_tshirt.webp', width: 800, quality: 80 },
  ];

  for (const f of files) {
    const inPath = path.join(imagesDir, f.in);
    const outPath = path.join(imagesDir, f.out);
    if (fs.existsSync(inPath)) {
      await sharp(inPath)
        .resize(f.width, null, { withoutEnlargement: true })
        .webp({ quality: f.quality })
        .toFile(outPath);
      const stats = fs.statSync(outPath);
      console.log(`Optimized ${f.out}: ${(stats.size / 1024).toFixed(1)} KB`);
    }
  }

  // Also compress hero1.webp in public/
  const hero1In = path.join(process.cwd(), 'public', 'hero1.png');
  const hero1Out = path.join(process.cwd(), 'public', 'hero1.webp');
  if (fs.existsSync(hero1In)) {
    await sharp(hero1In)
      .resize(900, null, { withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(hero1Out);
    const stats = fs.statSync(hero1Out);
    console.log(`Optimized hero1.webp: ${(stats.size / 1024).toFixed(1)} KB`);
  }

  // Also update database cms_services image_url if pointing to .jpg
  console.log('Updating cms_services in Supabase to use .webp...');
  const { data: services } = await client.from('cms_services').select('*');
  if (services) {
    for (const s of services) {
      if (s.image_url && s.image_url.endsWith('.jpg')) {
        const newUrl = s.image_url.replace('.jpg', '.webp');
        await client.from('cms_services').update({ image_url: newUrl }).eq('id', s.id);
        console.log(`Updated service ${s.title} to ${newUrl}`);
      }
    }
  }

  console.log('Done optimizing images!');
}

optimizeImages();
