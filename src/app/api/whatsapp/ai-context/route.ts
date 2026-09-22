import { NextResponse } from 'next/server';
import { 
  INITIAL_CMS_COMPANY_SETTINGS, 
  INITIAL_CMS_POLICIES, 
  INITIAL_CMS_SERVICES, 
  INITIAL_QUANTITY_TIERS,
  INITIAL_FABRIC_MATERIALS,
  INITIAL_APPAREL_CUTS,
  INITIAL_DTF_DIMENSIONS
} from '@/lib/store/seed-data';
import { getFormattedSystemContext, getLiveSystemManifest } from '@/lib/ai/system-manifest';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const manifest = await getLiveSystemManifest();
    const formattedText = await getFormattedSystemContext();

    return NextResponse.json({
      success: true,
      company: manifest.brand,
      designs: manifest.allDesigns || [],
      fabrics: INITIAL_FABRIC_MATERIALS.filter((f) => f.is_active),
      cuts: INITIAL_APPAREL_CUTS.filter((c) => c.is_active),
      pricingTiers: INITIAL_QUANTITY_TIERS,
      dtfOptions: INITIAL_DTF_DIMENSIONS.filter((d) => d.is_active),
      services: INITIAL_CMS_SERVICES.filter((s) => s.is_active),
      policies: INITIAL_CMS_POLICIES,
      webWorkflow: {
        catalogUrl: 'https://sfvapparel.my/catalog',
        step1: 'Buka https://sfvapparel.my/catalog dan klik mana-mana kad rekaan jersi/baju yang diminati.',
        step2: 'Pada paparan butiran rekaan yang muncul di bahagian bawah skrin, klik butang biru "Isi Borang Tempahan" (atau klik butang hijau "Diskusi di WhatsApp").',
        step3: 'Di halaman Borang Tempahan (/customize/[id]), lengkapkan: (a) Pilihan jenis kain & kolar, (b) Pecahan saiz (Dewasa XS-8XL, Kanak-Kanak, Muslimah), (c) Senarai nama & nombor pemain, (d) Poskod & alamat penghantaran.',
        step4: 'Semak ringkasan sebut harga dan buat bayaran deposit 50% melalui FPX secara terus di laman web.',
        step5: 'Status pesanan dan invois rasmi boleh disemak pada bila-bila masa di https://sfvapparel.my/history.'
      },
      systemManifestText: formattedText
    });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Gagal memuatkan konteks AI';
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
