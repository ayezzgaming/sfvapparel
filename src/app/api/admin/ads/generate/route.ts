import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getServiceSupabase } from '@/lib/supabase/serverClient';
import {
  INITIAL_FABRIC_MATERIALS,
  INITIAL_APPAREL_CUTS,
  INITIAL_QUANTITY_TIERS,
  INITIAL_CMS_COMPANY_SETTINGS,
  INITIAL_DESIGNS,
} from '@/lib/store/seed-data';

interface GenerateAdsRequest {
  prompt: string;
  platform?: string;
  objective?: string;
  productName?: string;
  category?: string;
  apiKey?: string;
}

export interface AiVariation {
  id: string;
  angleName: string;
  tagline: string;
  headline: string;
  secondaryHeadline: string;
  primaryText: string;
  callToAction: string;
  whatsappMessage: string;
  imageUrl?: string;
}

export interface DynamicAdSettings {
  destination: 'whatsapp' | 'instagram' | 'website';
  selectedPageId?: string;
  selectedInstagramAccountId?: string;
  selectedWhatsappNumber?: string;
  selectedPixelId?: string;
  ageMin: number;
  ageMax: number;
  gender: 'all' | 'male' | 'female';
  locationName: string;
  interests: { id?: string; name: string }[];
  engagedShoppers: boolean;
  placementType: 'advantage' | 'feed_reels';
  dailyBudget: number;
  scheduleType: 'peak_hours' | 'all_day';
  durationDays: number;
  aiTargetingReason: string;
}

export interface GenerateAdsResponse {
  success: boolean;
  source: string;
  variations: AiVariation[];
  adSettings: DynamicAdSettings;
}

/**
 * Fetch live connected Meta Accounts, Assets & Active Campaigns from Supabase & Meta Graph API
 */
async function fetchLiveConnectedMetaAssets() {
  let token = process.env.META_ACCESS_TOKEN || '';
  let adAccountId = '';
  let defaultWaNumber = '+60148599138';

  const assets: {
    pages: any[];
    instagramAccounts: any[];
    whatsappNumbers: any[];
    pixels: any[];
    activeAds: any[];
    activeCampaigns: any[];
  } = {
    pages: [
      { id: '101928374829102', name: 'SFV Apparel Official', whatsapp_number: defaultWaNumber, is_default: true }
    ],
    instagramAccounts: [
      { id: '17841405829102938', username: 'sfvapparel.my', name: 'SFV Apparel Malaysia' }
    ],
    whatsappNumbers: [
      { id: 'wa-1', number: defaultWaNumber, label: `SFV Sales & Customer Service (${defaultWaNumber})` }
    ],
    pixels: [
      { id: 'pix-847291048291039', name: 'SFV Apparel Web Pixel', is_active: true }
    ],
    activeAds: [],
    activeCampaigns: [],
  };

  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      const { data } = await supabase
        .from('ad_platform_connections')
        .select('id, access_token, account_id, account_name, is_connected')
        .eq('id', 'facebook')
        .maybeSingle();

      if (data?.access_token) {
        token = data.access_token;
      }
      if (data?.account_id) {
        adAccountId = data.account_id;
      }

      // Also get company settings for default WA
      const compRes = await supabase.from('cms_company_settings').select('whatsapp_number, phone').maybeSingle();
      if (compRes.data?.whatsapp_number || compRes.data?.phone) {
        defaultWaNumber = compRes.data.whatsapp_number || compRes.data.phone || defaultWaNumber;
        assets.whatsappNumbers[0].number = defaultWaNumber;
        assets.whatsappNumbers[0].label = `SFV Rasmi (${defaultWaNumber})`;
      }

      // Fetch saved active campaigns from Supabase database
      const dbCampsRes = await supabase
        .from('ad_campaigns')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (dbCampsRes.data && Array.isArray(dbCampsRes.data)) {
        assets.activeCampaigns = dbCampsRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          status: c.status || 'active',
          platform: c.platform || 'facebook',
          objective: c.objective || 'whatsapp_leads',
          dailyBudget: c.daily_budget || 30,
          headline: c.creative?.headline || '',
          secondaryHeadline: c.creative?.secondaryHeadline || '',
          primaryText: c.creative?.primaryText || '',
          imageUrl: c.creative?.imageUrl || '',
          targetUrl: c.creative?.targetUrl || '',
          callToAction: c.creative?.callToAction || 'Dapatkan Sebut Harga',
        }));
      }
    }

    if (token) {
      // 1. Query Meta Graph API v21.0 for live verified Pages & Linked Instagram Accounts
      const pagesUrl = `https://graph.facebook.com/v21.0/me/accounts?fields=id,name,access_token,whatsapp_number,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(token)}`;
      const pagesRes = await fetch(pagesUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });
      const pagesData = await pagesRes.json();

      if (pagesData.data && Array.isArray(pagesData.data) && pagesData.data.length > 0) {
        assets.pages = [];
        assets.instagramAccounts = [];
        for (const p of pagesData.data) {
          assets.pages.push({
            id: p.id,
            name: p.name,
            whatsapp_number: p.whatsapp_number || defaultWaNumber,
            is_default: assets.pages.length === 0
          });

          if (p.whatsapp_number) {
            assets.whatsappNumbers.push({
              id: `wa-${p.id}`,
              number: p.whatsapp_number,
              label: `${p.name} (${p.whatsapp_number})`
            });
          }

          if (p.instagram_business_account) {
            assets.instagramAccounts.push({
              id: p.instagram_business_account.id,
              username: p.instagram_business_account.username || p.name,
              name: p.instagram_business_account.name || p.name
            });
          }
        }
      }

      // 2. Query Meta Graph API v21.0 for Live Active Ads & Creatives
      if (adAccountId) {
        const cleanActId = adAccountId.replace(/^act[=_:\s-]*/i, '').replace(/[^0-9]/g, '');
        const formattedActId = `act_${cleanActId}`;
        try {
          const adsUrl = `https://graph.facebook.com/v21.0/${formattedActId}/ads?fields=id,name,status,effective_status,creative{id,name,title,body,image_url,thumbnail_url,link_url,call_to_action_type},campaign{id,name,objective,daily_budget}&limit=10&access_token=${encodeURIComponent(token)}`;
          const adsRes = await fetch(adsUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' });
          if (adsRes.ok) {
            const adsJson = await adsRes.json();
            if (Array.isArray(adsJson.data) && adsJson.data.length > 0) {
              const liveMetaAds = adsJson.data.map((a: any) => ({
                id: a.id,
                name: a.name || a.campaign?.name || 'Iklan Meta Aktif',
                status: a.status || a.effective_status || 'ACTIVE',
                campaignName: a.campaign?.name,
                objective: a.campaign?.objective,
                headline: a.creative?.title || a.creative?.name || '',
                primaryText: a.creative?.body || '',
                imageUrl: a.creative?.image_url || a.creative?.thumbnail_url || '',
                callToAction: a.creative?.call_to_action_type || 'LEARN_MORE',
              }));
              assets.activeAds = liveMetaAds;
            }
          }
        } catch (err) {
          console.warn('Could not fetch active ads from Meta Graph API:', err);
        }
      }
    }
  } catch (err) {
    console.warn('Live Meta assets fetch error (fallback used):', err);
  }

  return assets;
}

