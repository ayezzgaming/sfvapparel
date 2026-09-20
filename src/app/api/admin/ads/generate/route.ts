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
      headline: c.headline || 'Dapatkan Jersi Sublimasi Kustom',
      primaryText: c.primaryText || 'Pakar pembuatan jersi sukan berkualiti tinggi dengan cetakan sublimasi HD.',
      imageUrl: c.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
      callToAction: c.callToAction || 'Dapatkan Sebut Harga',
    })),
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
    : `[Iklan Lalai Aktif Semasa di Facebook & IG]
- Nama Kempen: "Jersey Printing Sublimation - Kempen Utama"
- Status: ACTIVE
- Tajuk Iklan (Headline): "Dapatkan Jersi Sublimasi Kustom Kualiti HD"
- Teks Copywriting (Primary Text): "Tempah jersi sukan berkualiti tinggi dengan cetakan sublimasi HD yang tidak luntur dan kain Drifit sejuk. Percuma rekaan grafik logo, nama dan nombor pasukan. Hubungi kami melalui WhatsApp untuk sebut harga segera."
- Pautan Imej Kreatif: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80"
- Butang Tindakan (CTA): "Dapatkan Sebut Harga"`;

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
${pagesSummaries || '- Tiada Page tambahan (Gunakan lalai SFV Apparel Official)'}
${igSummaries || '- Instagram: @sfvapparel.my'}
${waSummaries || '- WhatsApp: +60148599138'}
${pixelSummaries || '- Pixel: SFV Apparel Web Pixel'}

IKLAN & KEMPEN AKTIF SEMASA DI META FACEBOOK (LIVE REAL AD DATA):
${activeAdsSummaries}

