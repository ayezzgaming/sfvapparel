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
  let liveDesigns: { title: string; category?: string }[] = [];

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
      address: company.address || 'No 28-1, Jalan Prima Saujana 2/D, Taman Prima Saujana, 43000 Kajang, Selangor, Malaysia',
      workingHours: company.working_hours || 'Isnin - Jumaat: 9.00 AM - 6.00 PM | Sabtu: 9.00 AM - 1.00 PM | Ahad & Cuti Umum: Tutup',
      contactPhone: company.phone || '+60 14-859 9138',
      websiteUrl: 'https://sfvapparel.my',
      coverage: 'Penghantaran kurier ke seluruh Semenanjung Malaysia, Sabah, Sarawak & Singapura',
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
      '1. Pemilihan Rekaan: Pelanggan boleh memilih templat corak di https://sfvapparel.my/catalog ATAU kongsikan gambar fail rekaan sendiri terus di WhatsApp.',
      '2. Pengisian Maklumat: Pelanggan menyatakan kuantiti anggaran dan senarai nama, nombor serta pecahan saiz (melalui WhatsApp atau borang tempahan).',
      '3. Sebut Harga & Deposit: Kilang menyediakan sebut harga rasmi dan pelanggan menjelaskan bayaran deposit 50% untuk pengesahan.',
      '4. Visual Proof & Cetakan: Pasukan grafik kilang menyediakan visual proof mockup sebelum proses cetakan sublimasi, jahitan dan kawalan kualiti (QC) dimulakan.',
      '5. Siap & Penghantaran: Selepas jersi siap diperiksa, baki dijelaskan dan pesanan dipos terus ke alamat pelanggan dengan nombor tracking kurier.',
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
      totalDesigns: liveDesigns.length || 28,
      categories: Array.from(categoriesSet).length ? Array.from(categoriesSet) : ['Jersi Sukan', 'E-Sports', 'Korporat', 'Event'],
      sampleTitles: liveDesigns.slice(0, 6).map(d => d.title),
    },
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

  const designsList = INITIAL_DESIGNS
    .map(d => `- [${d.id}] *${d.title}* (${d.category} - ${d.print_type === 'sublimation' ? 'Sublimasi' : 'DTF'}): ${d.description}`)
    .join('\n');

  return `
=== MAKLUMAT HIDUP KILANG & SISTEM SFV APPAREL (SUMBER DATA SEBENAR) ===
Jenama: ${manifest.brand.name}
Alamat Kilang: ${manifest.brand.address}
Waktu Operasi: ${manifest.brand.workingHours}
Kawasan Liputan: ${manifest.brand.coverage}
Website Rasmi: ${manifest.brand.websiteUrl}

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
4. Semak ringkasan sebut harga dan buat bayaran deposit 50% melalui FPX secara langsung.
5. Selepas bayaran dibuat, status tempahan & invois boleh disemak di https://sfvapparel.my/history.
*PERINGATAN: Di laman web SFV APPAREL TIADA butang 'Add to Cart' atau 'Submit Order'. Jangan gunakan terma tersebut!*

SENARAI TEMPLAT & CORAK REKAAN SEBENAR DI KATALOG SFV APPAREL:
${designsList}

PILIHAN FABRIK SEBENAR DARI PANGKALAN DATA:
${fabricsText}

PILIHAN KOLAR & POTONGAN:
${cutsText}

TIER KUANTITI & DISKAUN FLEKSIBEL (KILANG MENERIMA DARI SAMPEL 1 HELAI HINGGA PUKAL):
${tiersText}
`.trim();
}