/**
 * Fetch and construct comprehensive business grounding context from Database & Meta Platforms
 */
async function buildBusinessGroundingContext(selectedProduct?: string, selectedCategory?: string) {
  let company = INITIAL_CMS_COMPANY_SETTINGS;
  let fabrics = INITIAL_FABRIC_MATERIALS;
  let cuts = INITIAL_APPAREL_CUTS;
  let tiers = INITIAL_QUANTITY_TIERS;
  let designs = INITIAL_DESIGNS;

  try {
    const supabase = createClient();
    if (supabase) {
      const [compRes, fabRes, cutsRes, tiersRes, desRes] = await Promise.all([
        supabase.from('cms_company_settings').select('*').single(),
        supabase.from('fabric_materials').select('*').eq('is_active', true),
        supabase.from('apparel_cuts').select('*').eq('is_active', true),
        supabase.from('quantity_tier_discounts').select('*'),
        supabase.from('designs').select('*').eq('is_active', true),
      ]);

      if (compRes.data) company = compRes.data;
      if (fabRes.data && fabRes.data.length > 0) fabrics = fabRes.data;
      if (cutsRes.data && cutsRes.data.length > 0) cuts = cutsRes.data;
      if (tiersRes.data && tiersRes.data.length > 0) tiers = tiersRes.data;
      if (desRes.data && desRes.data.length > 0) designs = desRes.data;
    }
  } catch {
    // Uses seed-data fallback
  }

  // Fetch live Meta platform connections & active campaigns/ads
  const metaAssets = await fetchLiveConnectedMetaAssets();

  const fabricSummaries = fabrics
    .slice(0, 4)
    .map((f) => `- ${f.name} (${f.weight_gsm}gsm, ${f.breathability}): ${f.description || 'Kain sukan berkualiti tinggi'}`)
    .join('\n');

  const cutSummaries = cuts
    .slice(0, 4)
    .map((c) => `- ${c.name}: ${c.description || 'Potongan selesa dan kemas'}`)
    .join('\n');

  const tierSummaries = tiers
    .map((t) => `- ${t.tier_label}: Diskaun ${t.discount_percentage}%`)
    .join('\n');

  const pagesSummaries = metaAssets.pages
    .map((p) => `- Facebook Page: "${p.name}" (Page ID: "${p.id}", WhatsApp Terpaut: "${p.whatsapp_number || company.whatsapp_number || '+60148599138'}")`)
    .join('\n');

  const igSummaries = metaAssets.instagramAccounts
    .map((ig) => `- Instagram Account: "@${ig.username}" (Account ID: "${ig.id}")`)
    .join('\n');

  const waSummaries = metaAssets.whatsappNumbers
    .map((w) => `- WhatsApp Saluran: "${w.number}" (${w.label})`)
    .join('\n');

  const pixelSummaries = metaAssets.pixels
    .map((px) => `- Meta Pixel: "${px.name}" (Pixel ID: "${px.id}")`)
    .join('\n');

  // Active Ads and Campaigns Context
  const activeAdsList = [
    ...metaAssets.activeAds,
    ...metaAssets.activeCampaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      headline: c.headline,
      primaryText: c.primaryText,
      imageUrl: c.imageUrl,
      callToAction: c.callToAction,
    })).filter((c) => c.headline || c.primaryText),
  ];

  const activeAdsSummaries = activeAdsList.length > 0
    ? activeAdsList
        .slice(0, 5)
        .map((ad, idx) => `[Iklan Aktif ${idx + 1}]
- Nama Kempen/Iklan: "${ad.name}"
- Status: ${ad.status || 'ACTIVE'}
- Tajuk Iklan (Headline): "${ad.headline}"
- Teks Copywriting (Primary Text): "${ad.primaryText}"
- Pautan Imej Kreatif: "${ad.imageUrl || ''}"
- Butang Tindakan (CTA): "${ad.callToAction || 'Dapatkan Sebut Harga'}"`)
        .join('\n\n')
    : `- Status Sambungan: Sedia untuk kempen baharu. Tiada iklan aktif terdahulu dikesan dalam pangkalan data. Gunakan inspirasi produk dan kelebihan kilang secara segar.`;

  return {
    groundingText: `
MAKLUMAT PERNIAGAAN & PENGKALAN DATA KILANG:
- Nama Syarikat: ${company.company_name || 'SFV Ventures Marketing'}
- Jenama Rasmi: ${company.brand_name || 'SFV APPAREL'}
- No Pendaftaran: ${company.registration_number || '202303194821 (003492811-M)'}
- Industri: Pembuatan Jersi Sublimasi Penuh, Cetakan DTF & Sulaman Pakaian Kustom Berkualiti Tinggi Malaysia.
- Lokasi & Alamat Operasi: ${company.address || 'Kajang, Selangor, Malaysia'}
- Nombor Khidmat Pelanggan / WhatsApp Rasmi: ${company.phone || company.whatsapp_number || '+60 14-859 9138'}
- Tagline & Misi Jenama: ${company.tagline || 'Pakar pembuatan jersi sublimasi penuh, cetakan DTF & sulaman pakaian kustom berkualiti tinggi di Malaysia.'}

ASET PLATFORM META & SALURAN RASMI YANG SEDANG AKTIF & TERSAMBUNG (PENTING):
${pagesSummaries || '- Facebook Page: SFV Apparel Official'}
${igSummaries || '- Instagram: @sfvapparel.my'}
${waSummaries || '- WhatsApp: +60148599138'}
${pixelSummaries || '- Pixel: SFV Apparel Web Pixel'}

REKOD IKLAN & KEMPEN TERDAHULU DI META / PANGKALAN DATA:
${activeAdsSummaries}

KELEBIHAN TEKNOLOGI KILANG & SPESIFIKASI (USP DARI DATABASE):
1. Cetakan Sublimasi HD Penuh: Dakwat meresap terus ke serat benang, tidak luntur, tidak merekah, warna ultra-tajam.
2. Fabrik Sukan Premium:
${fabricSummaries}
3. Pilihan Potongan & Kolar:
${cutSummaries}
4. Penjimatan Harga Kilang & Diskaun Kuantiti:
${tierSummaries}
5. Jaminan & Servis: Percuma rekaan grafik kustom (nama, nombor, logo pasukan), jaminan siap pantas 7-10 hari bekerja, penghantaran ke seluruh Malaysia.

PRODUK SASARAN KEMPEN SEMASA:
- Nama Produk: ${selectedProduct || 'Jersi Sukan Kustom Sublimasi'}
- Kategori: ${selectedCategory || 'Jersi Sukan'}
`,
    metaAssets,
    activeAdsList,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateAdsRequest = await req.json();
    const {
      prompt,
      platform = 'facebook',
      objective = 'whatsapp_leads',
      productName = 'Jersi Sublimasi Kustom',
      category = 'Jersi Sukan',
      apiKey: userApiKey,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Sila masukkan arahan prompt iklan anda.' }, { status: 400 });
    }

    const cleanPrompt = prompt.trim();
    let rawKey = userApiKey?.trim();

    // 1. If no key sent in request, fetch central AI key from Supabase DB
    if (!rawKey) {
      try {
        const supabase = getServiceSupabase();
        if (supabase) {
          const { data } = await supabase
            .from('ad_platform_connections')
            .select('access_token')
            .eq('id', 'ai_groq')
            .maybeSingle();
          if (data?.access_token && data.access_token.trim()) {
            rawKey = data.access_token.trim();
          }
        }
      } catch {
        // Fallback to env
      }
    }

    // 2. Fallback to process.env variables
    if (!rawKey) {
      rawKey = process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || '';
    }

    if (!rawKey) {
      return NextResponse.json(
        {
          error: 'Kunci API AI (Groq / Gemini / OpenRouter) diperlukan. Sila masukkan kunci API anda.',
        },
        { status: 401 }
      );
    }

    // Build real business grounding & live Meta assets context from database & Meta API
    const { groundingText, metaAssets, activeAdsList } = await buildBusinessGroundingContext(productName, category);

    // 1. Groq Cloud (Llama 3.3 70B / GPT-OSS 120B)
    if (rawKey.startsWith('gsk_')) {
      const groqResult = await callGroqApi(rawKey, {
        prompt: cleanPrompt,
        platform,
        objective,
        productName,
        category,
        dbGroundingContext: groundingText,
        metaAssets,
        activeAdsList,
      });

      if (groqResult.success && groqResult.variations && groqResult.variations.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'groq-llama-3.3-70b',
          variations: groqResult.variations,
          adSettings: groqResult.adSettings,
        });
      } else {
        return NextResponse.json(
          { error: `Ralat panggilan Groq API: ${groqResult.error || 'Gagal memproses respons model.'}` },
          { status: 502 }
        );
      }
    }

    // 2. OpenRouter Cloud
    if (rawKey.startsWith('sk-or-')) {
      const orResult = await callOpenRouterApi(rawKey, {
        prompt: cleanPrompt,
        platform,
        objective,
        productName,
        category,
        dbGroundingContext: groundingText,
        metaAssets,
        activeAdsList,
      });

      if (orResult.success && orResult.variations && orResult.variations.length > 0) {
        return NextResponse.json({
          success: true,
          source: 'openrouter-free',
          variations: orResult.variations,
          adSettings: orResult.adSettings,
        });
      } else {
        return NextResponse.json(
          { error: `Ralat panggilan OpenRouter API: ${orResult.error || 'Gagal memproses respons model.'}` },
          { status: 502 }
        );
      }
    }

    // 3. Google Gemini Cloud
    const geminiResult = await callGeminiApi(rawKey, {
      prompt: cleanPrompt,
      platform,
      objective,
      productName,
      category,
      dbGroundingContext: groundingText,
      metaAssets,
      activeAdsList,
    });

    if (geminiResult.success && geminiResult.variations && geminiResult.variations.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'gemini-cloud',
        variations: geminiResult.variations,
        adSettings: geminiResult.adSettings,
      });
    } else {
      return NextResponse.json(
        { error: `Ralat panggilan Gemini API: ${geminiResult.error || 'Kunci API Gemini tidak sah atau kuota tamat.'}` },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error('Error in ads generation:', error);
    return NextResponse.json({ error: error.message || 'Ralat memproses penjanaan iklan AI' }, { status: 500 });
  }
}

