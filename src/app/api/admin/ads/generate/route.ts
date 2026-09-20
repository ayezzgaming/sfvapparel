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
 * Smart regex helper to detect user-specified daily budgets in prompts
 */
function extractBudgetFromPrompt(prompt: string): number | null {
  if (!prompt) return null;
  const regexes = [
    /(?:bajet|budget|peruntukan|kos|modal)\s*(?:rm|myr|ringgit)?\s*(\d+)/i,
    /(?:rm|myr)\s*(\d+)\s*(?:sehari|per\s*day|harian)?/i,
    /(\d+)\s*(?:rm|myr|ringgit)?\s*(?:sehari|per\s*day|harian)/i,
    /bajet\s*:\s*(\d+)/i,
    /budget\s*:\s*(\d+)/i,
  ];

  for (const reg of regexes) {
    const match = prompt.match(reg);
    if (match && match[1]) {
      const val = parseInt(match[1], 10);
      if (val >= 5 && val <= 50000) {
        return val;
      }
    }
  }
  return null;
}

/**
 * Fetch and construct comprehensive business grounding context from Database & Store
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
    // Uses seed-data as high-fidelity database fallback
  }

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

  return `
MAKLUMAT PERNIAGAAN & PENGKALAN DATA SISTEM:
- Nama Syarikat: ${company.company_name || 'SFV Ventures Marketing'}
- Jenama Rasmi: ${company.brand_name || 'SFV APPAREL'}
- No Pendaftaran: ${company.registration_number || '202303194821 (003492811-M)'}
- Industri: Pembuatan Jersi Sublimasi Penuh, Cetakan DTF & Sulaman Pakaian Kustom Berkualiti Tinggi Malaysia.
- Lokasi & Alamat Operasi: ${company.address || 'Kajang, Selangor, Malaysia'}
- Nombor Khidmat Pelanggan / WhatsApp: ${company.phone || company.whatsapp_number || '+60 14-859 9138'}
- Tagline & Misi Jenama: ${company.tagline || 'Pakar pembuatan jersi sublimasi penuh, cetakan DTF & sulaman pakaian kustom berkualiti tinggi di Malaysia.'}

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
`;
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

    // Build real business grounding context from database
    const dbGroundingContext = await buildBusinessGroundingContext(productName, category);

    // 1. Groq Cloud (Llama 3.3 70B / GPT-OSS 120B)
    if (rawKey.startsWith('gsk_')) {
      const groqResult = await callGroqApi(rawKey, {
        prompt: cleanPrompt,
        platform,
        objective,
        productName,
        category,
        dbGroundingContext,
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
        dbGroundingContext,
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
      dbGroundingContext,
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
 * System prompt generator that dynamically commands the AI to craft bespoke hook angles & optimal targeting
 */
