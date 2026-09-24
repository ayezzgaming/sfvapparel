async function checkSizes() {
  const urls = [
    "https://solfhbixctrcqthhithr.supabase.co/storage/v1/object/public/cms-assets/hero-banner-1789950835503-3u510.jpeg",
    "https://solfhbixctrcqthhithr.supabase.co/storage/v1/object/public/cms-assets/hero-banner-1789950845516-fh9oz.jpeg",
    "https://solfhbixctrcqthhithr.supabase.co/storage/v1/object/public/cms-assets/hero-banner-1789950875313-10r9t.jpeg",
    "https://solfhbixctrcqthhithr.supabase.co/storage/v1/object/public/cms-assets/service-1790002728336-ne2hm.webp",
    "https://solfhbixctrcqthhithr.supabase.co/storage/v1/object/public/cms-assets/service-1790006691896-907c1.webp"
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      const size = res.headers.get('content-length');
      const type = res.headers.get('content-type');
      console.log(url.split('/').pop(), '->', (size / 1024).toFixed(1), 'KB', type);
    } catch (e) {
      console.error(e);
    }
  }
}

checkSizes();