/**
 * System prompt generator with autonomous media buyer intelligence, non-anchored dynamic copywriting diversity, and strict budget isolation
 */
function buildAiPromptInstructions(params: {
  prompt: string;
  platform: string;
  objective: string;
  productName: string;
  category: string;
  dbGroundingContext: string;
  metaAssets?: any;
  activeAdsList?: any[];
}) {
  const defaultPage = params.metaAssets?.pages?.[0]?.id || '101928374829102';
  const defaultWa = params.metaAssets?.whatsappNumbers?.[0]?.number || '+60148599138';
  const defaultIg = params.metaAssets?.instagramAccounts?.[0]?.id || '17841405829102938';
  const defaultPix = params.metaAssets?.pixels?.[0]?.id || 'pix-847291048291039';
  const sampleActiveAd = params.activeAdsList?.[0] || null;

  const systemPrompt = `Anda ialah Ketua Pakar Strategi Media Buyer (Senior Meta Ads Strategist) & Direct-Response Copywriter bertaraf dunia untuk jenama pakaian & kilang jersi sukan Malaysia (SFV APPAREL).
Tugasan anda adalah menjana iklan berkualiti tinggi yang asli, persuasif, dan dinamik berasaskan konteks perniagaan di bawah:

${params.dbGroundingContext}

PANDUAN STRATEGI & PERATURAN MUTLAK PENULISAN:

1. KEPELBAGAIAN KERANGKA COPYWRITING (DILARANG MENGULANG AYAT TEMPLAT SAMA):
   Hasilkan tepat 5 variasi iklan yang berbeza nada dan struktur dengan mengaplikasikan 5 formula psikologi jualan berikut:
   * VARIASI 1 - FORMULA PAS (Problem - Agitate - Solve):
     - Kenalpasti masalah jersi sukan biasa (kain panas melekit, cetakan mudah merekah/luntur, tempahan lambat siap sebelum hari perlawanan).
     - Huraikan kekecewaan pasukan jika jersi bermasalah.
     - Tawarkan penyelesaian muktamad cetakan sublimasi HD kilang SFV APPAREL dengan fabrik Drifit sejuk bernafas.
   * VARIASI 2 - FORMULA AIDA (Attention - Interest - Desire - Action):
     - Tarik perhatian dengan tajuk eksklusif.
     - Bina minat dengan spesifikasi fabrik gred kejohanan & ketajaman warna sublimasi.
     - Bangkitkan keinginan melalui pakej squad pack lengkap percuma rekaan logo, nama dan nombor.
     - Dorong tindakan sebut harga pantas di WhatsApp.
   * VARIASI 3 - FORMULA SOCIAL PROOF & IDENTITI PASUKAN (Squad Pride & E-Sports/Sports Club):
     - Sentuh semangat kejuaraan, imej profesional pasukan, dan keyakinan melangkah masuk ke padang/gelanggang.
     - Fokus kepada sentuhan kustom rekaan 100% unik mengikut identiti kelab anda.
   * VARIASI 4 - FORMULA DIRECT URGENCY & SLOT KILANG (Pantas Siap 7 Hari / FOMO):
     - Tekankan kejohanan atau perlawanan yang semakin dekat.
     - Tawarkan jaminan tempahan siap pantas 7-10 hari bekerja terus dari barisan pengeluaran kilang tanpa orang tengah.
   * VARIASI 5 - FORMULA PUKAL & KORPORAT (B2B Value Proposition & Invois Rasmi):
     - Fokus kepada penjimatan kos pesanan kuantiti berperingkat (diskaun sehingga 25%).
     - Sesuai untuk syarikat, kelab rekreasi, sekolah, dan agensi yang memerlukan invois perniagaan rasmi dan kualiti jahitan tahan lasak.

2. PENGASINGAN KETAT ANTARA BAJET MEDIA BUYER & COPYWRITING PELANGGAN:
   - Nilai bajet harian (contoh: RM10, RM30, "buged 10 perhari") adalah bajet media buyer untuk 'dailyBudget' di dalam 'adSettings'.
   - DILARANG SAMA SEKALI menyebut atau membocorkan perkataan seperti "Hanya RM10 sehari untuk leads", "bajet RM10", atau sebarang angka bajet iklan ke dalam teks promosi copywriting jualan pelanggan!

3. REPLIKASI & ADAPTASI IKLAN AKTIF (APABILA DIMINTA PENGGUNA):
   - Jika pengguna meminta "gunakan iklan yang sama seperti iklan yang aktif saat ini di meta facebook" / "tirukan kempen aktif":
     * Fahami gaya, tema produk, dan nada iklan aktif yang tersenarai dalam pangkalan data di atas.
     * Cipta variasi kreatif segar yang memperluas tema tersebut ke dalam 5 sudut berbeza di atas.
     * Pasangkan pautan 'imageUrl' yang relevan pada variasi.
     * Tetapkan 'dailyBudget' mengikut bajet harian yang diminta pengguna.

4. SIFAR EMOJI & EMOTIKON: Dilarang sama sekali meletakkan sebarang simbol emoji atau emotikon dalam seluruh teks output.

5. FORMAT OUTPUT MESTILAH JSON SAH DENGAN STRUKTUR BERIKUT:
{
  "adSettings": {
    "destination": "whatsapp",
    "selectedPageId": "${defaultPage}",
    "selectedInstagramAccountId": "${defaultIg}",
    "selectedWhatsappNumber": "${defaultWa}",
    "selectedPixelId": "${defaultPix}",
    "ageMin": 18,
    "ageMax": 35,
    "gender": "all",
    "locationName": "Malaysia (Seluruh Negara)",
    "interests": [
      { "name": "Futsal" },
      { "name": "Sports clothing" },
      { "name": "Jersey (clothing)" }
    ],
    "engagedShoppers": true,
    "placementType": "feed_reels",
    "dailyBudget": 30,
    "scheduleType": "peak_hours",
    "durationDays": 7,
    "aiTargetingReason": "Penjelasan ringkas strategi sasaran media buyer"
  },
  "variations": [
    {
      "id": "var-1",
      "angleName": "Nama Sudut Mengikut Formula (cth: Sudut PAS - Solusi Kain Sejuk)",
      "tagline": "Frasa Nilai Tambah Ringkas",
      "headline": "Tajuk Iklan Berimpak Tinggi",
      "secondaryHeadline": "Sub-tajuk Penegasan Nilai",
      "primaryText": "Teks copywriting persuasif penuh yang ditulis secara asli mengikut formula sudut tanpa sebarang emoji",
      "callToAction": "Dapatkan Sebut Harga",
      "whatsappMessage": "Mesej sapaan WhatsApp ringkas dan relevan untuk pelanggan",
      "imageUrl": "${sampleActiveAd?.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'}"
    }
  ]
}`;

  const userContent = `ARAHAN PENGGUNA: "${params.prompt}"
PRODUK SASARAN: ${params.productName} (${params.category})
SALURAN UTAMA: ${params.platform}
OBJEKTIF: ${params.objective}

Tugasan:
1. Hasilkan 5 variasi copywriting yang ASLI, DINAMIK, dan MEMUKAU menggunakan 5 formula berbeza (PAS, AIDA, Squad Pride, Urgency/Slot Kilang, dan Pukal/B2B). Elakkan ayat yang klise atau berulang-ulang.
2. Selaraskan setelan adSettings (termasuk dailyBudget daripada arahan bajet pengguna, umur sasaran, minat Meta, dan saluran Page/WA).
3. Pastikan tiada sebarang kebocoran angka bajet iklan ke dalam teks promosi pelanggan.
4. Outputkan 100% JSON sah tanpa teks pembungkus markdown lain.`;

  return { systemPrompt, userContent };
}