function buildAiPromptInstructions(params: {
  prompt: string;
  platform: string;
  objective: string;
  productName: string;
  category: string;
  dbGroundingContext: string;
}) {
  const detectedBudget = extractBudgetFromPrompt(params.prompt);

  const systemPrompt = `Anda ialah Ketua Pakar Media Buyer (Senior Meta Ads Strategist) dan Direct-Response Copywriter terkemuka untuk industri pakaian sukan & jersi kustom Malaysia (SFV APPAREL).
Gunakan maklumat pangkalan data kilang di bawah untuk menghasilkan kempen pemasaran berimpak tinggi yang memaksimumkan ROAS:

${params.dbGroundingContext}

PANDUAN KETAT DAN DINAMIK:
1. GAYA PENULISAN HOOK DINAMIK (DILARANG KAKU):
   - JANGAN mengunci copywriting ke dalam templat statis.
   - Analisis arahan prompt pengguna secara mendalam dan cipta 5 variasi sudut penulisan (Hook) yang 100% DISESUAIKAN dengan matlamat dan audiens kempen (contoh: Sudut FOMO/Kouta Terhad, Sudut Penjimatan Kilang Terus, Sudut Pasukan & Kebanggaan Skuad, Sudut Penyelesaian Masalah Kain Panas/Luntur, Sudut Tawaran Percuma Grafik, Sudut Korporat Pukal, atau Sudut Acara/Kejohanan).
   - Pastikan setiap variasi mempunyai 'angleName' yang kreatif dan deskriptif.

2. SETELAN IKLAN META PINTAR & DINAMIK (SMART TARGETING & BUDGET):
   - Tentukan setelan iklan terbaik berdasarkan konteks prompt:
     * destination: 'whatsapp' (lalai untuk tempahan mesej), 'instagram', atau 'website'.
     * ageMin & ageMax: Tentukan lingkungan umur yang paling tepat (contoh: 18-35 untuk futsal/esports, 25-50 untuk korporat).
     * gender: 'all', 'male', atau 'female' mengikut kesesuaian produk.
     * locationName: "Malaysia (Seluruh Negara)" atau lokasi khusus jika disebut pengguna.
     * interests: 3-5 minat Meta Ad yang relevan (nama minat rasmi seperti Futsal, Sports clothing, Association football, dsb).
     * engagedShoppers: boolean (true untuk pembeli berkualiti tinggi).
     * placementType: 'feed_reels' (penempatan utama berprestasi tinggi) atau 'advantage'.
     * dailyBudget: ${detectedBudget ? `Gunakan nilai ${detectedBudget} kerana pengguna meminta bajet ini dalam prompt.` : `Cadangkan nilai bajet harian optimum (cth: 30, 40, atau 50).`}
     * scheduleType: 'peak_hours' atau 'all_day'.
     * aiTargetingReason: Penjelasan strategi media buying secara ringkas (1-2 ayat) mengapa setelan ini dipilih.

3. SIFAR EMOJI & EMOTIKON: Dilarang sama sekali menggunakan sebarang simbol emoji atau emotikon.

4. FORMATKAN OUTPUT HANYA DALAM JSON SAH TANPA MARKDOWN LAIN:
{
  "adSettings": {
    "destination": "whatsapp",
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
    "dailyBudget": ${detectedBudget || 30},
    "scheduleType": "peak_hours",
    "durationDays": 7,
    "aiTargetingReason": "Strategi penalaan difokuskan kepada audiens sukan aktif dan pengurus pasukan."
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
Hasilkan tepat 5 variasi sudut copywriting dinamik dan konfigurasi adSettings lengkap dalam format JSON tanpa emoji.`;

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

      const { variations, adSettings } = parseCleanAiResponse(rawText, params.prompt, params.platform, params.objective);
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

    const { variations, adSettings } = parseCleanAiResponse(rawText, params.prompt, params.platform, params.objective);
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

      const { variations, adSettings } = parseCleanAiResponse(rawText, params.prompt, params.platform, params.objective);
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
 * Clean & Sanitize AI JSON response (Zero Emojis + Dynamic Targeting Parser)
 */
function parseCleanAiResponse(
  raw: string,
  userPrompt: string,
  platform: string,
  objective: string
): { variations: AiVariation[]; adSettings: DynamicAdSettings } {
  const detectedBudget = extractBudgetFromPrompt(userPrompt) || 30;

  const defaultAdSettings: DynamicAdSettings = {
    destination: objective?.includes('whatsapp') ? 'whatsapp' : platform === 'instagram' ? 'instagram' : 'whatsapp',
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
    dailyBudget: detectedBudget,
    scheduleType: 'peak_hours',
    durationDays: 7,
    aiTargetingReason: `Penalaan audiens pintar diselaraskan dengan bajet RM${detectedBudget}/hari dan objektif kempen.`,
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

    const finalBudget = extractBudgetFromPrompt(userPrompt) || (parsedSettings?.dailyBudget ? Number(parsedSettings.dailyBudget) : detectedBudget);

    const cleanSettings: DynamicAdSettings = {
      destination: parsedSettings?.destination || defaultAdSettings.destination,
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
      aiTargetingReason: cleanNoEmoji(parsedSettings?.aiTargetingReason || `Penalaan audiens pintar diselaraskan dengan bajet RM${finalBudget}/hari dan arahan prompt.`),
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
