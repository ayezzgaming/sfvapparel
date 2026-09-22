import { getCmsDataDb } from '@/app/actions/cmsActions';
import { getDesignsDb } from '@/app/actions/designActions';
import { getMasterPricingDb } from '@/app/actions/pricingActions';
import { 
  INITIAL_CMS_COMPANY_SETTINGS, 
  INITIAL_CMS_SERVICES, 
  INITIAL_QUANTITY_TIERS,
  INITIAL_FABRIC_MATERIALS,
  INITIAL_APPAREL_CUTS,
  INITIAL_DTF_DIMENSIONS,
  INITIAL_DESIGNS,
} from '@/lib/store/seed-data';

export interface SystemFeature {
  name: string;
  urlPath: string;
  description: string;
  userActions: string[];
}

export interface LiveSystemManifest {
  brand: {
    name: string;
    companyRegistration?: string;
    companyOfficialName?: string;
    address: string;
    workingHours: string;
    contactPhone: string;
    websiteUrl: string;
    coverage: string;
  };
  navigationAndFeatures: SystemFeature[];
  orderingWorkflow: string[];
  fabricCatalog: {
    name: string;
    code: string;
    weight: string;
    priceGuide: string;
    description: string;
    isPopular: boolean;
  }[];
  collarAndCuts: {
    name: string;
    code: string;
    addOnPrice: string;
    description: string;
  }[];
  quantityDiscountTiers: {
    tierLabel: string;
    range: string;
    discount: string;
  }[];
  dtfPrintOptions: {
    name: string;
    dimension: string;
    basePrice: string;
  }[];
  activeCatalogSummary: {
    totalDesigns: number;
    categories: string[];
    sampleTitles: string[];
  };
  allDesigns?: {
    id: string;
    code?: string;
    title: string;
    category?: string;
    print_type?: string;
    description?: string;
  }[];
}

/**
 * Dynamically introspects the entire living codebase & database
 * providing the AI with 100% accurate, real-time facts about SFV Apparel.
 */