/**
 * Groq Cloud Engine with Deep Database Grounding & High Creativity
 */
async function callGroqApi(
  apiKey: string,
  params: {
    prompt: string;
    platform: string;
    objective: string;
    productName: string;
    category: string;
    dbGroundingContext: string;
    metaAssets?: any;
    activeAdsList?: any[];
  }
): Promise<{ success: boolean; variations?: AiVariation[]; adSettings?: DynamicAdSettings; error?: string }> {
  // Stable Groq models - only include models that reliably support chat completions
  // Note: response_format json_object is NOT used as it causes empty responses on some models
  let candidateModels = [
    'llama-3.3-70b-versatile',
    'llama3-70b-8192',
    'llama-3.1-8b-instant',
    'gemma2-9b-it',
    'mixtral-8x7b-32768',
  ];

  try {
    const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: 'no-store',
    });
    if (modelsRes.ok) {
      const modelsData = await modelsRes.json();
      if (Array.isArray(modelsData?.data) && modelsData.data.length > 0) {
        const liveIds: string[] = modelsData.data.map((m: any) => m.id);
        // Preferred models that are stable and support text output
        const preferred = [
          'llama-3.3-70b-versatile',
          'llama3-70b-8192',
          'llama-3.1-70b-versatile',
          'llama-3.1-8b-instant',
          'gemma2-9b-it',
          'mixtral-8x7b-32768',
        ];
        const matched = preferred.filter((p) => liveIds.includes(p));
        if (matched.length > 0) {
          candidateModels = matched;
        }
      }
    }
  } catch {
    // Use fallback list
  }

  const { systemPrompt, userContent } = buildAiPromptInstructions(params);
  let lastError = '';

  for (const model of candidateModels) {
    try {
      console.log(`[Groq] Trying model: ${model}`);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent },
          ],
          // Do NOT use response_format: json_object — causes empty response on many Groq models
          temperature: 0.8,
          max_tokens: 4096,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error?.message || `HTTP ${res.status}`;
        console.warn(`[Groq] Model ${model} failed: ${msg}`);
        lastError = msg;
        continue;
      }

      const data = await res.json();
      // Some models may return finish_reason='stop' but still have content
      const rawText = data.choices?.[0]?.message?.content ||
                      data.choices?.[0]?.text ||
                      '';

      if (!rawText || rawText.trim().length < 10) {
        console.warn(`[Groq] Model ${model} returned empty/short content, trying next model.`);
        lastError = `Model ${model} memulangkan respons kosong`;
        continue;
      }

      console.log(`[Groq] Model ${model} success, parsing response...`);
      const { variations, adSettings } = parseCleanAiResponse(rawText, params.prompt, params.platform, params.objective, params.metaAssets, params.activeAdsList);
      if (variations && variations.length >= 2) {
        return { success: true, variations, adSettings };
      }
      lastError = `Model ${model}: JSON parsed tetapi kurang 2 variasi`;
    } catch (e: any) {
      lastError = e?.message || 'Ralat sambungan API';
      console.warn(`[Groq] Model ${model} exception:`, lastError);
    }
  }

  return { success: false, error: lastError || 'Gagal menerima respons daripada Groq API' };
}

