import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const supabaseUrl = 'https://solfhbixctrcqthhithr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNvbGZoYml4Y3RyY3F0aGhpdGhyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY1NTU2NywiZXhwIjoyMTA1MjMxNTY3fQ.yZhSFQdJvFSRJzSx6VRg5wFvlyCFDUwvJo6Jlflxu-o';
const supabase = createClient(supabaseUrl, supabaseKey);

const CORRECT_SERVICES = [
  {
    id: '00000000-0000-0000-0002-000000000001',
    category: 'Sublimasi Penuh',
    title: 'Sublimation Printing',
    headline: 'Corak tanpa batasan untuk kelab sukan anda.',
    highlight: 'Kain DryFit • Warna Kekal',
    price_prefix: 'Bermula',
    price_amount: 'RM28',
    price_unit: '/ helai',
    image_url: 'https://solfhbixctrcqthhithr.supabase.co/storage/v1/object/public/cms-assets/service-sublimation-hd.webp',
    href: '/catalog?type=sublimation',
    sort_order: 1,
    is_active: true,
    details: [
      {
        title: 'Ketahanan warna tanpa luntur.',
        description: 'Teknologi cetakan sublimasi haba tinggi menyerap terus ke dalam serat fabrik Microfiber Eyelet. Warna kekal terang, tajam, dan tidak merekah walaupun dibasuh berulang kali.'
      },
      {
        title: 'Kesejukan & pengudaraan optimum.',
        description: 'Fabrik quick-dry berliang mikro direka khas untuk atlet dan sukan lasak. Memastikan penyejukan badan maksimum sepanjang hari.'
      },
      {
        title: 'Kustom sepenuhnya.',
        description: 'Pilihan kolar V-neck, Roundneck, atau Polo dengan cetakan nama dan nombor jersi tanpa had caj tambahan.'
      }
    ]
  },
  {
    id: '00000000-0000-0000-0002-000000000002',
    category: 'Cetakan DTF',
    title: 'Heatpress DTF Printing',
    headline: 'Perincian ultra tajam pada kapas premium.',
    highlight: 'Kapas 100% • Warna Tajam',
    price_prefix: 'Bermula',
    price_amount: 'RM18',
    price_unit: '/ helai',
    image_url: 'https://solfhbixctrcqthhithr.supabase.co/storage/v1/object/public/cms-assets/service-dtf-hd.webp',
    href: '/catalog?type=dtf',
    sort_order: 2,
    is_active: true,
    details: [
      {
        title: 'Hasil cetakan sehalus fotografi.',
        description: 'Menggunakan dakwat DTF gred industri Jepun dengan lapisan serbuk TPU premium, menghasilkan cetakan yang elastik dan lembut disentuh.'
      },
      {
        title: 'Kapas 100% Combed Cotton.',
        description: 'Pilihan baju kapas berkualiti tinggi 190gsm - 220gsm yang selesa, sejuk, dan tahan lasak selepas basuhan.'
      },
      {
        title: 'Tiada had kuantiti minimum.',
        description: 'Sesuai untuk tempahan kumpulan kecil, baju kelas, acara keluarga, mahupun edisi terhad jenama anda.'
      }
    ]
  },
  {
    id: '00000000-0000-0000-0002-000000000003',
    category: 'Cenderamata & Aksesori',
    title: 'Barangan & Aksesori',
    headline: 'Kelengkapan rasmi jenama dan organisasi.',
    highlight: 'Lanyard • Mug • Beg',
    price_prefix: 'Bermula',
    price_amount: 'RM3.50',
    price_unit: '/ unit',
    image_url: '/images/prod_merchandise.webp',
    href: '/catalog?type=merchandise',
    sort_order: 3,
    is_active: true,
    details: [
      {
        title: 'Cenderamata Korporat & Acara.',
        description: 'Pilihan lanyard kustom sublimasi, mug bercetak, medal sukan, dan beg jerut berkualiti.'
      },
      {
        title: 'Kemasan & Warna Tepat.',
        description: 'Hasil cetakan kemas menepati kod warna rasmi jenama atau persatuan anda.'
      }
    ]
  },
  {
    id: '00000000-0000-0000-0002-000000000004',
    category: 'Sulaman Komputer',
    title: 'Sulaman Logo',
    headline: 'Ketelitian jahitan kemas berprofil tinggi.',
    highlight: 'Benang Jepun • Tahan Lasak',
    price_prefix: 'Bermula',
    price_amount: 'RM6',
    price_unit: '/ logo',
    image_url: '/images/prod_embroidery.webp',
    href: '/catalog?type=embroidery',
    sort_order: 4,
    is_active: true,
    details: [
      {
        title: 'Sulaman Berkomputer Padat.',
        description: 'Ketumpatan jahitan tinggi menggunakan benang sulam berkualiti Jepun yang berkilat dan tidak berbulu.'
      },
      {
        title: 'Kemasan Eksklusif & Tahan Lasak.',
        description: 'Sesuai untuk kemeja korporat F1, jaket rasmi, dan topi pasukan.'
      }
    ]
  }
];

async function fixServices() {
  console.log('--- Generating distinct HD WebP images for Sublimation and DTF ---');

  // 1. Sublimation Image: from service-1790006658447-cy3oc.webp or service-1789991561500-w6bwn.webp
  const { data: subData } = await supabase.storage.from('cms-assets').download('service-1790006658447-cy3oc.webp');
  if (subData) {
    const buf = Buffer.from(await subData.arrayBuffer());
    const opt = await sharp(buf).resize({ width: 600, height: 450, fit: 'cover' }).webp({ quality: 85 }).toBuffer();
    await supabase.storage.from('cms-assets').upload('service-sublimation-hd.webp', opt, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true
    });
    console.log('Sublimation HD uploaded:', opt.length, 'bytes');
  }

  // 2. DTF Image: from service-1789991654738-b2pmj.webp or prod_tshirt
  const { data: dtfData } = await supabase.storage.from('cms-assets').download('service-1789991654738-b2pmj.webp');
  if (dtfData) {
    const buf = Buffer.from(await dtfData.arrayBuffer());
    const opt = await sharp(buf).resize({ width: 600, height: 450, fit: 'cover' }).webp({ quality: 85 }).toBuffer();
    await supabase.storage.from('cms-assets').upload('service-dtf-hd.webp', opt, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: true
    });
    console.log('DTF HD uploaded:', opt.length, 'bytes');
  }

  console.log('\n--- Updating cms_services in Supabase ---');
  for (const s of CORRECT_SERVICES) {
    const { error } = await supabase.from('cms_services').upsert(s);
    if (error) console.error(`Error updating ${s.title}:`, error);
    else console.log(`✅ Upserted ${s.title} with full details and correct image.`);
  }

  console.log('\nDone updating services!');
}

fixServices().catch(console.error);