export async function getLiveSystemManifest(): Promise<LiveSystemManifest> {
  let company: any = INITIAL_CMS_COMPANY_SETTINGS;
  let services = INITIAL_CMS_SERVICES;
  let tiers = INITIAL_QUANTITY_TIERS;
  let fabrics = INITIAL_FABRIC_MATERIALS;
  let cuts = INITIAL_APPAREL_CUTS;
  let dtfOptions = INITIAL_DTF_DIMENSIONS;
  let liveDesigns: any[] = [];

  try {
    const [cmsRes, designsRes, pricingRes] = await Promise.allSettled([
      getCmsDataDb(),
      getDesignsDb(),
      getMasterPricingDb(),
    ]);

    if (cmsRes.status === 'fulfilled' && cmsRes.value.success && cmsRes.value.data) {
      if (cmsRes.value.data.companySettings) company = cmsRes.value.data.companySettings;
      if (cmsRes.value.data.services?.length) services = cmsRes.value.data.services;
    }

    if (designsRes.status === 'fulfilled' && designsRes.value.success && designsRes.value.designs?.length) {
      liveDesigns = designsRes.value.designs;
    }

    if (pricingRes.status === 'fulfilled' && pricingRes.value.success && pricingRes.value.data) {
      if (pricingRes.value.data.tiers?.length) tiers = pricingRes.value.data.tiers;
      if (pricingRes.value.data.fabrics?.length) fabrics = pricingRes.value.data.fabrics;
      if (pricingRes.value.data.cuts?.length) cuts = pricingRes.value.data.cuts;
      if (pricingRes.value.data.dtfDimensions?.length) dtfOptions = pricingRes.value.data.dtfDimensions;
    }
  } catch (err) {
    console.warn('[System Manifest] Falling back to structured baseline data:', err);
  }

  const categoriesSet = new Set<string>();
  liveDesigns.forEach(d => { if (d.category) categoriesSet.add(d.category); });

  return {
    brand: {
      name: company.brand_name || 'SFV APPAREL',
      companyRegistration: company.registration_number || '202303194821 (003492811-M)',
      companyOfficialName: company.company_name || 'SFV Ventures Marketing',
      address: company.address || 'No 28-1, Jalan Prima Saujana 2/D, Taman Prima Saujana, 43000 Kajang, Selangor, Malaysia',
      workingHours: company.working_hours || 'Isnin - Jumaat: 9.00 AM - 6.00 PM | Sabtu: 9.00 AM - 1.00 PM | Ahad & Cuti Umum: Tutup',
      contactPhone: company.phone || '+60 14-859 9138',
      websiteUrl: 'https://sfvapparel.my',
      coverage: 'Penghantaran kurier pantas (Lalamove Klang Valley / PosLaju / J&T Express) ke seluruh Semenanjung Malaysia, Sabah, Sarawak & Singapura',
    },
    navigationAndFeatures: [
      {
        name: 'Laman Utama (Home)',
        urlPath: 'https://sfvapparel.my',
        description: 'Pusat maklumat kilang, galeri hasil produksi cetakan jersi sebenar, senarai fabrik & ulasan pelanggan.',
        userActions: ['Lihat galeri jersi kilang', 'Semak kepakaran cetakan sublimasi & DTF', 'Hubungi WhatsApp'],
      },
      {
        name: 'Koleksi & Katalog Rekaan',
        urlPath: 'https://sfvapparel.my/catalog',
        description: 'Ratusan templat corak jersi sedia ada (Bola Sepak, Futsal, Badminton, E-Sports, Korporat & Sukan Sekolah).',
        userActions: ['Pilih corak jersi sedia ada', 'Lihat perincian corak', 'Dapatkan sebut harga bagi corak yang dipilih'],
      },
      {
        name: 'Semakan Status Tempahan & Invois',
        urlPath: 'https://sfvapparel.my/history',
        description: 'Portal rasmi pelanggan untuk menyemak status pengeluaran kilang (Proof, Cetak, Jahit, QC, Pos) dan memuat turun invois.',
        userActions: ['Masukkan nombor pesanan (#SFV-ORD-XXXX) atau nombor WhatsApp', 'Semak baki bayaran & buat bayaran deposit', 'Semak nombor tracking kurier'],
      },
    ],
    orderingWorkflow: [
      '1. Pemilihan Rekaan: Pelanggan boleh memilih templat corak di https://sfvapparel.my/catalog ATAU kongsikan gambar fail rekaan sendiri terus di WhatsApp (TIADA CAJ REKAAN / FREE DESIGN).',
      '2. Pengisian Maklumat: Pelanggan menyatakan kuantiti anggaran dan senarai nama, nombor serta pecahan saiz (melalui WhatsApp atau borang tempahan).',
      '3. Sebut Harga & Pembayaran: Kilang menyediakan sebut harga rasmi. Pelanggan boleh bayar deposit 50% untuk mula cetak, atau boleh juga buat bayaran penuh 100% terus melalui FPX / Online Banking.',
      '4. Visual Proof & Cetakan: Pasukan grafik kilang menyediakan visual proof mockup (PERCUMA) sebelum proses cetakan sublimasi, jahitan dan kawalan kualiti (QC) dimulakan.',
      '5. Siap (5-7 Hari Bekerja) & Penghantaran: Selepas jersi siap diperiksa QC, pesanan dipos terus ke alamat pelanggan dengan nombor tracking kurier.',
    ],
    fabricCatalog: fabrics.filter(f => f.is_active).map(f => ({
      name: f.name,
      code: f.code,
      weight: `${f.weight_gsm}gsm`,
      priceGuide: `Asas RM${Number(f.sublimation_base_price).toFixed(2)}`,
      description: f.description || 'Fabrik sukan berkualiti tinggi tahan lasak dan cepat kering.',
      isPopular: !!f.is_popular,
    })),
    collarAndCuts: cuts.filter(c => c.is_active).map(c => ({
      name: c.name,
      code: c.code,
      addOnPrice: Number(c.cut_add_on_price) > 0 ? `+RM${Number(c.cut_add_on_price).toFixed(2)}` : 'Percuma / Asas',
      description: c.description || 'Gaya kolar dan potongan jersi sukan.',
    })),
    quantityDiscountTiers: tiers.map(t => ({
      tierLabel: t.tier_label,
      range: `${t.min_qty} - ${t.max_qty ? t.max_qty + ' helai' : 'ke atas'}`,
      discount: `${t.discount_percentage}% Diskaun Kilang`,
    })),
    dtfPrintOptions: dtfOptions.filter(d => d.is_active).map(d => ({
      name: d.name,
      dimension: d.dimensions_desc,
      basePrice: `RM${Number(d.base_price).toFixed(2)}`,
    })),
    activeCatalogSummary: {
      totalDesigns: liveDesigns.length,
      categories: Array.from(categoriesSet).length ? Array.from(categoriesSet) : ['Jersi Sukan', 'Polo', 'Sublimasi'],
      sampleTitles: liveDesigns.slice(0, 8).map(d => d.title),
    },
    allDesigns: liveDesigns.map(d => ({
      id: String(d.id),
      code: d.code || '',
      title: d.title || 'Jersi SFV APPAREL',
      category: d.category || 'Jersi',
      print_type: d.print_type || 'sublimation',
      description: d.description || 'Rekaan cetakan berkualiti tinggi dari kilang SFV APPAREL.'
    }))
  };
}

/**
 * Formats the live system manifest into structured, compact markdown
 * injected automatically into the AI context without hardcoding.
 */