/**
 * OpenRouter Cloud Engine with Deep Database Grounding & High Creativity
 */
async function callOpenRouterApi(
  apiKey: string,
  params: {
    prompt: string;
    platform: string;
    objective: string;
    productName: string;
    category: string;
    dbGroundingContext: string;
    metaAssets?: any;
    activeAdsList?: any[];
  }
): Promise<{ success: boolean; variations?: AiVariation[]; adSettings?: DynamicAdSettings; error?: string }> {
  const { systemPrompt, userContent } = buildAiPromptInstructions(params);

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.82,
      }),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return { success: false, error: errData.error?.message || `HTTP ${res.status}` };
    }

    const data = await res.json();
    const rawText = data.choices?.[0]?.message?.content;
    if (!rawText) return { success: false, error: 'Respons OpenRouter kosong' };

    const { variations, adSettings } = parseCleanAiResponse(rawText, params.prompt, params.platform, params.objective, params.metaAssets, params.activeAdsList);
    if (variations && variations.length >= 2) {
      return { success: true, variations, adSettings };
    }
    return { success: false, error: 'Struktur JSON tidak sah' };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Ralat sambungan OpenRouter' };
  }
}

/**
 * Google Gemini Cloud Engine with Deep Database Grounding & High Creativity
 */
async function callGeminiApi(
  apiKey: string,
  params: {
    prompt: string;
    platform: string;
    objective: string;
    productName: string;
    category: string;
    dbGroundingContext: string;
    metaAssets?: any;
    activeAdsList?: any[];
  }
): Promise<{ success: boolean; variations?: AiVariation[]; adSettings?: DynamicAdSettings; error?: string }> {
  const candidateModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  const { systemPrompt, userContent } = buildAiPromptInstructions(params);
  let lastError = '';

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\n${userContent}` }],
            },
          ],
          generationConfig: {
            temperature: 0.82,
            responseMimeType: 'application/json',
          },
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson.error?.message || `HTTP ${res.status}`;
        continue;
      }

      const data = await res.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const { variations, adSettings } = parseCleanAiResponse(rawText, params.prompt, params.platform, params.objective, params.metaAssets, params.activeAdsList);
      if (variations && variations.length >= 2) {
        return { success: true, variations, adSettings };
      }
    } catch (e: any) {
      lastError = e?.message || 'Ralat sambungan Gemini';
    }
  }

  return { success: false, error: lastError || 'Kunci Gemini tidak sah atau kuota telah habis' };
}

/**
 * Clean & Sanitize AI JSON response (Direct Semantic Interpretation without rigid regex overriding)
 */
function parseCleanAiResponse(
  raw: string,
  userPrompt: string,
  platform: string,
  objective: string,
  metaAssets?: any,
  activeAdsList?: any[]
): { variations: AiVariation[]; adSettings: DynamicAdSettings } {
  const defaultPage = metaAssets?.pages?.[0]?.id || '101928374829102';
  const defaultWa = metaAssets?.whatsappNumbers?.[0]?.number || '+60148599138';
  const defaultIg = metaAssets?.instagramAccounts?.[0]?.id || '17841405829102938';
  const defaultPix = metaAssets?.pixels?.[0]?.id || 'pix-847291048291039';
  const defaultAdImage = activeAdsList?.[0]?.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80';

  const defaultAdSettings: DynamicAdSettings = {
    destination: objective?.includes('whatsapp') ? 'whatsapp' : platform === 'instagram' ? 'instagram' : 'whatsapp',
    selectedPageId: defaultPage,
    selectedInstagramAccountId: defaultIg,
    selectedWhatsappNumber: defaultWa,
    selectedPixelId: defaultPix,
    ageMin: 18,
    ageMax: 35,
    gender: 'all',
    locationName: 'Malaysia (Seluruh Negara)',
    interests: [
      { id: '6003139266472', name: 'Futsal' },
      { id: '6003384218943', name: 'Jersey (clothing)' },
      { id: '6003102379373', name: 'Sports clothing' },
    ],
    engagedShoppers: true,
    placementType: 'feed_reels',
    dailyBudget: 30,
    scheduleType: 'peak_hours',
    durationDays: 7,
    aiTargetingReason: `Penalaan audiens pintar diselaraskan dengan aset aktif dan objektif kempen.`,
  };

  try {
    // Robust JSON extraction: strip markdown fences, then find the outermost JSON object
    let cleanJson = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // If the model returned prose with embedded JSON, extract the JSON block
    const firstBrace = cleanJson.indexOf('{');
    const lastBrace = cleanJson.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = cleanJson.slice(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(cleanJson);

    let variationsArr: any[] = [];
    let parsedSettings: any = null;

    if (Array.isArray(parsed)) {
      variationsArr = parsed;
    } else if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.variations)) {
        variationsArr = parsed.variations;
      }
      if (parsed.adSettings && typeof parsed.adSettings === 'object') {
        parsedSettings = parsed.adSettings;
      }
    }

    const cleanVariations: AiVariation[] = variationsArr.map((item: any, idx: number) => ({
      id: item.id || `var-${idx + 1}`,
      angleName: cleanNoEmoji(item.angleName || `Sudut Strategi Dinamik ${idx + 1}`),
      tagline: cleanNoEmoji(item.tagline || 'Pilihan Khas'),
      headline: sanitizeCopywritingText(item.headline || 'Kilang Cetak Jersi Sublimasi & DTF'),
      secondaryHeadline: sanitizeCopywritingText(item.secondaryHeadline || 'Kualiti Terjamin Dari SVF APPAREL'),
      primaryText: sanitizeCopywritingText(item.primaryText || ''),
      callToAction: cleanNoEmoji(item.callToAction || 'Dapatkan Sebut Harga'),
      whatsappMessage: sanitizeCopywritingText(item.whatsappMessage || 'Salam SVF, saya berminat untuk tempahan jersi.'),
      imageUrl: item.imageUrl && typeof item.imageUrl === 'string' && item.imageUrl.startsWith('http')
        ? item.imageUrl.trim()
        : defaultAdImage,
    }));

    // Directly respect the AI's semantic budget reasoning
    let finalBudget = 30;
    if (parsedSettings?.dailyBudget !== undefined && parsedSettings?.dailyBudget !== null) {
      const num = Number(parsedSettings.dailyBudget);
      if (!isNaN(num) && num > 0) {
        finalBudget = num;
      }
    }

    const cleanSettings: DynamicAdSettings = {
      destination: parsedSettings?.destination || defaultAdSettings.destination,
      selectedPageId: parsedSettings?.selectedPageId || defaultPage,
      selectedInstagramAccountId: parsedSettings?.selectedInstagramAccountId || defaultIg,
      selectedWhatsappNumber: parsedSettings?.selectedWhatsappNumber || defaultWa,
      selectedPixelId: parsedSettings?.selectedPixelId || defaultPix,
      ageMin: typeof parsedSettings?.ageMin === 'number' && parsedSettings.ageMin >= 13 ? parsedSettings.ageMin : defaultAdSettings.ageMin,
      ageMax: typeof parsedSettings?.ageMax === 'number' && parsedSettings.ageMax <= 65 ? parsedSettings.ageMax : defaultAdSettings.ageMax,
      gender: ['all', 'male', 'female'].includes(parsedSettings?.gender) ? parsedSettings.gender : defaultAdSettings.gender,
      locationName: cleanNoEmoji(parsedSettings?.locationName || defaultAdSettings.locationName),
      interests: Array.isArray(parsedSettings?.interests) && parsedSettings.interests.length > 0
        ? parsedSettings.interests.map((it: any) => ({
            id: it.id || String(Math.floor(Math.random() * 1000000000)),
            name: cleanNoEmoji(typeof it === 'string' ? it : it.name || 'Sukan'),
          }))
        : defaultAdSettings.interests,
      engagedShoppers: parsedSettings?.engagedShoppers !== undefined ? Boolean(parsedSettings.engagedShoppers) : true,
      placementType: parsedSettings?.placementType === 'advantage' ? 'advantage' : 'feed_reels',
      dailyBudget: finalBudget,
      scheduleType: parsedSettings?.scheduleType === 'all_day' ? 'all_day' : 'peak_hours',
      durationDays: typeof parsedSettings?.durationDays === 'number' ? parsedSettings.durationDays : 7,
      aiTargetingReason: cleanNoEmoji(parsedSettings?.aiTargetingReason || `Penalaan audiens pintar diselaraskan dengan aset aktif dan bajet RM${finalBudget}/hari.`),
    };

    return {
      variations: cleanVariations.length >= 2 ? cleanVariations : variationsArr,
      adSettings: cleanSettings,
    };
  } catch {
    return {
      variations: [],
      adSettings: defaultAdSettings,
    };
  }
}

function cleanNoEmoji(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF\u2300-\u23FF\u2B50\uFE0F\u200D]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Dual-Layer Protection: Removes any accidental advertiser media-budget leakage from consumer-facing text
 */
function sanitizeCopywritingText(text: string): string {
  if (!text) return '';
  let cleaned = cleanNoEmoji(text);
  // Remove leaks like "Hanya RM10 sehari untuk leads, " or "RM10 sehari untuk leads"
  cleaned = cleaned.replace(/Hanya\s+RM\.?\s*\d+\s*(sehari|\/hari)?\s*(untuk\s+leads|untuk\s+iklan|untuk\s+ads|ads)[\,\.\s]*/gi, '');
  cleaned = cleaned.replace(/RM\.?\s*\d+\s*(sehari|\/hari)?\s*(untuk\s+leads|untuk\s+iklan|untuk\s+ads|ads)[\,\.\s]*/gi, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
}
