import fetch from 'node-fetch';

async function checkFileSizes() {
  const urls = [
    'https://solfhbixctrcqthhithr.supabase.co/storage/v1/object/public/cms-assets/hero-banner-1789950835593-vabuh.webp',
    'https://solfhbixctrcqthhithr.supabase.co/storage/v1/object/public/cms-assets/hero-banner-1789950845585-nwsug.webp',
    'https://solfhbixctrcqthhithr.supabase.co/storage/v1/object/public/cms-assets/hero-banner-1789950875389-u355v.webp',
    'https://solfhbixctrcqthhithr.supabase.co/storage/v1/object/public/cms-assets/gallery-1789951944831-np6o7.webp'
  ];

  console.log('--- CHECKING ACTUAL FILE SIZES IN SUPABASE STORAGE ---');
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const buf = await res.arrayBuffer();
        const kb = Math.round(buf.byteLength / 1024);
        console.log(`URL: ${url}`);
        console.log(` -> HTTP ${res.status} | Size: ${kb} KB (${buf.byteLength} bytes)`);
      } else {
        console.log(`URL: ${url}`);
        console.log(` -> HTTP ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      console.log(`URL: ${url}`);
      console.log(` -> Error: ${e.message}`);
    }
  }
}

checkFileSizes();