export async function getFormattedSystemContext(): Promise<string> {
  const manifest = await getLiveSystemManifest();

  const fabricsText = manifest.fabricCatalog
    .map(f => `- ${f.name} (${f.weight}): ${f.description} [${f.priceGuide}]`)
    .join('\n');

  const cutsText = manifest.collarAndCuts
    .map(c => `- ${c.name}: ${c.addOnPrice} (${c.description})`)
    .join('\n');

  const tiersText = manifest.quantityDiscountTiers
    .map(t => `- ${t.tierLabel} (${t.range}): Diskaun ${t.discount}`)
    .join('\n');

  const navText = manifest.navigationAndFeatures
    .map(n => `- ${n.name} (${n.urlPath}): ${n.description}`)
    .join('\n');

  const designsList = manifest.allDesigns && manifest.allDesigns.length > 0
    ? manifest.allDesigns
        .map(d => `- *${d.title}* [Kod: ${d.code || d.id}] (${d.category} - ${d.print_type === 'sublimation' ? 'Sublimasi Penuh' : 'DTF'}): ${d.description}`)
        .join('\n')
    : '- Senarai templat rekaan jersi terkini (Polo, Bola Sepak, E-Sports, Badminton) tersedia secara langsung di https://sfvapparel.my/catalog';

  return `
=== MAKLUMAT HIDUP KILANG & SISTEM SFV APPAREL (SUMBER DATA SEBENAR) ===
Jenama: ${manifest.brand.name} (Syarikat Berdaftar: SFV Ventures Marketing - SSM: 202303194821 / 003492811-M)
Alamat Kilang Rasmi: ${manifest.brand.address}
Waktu Operasi: ${manifest.brand.workingHours}
Kawasan Liputan: ${manifest.brand.coverage}
Website Rasmi: ${manifest.brand.websiteUrl}

DASAR OPERASI & JAWAPAN UTAMA KILANG:
1. TEMPOH SIAP PENGELUARAN (LEAD TIME):
   - Pesanan Standard (5 - 500 helai): Siap pantas dalam 5 HINGGA 7 HARI BEKERJA selepas mockup visual proof & bayaran deposit diluluskan.
   - Pukal Besar (>500 helai): 2 hingga 3 minggu (atau jadual berperingkat).
   - Rush Order / Siap Cepat (1-3 hari): Boleh dibincangkan mengikut kekosongan slot mesin produksi kilang semasa. Pelanggan diminta kongsi rekaan & kuantiti untuk staf semak slot ekspres.

2. CAJ REKA BENTUK KUSTOM (CUSTOM DESIGN FEE):
   - PERCUMA 100% / TIADA CAJ TAMBAHAN!
   - Pelanggan boleh pilih ratusan templat sedia ada di katalog ATAU hantar rekaan/gambar/lakaran sendiri terus di WhatsApp. Pereka grafik kilang akan buat visual proof digital secara PERCUMA.

3. MINIMUM ORDER (MOQ):
   - Minimum order sangat rendah iaitu 5 HELAI sahaja untuk jersi kustom & DTF (1 helai sampel pun kilang boleh buat).

4. PILIHAN BAYARAN (DEPOSIT & FULL PAYMENT):
   - Pelanggan BOLEH bayar DEPOSIT 50% untuk mula cetak dan 50% sebelum pos, ATAU boleh juga bayar PENUH 100% terus secara sekaligus melalui FPX / Online Banking di portal https://sfvapparel.my.

5. BUKAN SCAMMER / JAMINAN KUALITI:
   - SFV APPAREL adalah kilang sah beroperasi di Kajang, Selangor. Status tempahan dan invois boleh dijejak secara telus di https://sfvapparel.my/history.
   - Jaminan 1-to-1 QC Replacement jika berlaku kecacatan cetakan atau jahitan dari pihak kilang.

HALAMAN AKTIF SISTEM:
${navText}

PANDUAN LANGKAH SEBENAR MEMBUAT TEMPAHAN DI LAMAN WEB SFV APPAREL:
1. Buka laman https://sfvapparel.my/catalog dan klik mana-mana kad templat corak jersi/baju yang diminati.
2. Pada paparan butiran yang muncul di bahagian bawah skrin, klik butang biru "Isi Borang Tempahan" (atau butang hijau "Diskusi di WhatsApp").
3. Di dalam Borang Tempahan (/customize/[id]), lengkapkan:
   - Pilih Jenis Fabrik & Gaya Kolar/Potongan
   - Masukkan Kuantiti & Pecahan Saiz (Dewasa XS-8XL, Kanak-Kanak, Muslimah)
   - Masukkan Senarai Nama & Nombor Pemain (Roster)
   - Masukkan Poskod & Alamat Penghantaran (Kiraan Pos Semenanjung/Sabah/Sarawak automatik)
4. Semak ringkasan sebut harga dan buat bayaran deposit 50% atau bayaran penuh 100% melalui FPX secara langsung.
5. Selepas bayaran dibuat, status tempahan & invois boleh disemak di https://sfvapparel.my/history.
*PERINGATAN: Di laman web SFV APPAREL TIADA butang 'Add to Cart' atau 'Submit Order'. Jangan gunakan terma tersebut!*

SENARAI TEMPLAT & CORAK REKAAN SEBENAR DARI PANGKALAN DATA SUPABASE:
${designsList}

PILIHAN FABRIK SEBENAR DARI PANGKALAN DATA:
${fabricsText}

PILIHAN KOLAR & POTONGAN:
${cutsText}

TIER KUANTITI & DISKAUN FLEKSIBEL (KILANG MENERIMA DARI SAMPEL 1 HELAI HINGGA PUKAL):
${tiersText}
`.trim();
}
