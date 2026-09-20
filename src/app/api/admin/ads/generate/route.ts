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
 * Fetch live connected Meta Accounts & Assets (Pages, WhatsApp, Instagram, Pixels) from Supabase & Meta Graph API
 */
async function fetchLiveConnectedMetaAssets() {
  let token = process.env.META_ACCESS_TOKEN || '';
  let adAccountId = '';
  let defaultWaNumber = '+60148599138';

  const assets = {
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
    ]
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
    }

    if (token) {
      // Query Meta Graph API v21.0 for live verified Pages & Linked Instagram Accounts
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

  // Fetch live Meta platform connections
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

    // Build real business grounding & live Meta assets context from database
    const { groundingText, metaAssets } = await buildBusinessGroundingContext(productName, category);

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
 * System prompt generator with autonomous media buyer intelligence and live asset grounding
 */
function buildAiPromptInstructions(params: {
  prompt: string;
  platform: string;
  objective: string;
  productName: string;
  category: string;
  dbGroundingContext: string;
  metaAssets?: any;
}) {
  const defaultPage = params.metaAssets?.pages?.[0]?.id || '101928374829102';
  const defaultWa = params.metaAssets?.whatsappNumbers?.[0]?.number || '+60148599138';
  const defaultIg = params.metaAssets?.instagramAccounts?.[0]?.id || '17841405829102938';
  const defaultPix = params.metaAssets?.pixels?.[0]?.id || 'pix-847291048291039';

  const systemPrompt = `Anda ialah Ketua Pakar Media Buyer (Senior Meta Ads Strategist) dan Direct-Response Copywriter berautonomi untuk jenama pakaian & kilang jersi sukan Malaysia (SFV APPAREL).
Gunakan maklumat pangkalan data kilang dan data aset platform di bawah untuk menghasilkan kempen yang paling menguntungkan (High ROAS):

${params.dbGroundingContext}

PANDUAN PENAAKULAN KONTEKSTUAL AI (AUTONOMOUS MEDIA BUYER):
1. PEMAHAMAN BAJET SEMANTIK PENUH (DILARANG KAKU):
   - Fahami arahan bajet pengguna secara mendalam daripada teks prompt tanpa mengira cara ejaan atau format (contoh: "RM.10", "RM 10", "bajet 10", "modal sepuluh ringgit sehari", "spend 50 per day", "bajet ciput RM15", "10/hari").
   - Ekstrak nilai nombor tersebut secara pintar pada 'dailyBudget' (contoh: "RM.10" -> 10).
   - Jika pengguna TIDAK menyebut sebarang bajet dalam prompt, cadangkan bajet harian optimum berdasarkan amalan terbaik (contoh: 30 atau 50).

2. PENYELARASAN ASET PLATFORM META YANG TEPAT (SALURAN & AKAUN):
   - Rujuk senarai 'ASET PLATFORM META & SALURAN RASMI YANG SEDANG AKTIF' dalam data di atas.
   - Pilih secara automatik:
     * selectedPageId: ID Facebook Page yang paling sesuai (cth: "${defaultPage}").
     * selectedInstagramAccountId: ID Akaun Instagram yang terpaut (cth: "${defaultIg}").
     * selectedWhatsappNumber: Nombor WhatsApp aktif untuk menerima mesej (cth: "${defaultWa}").
     * selectedPixelId: ID Meta Pixel yang aktif (cth: "${defaultPix}").
     * destination: 'whatsapp' (jika pengguna ingin mesej WhatsApp / leads), 'instagram', atau 'website'.

3. PENALAAN SASARAN & MINAT PINTAR (SMART TARGETING):
   - ageMin & ageMax: Tentukan lingkungan umur yang paling tepat mengikut produk dan permintaan (contoh: 18-35 untuk futsal, 25-50 untuk korporat).
   - gender: 'all', 'male', atau 'female' mengikut kesesuaian produk.
   - locationName: "Malaysia (Seluruh Negara)" atau lokasi khusus jika dinyatakan pengguna.
   - interests: 3-5 minat Meta Ads rasmi yang relevan (seperti Futsal, Sports clothing, Jersey (clothing), Association football, dsb).
   - engagedShoppers: boolean (true untuk pembeli berkualiti tinggi).
   - placementType: 'feed_reels' (penempatan utama berprestasi tinggi FB & IG) atau 'advantage'.
   - scheduleType: 'peak_hours' atau 'all_day'.
   - aiTargetingReason: Penjelasan strategi media buying (1-2 ayat) mengapa setelan aset, sasaran, dan bajet ini dipilih.

4. 5 SUDUT COPYWRITING HOOK DINAMIK & KONTEKSTUAL (DILARANG KAKU):
   - Cipta 5 sudut penulisan asli yang disesuaikan secara kreatif dengan arahan prompt pengguna (contoh: Sudut FOMO, Sudut Jimat Terus Kilang, Sudut Pasukan & Kelab, Sudut Solusi Kain Drifit, Sudut Jaminan Siap Pantas, atau Sudut Pakej Khas).
   - Pastikan setiap variasi mempunyai 'angleName' yang unik dan relevan.

5. SIFAR EMOJI & EMOTIKON: Dilarang sama sekali meletakkan sebarang simbol emoji atau emotikon dalam output.

6. FORMATKAN OUTPUT HANYA DALAM JSON SAH TANPA MARKDOWN LAIN:
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
    "aiTargetingReason": "Penalaan audiens aktif diselaraskan dengan aset Facebook Page, nombor WhatsApp rasmi, dan bajet RM10/hari."
  },
  "variations": [
    {
      "id": "var-1",
      "angleName": "Nama Sudut Strategi Kontekstual 1",
      "tagline": "Tagline Nilai Tambah",
      "headline": "Tajuk Iklan Berimpak Tinggi",
      "secondaryHeadline": "Sub-tajuk penegasan nilai",
      "primaryText": "Teks copywriting persuasif yang mendalam tanpa emoji.",
      "callToAction": "Dapatkan Sebut Harga",
      "whatsappMessage": "Salam, saya berminat untuk membuat tempahan..."
    }
  ]
}`;

  const userContent = `ARAHAN PENGGUNA: "${params.prompt}"
PRODUK: ${params.productName} (${params.category})
PLATFORM: ${params.platform}
OBJEKTIF: ${params.objective}
Lakukan penaakulan semantik penuh: ekstrak bajet pengguna secara tepat (walaupun ditulis seperti RM.10 atau sebutan kata), pilih aset platform aktif yang sesuai, dan hasilkan 5 sudut copywriting dinamik bersama konfigurasi adSettings lengkap dalam format JSON tanpa emoji.`;

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

      const { variations, adSettings } = parseCleanAiResponse(rawText, params.prompt, params.platform, params.objective, params.metaAssets);
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

    const { variations, adSettings } = parseCleanAiResponse(rawText, params.prompt, params.platform, params.objective, params.metaAssets);
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

      const { variations, adSettings } = parseCleanAiResponse(rawText, params.prompt, params.platform, params.objective, params.metaAssets);
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
  metaAssets?: any
): { variations: AiVariation[]; adSettings: DynamicAdSettings } {
  const defaultPage = metaAssets?.pages?.[0]?.id || '101928374829102';
  const defaultWa = metaAssets?.whatsappNumbers?.[0]?.number || '+60148599138';
  const defaultIg = metaAssets?.instagramAccounts?.[0]?.id || '17841405829102938';
  const defaultPix = metaAssets?.pixels?.[0]?.id || 'pix-847291048291039';

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
      headline: cleanNoEmoji(item.headline || 'Kilang Cetak Jersi Sublimasi & DTF'),
      secondaryHeadline: cleanNoEmoji(item.secondaryHeadline || 'Kualiti Terjamin Dari SVF APPAREL'),
      primaryText: cleanNoEmoji(item.primaryText || ''),
      callToAction: cleanNoEmoji(item.callToAction || 'Dapatkan Sebut Harga'),
      whatsappMessage: cleanNoEmoji(item.whatsappMessage || 'Salam SVF, saya berminat untuk tempahan jersi.'),
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