KELEBIHAN TEKNOLOGI KILANG & SPESIFIKASI (USP DARI DATABASE):
1. Cetakan Sublimasi HD Penuh: Dakwat meresap terus ke serat benang, tidak luntur, tidak merekah, warna ultra-tajam.
2. Fabrik Sukan Premium (Database):
${fabricSummaries}
3. Pilihan Potongan & Kolar (Database):
${cutSummaries}
4. Penjimatan Harga Kilang & Diskaun Kuantiti (Database):
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
 * System prompt generator with autonomous media buyer intelligence, active Meta ads cloning, and strict budget leakage prevention
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

  const systemPrompt = `Anda ialah Ketua Pakar Media Buyer (Senior Meta Ads Strategist) dan Direct-Response Copywriter berautonomi untuk jenama pakaian & kilang jersi sukan Malaysia (SFV APPAREL).
Gunakan maklumat pangkalan data kilang, data aset platform Meta, dan data iklan aktif di bawah untuk menghasilkan kempen pengiklanan yang paling berkesan dan menguntungkan:

${params.dbGroundingContext}

PANDUAN PENAAKULAN KONTEKSTUAL & PERATURAN MUTLAK AI:

1. PERATURAN KRITIKAL: PENGASINGAN KETAT ANTARA BAJET MEDIA BUYER & COPYWRITING JUALAN (DILARANG BOCOR BAJET):
   - Nilai bajet harian (contoh: RM10 sehari, RM 10, RM30, "buged 10 perhari", "modal 10 ringgit") adalah BAJET KOS PENGIKLANAN MEDIA BUYER di Meta Ads Manager. Nilai ini HANYA untuk medan 'dailyBudget' di dalam objek 'adSettings'.
   - DILARANG SAMA SEKALI / STRICTLY FORBIDDEN meletakkan ayat seperti "Hanya RM10 sehari untuk leads", "modal RM10 sehari", "bajet RM10" atau sebarang angka bajet ads ke dalam teks copywriting jualan (primaryText, headline, secondaryHeadline, tagline, whatsappMessage)!
   - Pelanggan dan pembeli jersi membaca iklan untuk membeli JERSI SUKAN, CETAKAN SUBLIMASI HD, PAKET PASUKAN (SQUAD PACK), KAIN DRIFIT, REKAAN PERCUMA, DAN DISKAUN PUKAL KILANG. Mereka BUKAN membeli leads atau kos pengiklanan RM10!
   - Teks copywriting mestilah 100% fokus kepada nilai produk jersi, kelebihan cetakan sublimasi HD kilang, fabrik sukan sejuk, pakej jersi pasukan, dan pautan WhatsApp sebut harga.

2. REPLIKASI & ADAPTASI IKLAN AKTIF DI META (APABILA DIMINTA USER):
   - Jika arahan pengguna menyatakan "gunakan iklan yang sama seperti iklan yang aktif saat ini di meta facebook", "tirukan ads aktif", "guna iklan aktif", atau seumpamanya:
     * Rujuk bahagian 'IKLAN & KEMPEN AKTIF SEMASA DI META FACEBOOK' di atas.
     * Ambil tema produk, gaya headline, dan struktur teks copywriting daripada iklan aktif tersebut.
     * Gandakan formula iklan aktif tersebut kepada 5 variasi sudut berbeza (contoh: Sudut Replikasi Kempen Utama, Sudut Squad Pack Pasukan, Sudut Sublimasi HD Terus Kilang, Sudut Siap Pantas 7 Hari, Sudut Diskaun Kuantiti Pukal).
     * Sertakan pautan imej kreatif iklan aktif tersebut ke dalam medan 'imageUrl' pada setiap variasi.
     * Tetapkan 'dailyBudget' mengikut bajet yang diminta oleh pengguna (contoh: 10 jika pengguna minta bajet 10).

3. PEMAHAMAN BAJET SEMANTIK PENUH:
   - Fahami arahan bajet pengguna daripada teks prompt tanpa mengira cara ejaan (contoh: "buged 10 perhari" -> 10, "RM.10" -> 10, "bajet RM15" -> 15, "spend 50 per day" -> 50).
   - Isikan nilai nombor bulat pada medan 'dailyBudget'. Jika tiada bajet dinyatakan, gunakan nilai optimum 30.

4. PENYELARASAN ASET PLATFORM META YANG TEPAT (SALURAN & AKAUN):
   - selectedPageId: ID Facebook Page aktif (cth: "${defaultPage}").
   - selectedInstagramAccountId: ID Akaun Instagram terpaut (cth: "${defaultIg}").
   - selectedWhatsappNumber: Nombor WhatsApp aktif rasmi (cth: "${defaultWa}").
   - selectedPixelId: ID Meta Pixel aktif (cth: "${defaultPix}").
   - destination: 'whatsapp' (untuk leads sebut harga WhatsApp), 'instagram', atau 'website'.

5. PENALAAN SASARAN & MINAT PINTAR (SMART TARGETING):
   - ageMin (18) & ageMax (35-45) bersesuaian dengan peminat sukan & tempahan pasukan.
   - locationName: "Malaysia (Seluruh Negara)".
   - interests: 3-5 minat Meta Ads rasmi yang relevan (seperti Futsal, Sports clothing, Jersey (clothing), Association football, dsb).
   - engagedShoppers: true (tingkatkan conversion pembeli aktif).
   - placementType: 'feed_reels' (FB & IG Feed, Stories, Reels).
   - scheduleType: 'peak_hours' atau 'all_day'.
   - aiTargetingReason: Penjelasan strategi media buyer (1-2 ayat) mengapa aset dan sasaran ini dipilih.

6. SIFAR EMOJI & EMOTIKON: Dilarang sama sekali meletakkan sebarang simbol emoji atau emotikon dalam seluruh output.

7. FORMATKAN OUTPUT HANYA DALAM JSON SAH TANPA MARKDOWN LAIN:
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
    "dailyBudget": 10,
    "scheduleType": "peak_hours",
    "durationDays": 7,
    "aiTargetingReason": "Strategi kempen diselaraskan mengikut bajet harian RM10 dan aset Meta yang aktif."
  },
  "variations": [
    {
      "id": "var-1",
      "angleName": "Sudut Replikasi Kempen Utama",
      "tagline": "Cetakan Sublimasi HD Tidak Luntur",
      "headline": "Dapatkan Jersi Sublimasi Kustom Kualiti HD",
      "secondaryHeadline": "Pakej Squad Pasukan | Percuma Rekaan Grafik",
      "primaryText": "Jangan lepaskan peluang untuk memesan jersi sukan berkualiti tinggi dengan cetakan sublimasi HD yang tidak luntur dan fabrik Drifit yang sejuk. Dapatkan tawaran squad pack bersama rekaan logo, nama dan nombor pasukan percuma. Hubungi kami melalui WhatsApp untuk sebut harga segera.",
      "callToAction": "Dapatkan Sebut Harga",
      "whatsappMessage": "Salam SFV APPAREL, saya berminat untuk membuat tempahan jersi kustom sublimasi untuk pasukan kami.",
      "imageUrl": "${sampleActiveAd?.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80'}"
    }
  ]
}`;

  const userContent = `ARAHAN PENGGUNA: "${params.prompt}"
PRODUK: ${params.productName} (${params.category})
PLATFORM: ${params.platform}
OBJEKTIF: ${params.objective}
Tugasan Media Buyer: Laksanakan penaakulan pintar. Jika pengguna minta tiru/gunakan iklan aktif di Meta, ambil konteks iklan aktif tersebut. Ekstrak bajet pengguna secara tepat ke adSettings.dailyBudget. DILARANG SAMA SEKALI memasukkan angka bajet harian media buyer (cth: RM10) ke dalam ayat copywriting jualan pelanggan. Hasilkan 5 variasi mantap bersama adSettings lengkap dalam format JSON tanpa sebarang emoji.`;

  return { systemPrompt, userContent };
}

/**
 * Groq Cloud Engine with Deep Database Grounding
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
  const candidateModels = [
    'llama-3.3-70b-versatile',
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b',
    'llama-3.1-8b-instant',
  ];

  const { systemPrompt, userContent } = buildAiPromptInstructions(params);
  let lastError = '';

  for (const model of candidateModels) {
    try {
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
          temperature: 0.7,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        lastError = errJson.error?.message || `HTTP ${res.status}`;
        continue;
      }

      const data = await res.json();
      const rawText = data.choices?.[0]?.message?.content;
      if (!rawText) continue;

      const { variations, adSettings } = parseCleanAiResponse(rawText, params.prompt, params.platform, params.objective, params.metaAssets, params.activeAdsList);
      if (variations && variations.length >= 2) {
        return { success: true, variations, adSettings };
      }
    } catch (e: any) {
      lastError = e?.message || 'Ralat sambungan API';
    }
  }

  return { success: false, error: lastError || 'Gagal menerima respons daripada Groq API' };
}

/**
 * OpenRouter Cloud Engine with Deep Database Grounding
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
        temperature: 0.7,
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
 * Google Gemini Cloud Engine with Deep Database Grounding
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
            temperature: 0.7,
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
    const cleanJson = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
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
