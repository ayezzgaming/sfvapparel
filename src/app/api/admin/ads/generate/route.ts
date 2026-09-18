import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
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

interface AiVariation {
  id: string;
  angleName: string;
  tagline: string;
  headline: string;
  secondaryHeadline: string;
  primaryText: string;
  callToAction: string;
  whatsappMessage: string;
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

  // Try fetching live Supabase data if connected
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
    const rawKey = userApiKey?.trim() || process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    // Strict validation: Credentials are REQUIRED
    if (!rawKey) {
      return NextResponse.json(
        {
          error: 'Kunci API AI (Groq / Gemini / OpenRouter) diperlukan. Sila tekan ikon model AI pada bar input untuk memasukkan API key anda.',
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

      if (groqResult.success && groqResult.variations) {
        return NextResponse.json({
          success: true,
          source: 'groq-llama-3.3-70b',
          variations: groqResult.variations,
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

      if (orResult.success && orResult.variations) {
        return NextResponse.json({
          success: true,
          source: 'openrouter-free',
          variations: orResult.variations,
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

    if (geminiResult.success && geminiResult.variations) {
      return NextResponse.json({
        success: true,
        source: 'gemini-cloud',
        variations: geminiResult.variations,
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
): Promise<{ success: boolean; variations?: AiVariation[]; error?: string }> {
  const candidateModels = [
    'openai/gpt-oss-120b',
    'qwen/qwen3.8-27b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ];

  const systemPrompt = `Anda ialah Ketua Pakar Strategi Pemasaran Digital & Penulis Copywriting Berprestasi Tinggi untuk jenama pakaian sukan dan kilang cetak.
Gunakan maklumat pangkalan data kilang di bawah untuk menghasilkan 5 variasi sudut iklan yang sangat persuasif, tepat dari segi fakta teknikal fabrik dan harga:

${params.dbGroundingContext}

PERATURAN KETAT:
1. SIFAR EMOJI & EMOTIKON. Dilarang sama sekali meletakkan emoji dalam sebarang teks output.
2. Gunakan Bahasa Melayu profesional dan meyakinkan (fokus kepada pasaran sukan, kelab, sekolah, korporat Malaysia).
3. Hasilkan tepat 5 sudut strategi jualan yang berbeza:
   - Variasi 1: Sudut Penjimatan & Harga Kilang Tanpa Perantara
   - Variasi 2: Sudut Kualiti Fabrik Drifit Milano & Kemasan HD
   - Variasi 3: Sudut Kelajuan & Jaminan Siap Pantas 7 Hari
   - Variasi 4: Sudut Identiti Pasukan & Percuma Rekaan Grafik
   - Variasi 5: Sudut Korporat & Pukal Borong
4. Sesuaikan mengikut platform "${params.platform}":
   - Format Facebook / Instagram: Tajuk padu, kepsyen penerangan manfaat mendalam, CTA jelas.
   - Format Google Search: Tajuk SEO padat (< 30 aksara), huraian SEO (< 90 aksara).
   - Format WhatsApp: Teks kepsyen promosi + mesej autofill WhatsApp untuk pembeli.
5. Formatkan jawapan HANYA dalam JSON array sah (tanpa sebarang teks ulasan di luar JSON):
[
  {
    "id": "var-1",
    "angleName": "Sudut Harga Kilang & Penjimatan",
    "tagline": "Diskaun Kuantiti Terus Dari Kilang",
    "headline": "Tajuk Iklan Padat dan Berimpak Tinggi",
    "secondaryHeadline": "Sub-tajuk penegasan nilai USP",
    "primaryText": "Perenggan copywriting 2-4 ayat yang persuasif berasaskan konteks produk dan prompt.",
    "callToAction": "Dapatkan Sebut Harga",
    "whatsappMessage": "Salam, saya ingin bertanyakan tentang sebut harga..."
  }
]`;

  const userContent = `ARAHAN PENGGUNA: "${params.prompt}"
PRODUK: ${params.productName} (${params.category})
PLATFORM: ${params.platform}
OBJEKTIF: ${params.objective}
Hasilkan 5 variasi JSON array tanpa emoji.`;

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

      const parsed = parseCleanAiVariations(rawText);
      if (parsed && parsed.length >= 2) {
        return { success: true, variations: parsed };
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
): Promise<{ success: boolean; variations?: AiVariation[]; error?: string }> {
  const systemPrompt = `Anda ialah Pakar Copywriting Pemasaran Iklan Pakaian & Jersi Malaysia.
Gunakan maklumat database berikut:
${params.dbGroundingContext}

ARAHAN: Sifar emoji. Jana 5 sudut copywriting iklan JSON mengikut tema pengguna untuk platform ${params.platform}.`;

  const userContent = `Arahan: "${params.prompt}", Produk: ${params.productName}, Platform: ${params.platform}. Output HANYA JSON array tepat 5 objek: id, angleName, tagline, headline, secondaryHeadline, primaryText, callToAction, whatsappMessage.`;

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

    const parsed = parseCleanAiVariations(rawText);
    if (parsed && parsed.length >= 2) {
      return { success: true, variations: parsed };
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
): Promise<{ success: boolean; variations?: AiVariation[]; error?: string }> {
  const candidateModels = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  const systemInstruction = `Anda ialah Pakar Copywriting Iklan Sukan & Pakaian.
Gunakan maklumat database berikut:
${params.dbGroundingContext}

ARAHAN KETAT:
1. SIFAR EMOJI & EMOTIKON. Dilarang sama sekali meletakkan sebarang simbol emoji.
2. Hasilkan tepat 5 variasi sudut iklan berprestasi tinggi dalam Bahasa Melayu.
3. Hasilkan output HANYA JSON array 5 objek (id, angleName, tagline, headline, secondaryHeadline, primaryText, callToAction, whatsappMessage).`;

  const promptText = `TEMA IKLAN: "${params.prompt}"
PRODUK: ${params.productName} (${params.category})
PLATFORM: ${params.platform}
OBJEKTIF: ${params.objective}`;

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
              parts: [{ text: `${systemInstruction}\n\n${promptText}` }],
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

      const parsed = parseCleanAiVariations(rawText);
      if (parsed && parsed.length >= 3) {
        return { success: true, variations: parsed };
      }
    } catch (e: any) {
      lastError = e?.message || 'Ralat sambungan Gemini';
    }
  }

  return { success: false, error: lastError || 'Kunci Gemini tidak sah atau kuota telah habis' };
}

/**
 * Clean & Sanitize AI JSON response (Strictly Zero Emojis)
 */
function parseCleanAiVariations(raw: string): AiVariation[] | null {
  try {
    const cleanJson = raw
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    const parsed = JSON.parse(cleanJson);
    const arr = Array.isArray(parsed) ? parsed : parsed.variations || Object.values(parsed).find(Array.isArray);

    if (Array.isArray(arr) && arr.length >= 3) {
      return arr.slice(0, 3).map((item: any, idx: number) => ({
        id: item.id || `var-${idx + 1}`,
        angleName: cleanNoEmoji(item.angleName || `Sudut Strategi ${idx + 1}`),
        tagline: cleanNoEmoji(item.tagline || 'Pilihan Khas'),
        headline: cleanNoEmoji(item.headline || 'Kilang Cetak Jersi Sublimasi & DTF'),
        secondaryHeadline: cleanNoEmoji(item.secondaryHeadline || 'Kualiti Terjamin Dari SVF APPAREL'),
        primaryText: cleanNoEmoji(item.primaryText || ''),
        callToAction: cleanNoEmoji(item.callToAction || 'Hubungi Kami'),
        whatsappMessage: cleanNoEmoji(item.whatsappMessage || 'Salam SVF, saya berminat untuk sebut harga.'),
      }));
    }
  } catch {
    // Parsing error
  }
  return null;
}

function cleanNoEmoji(str: string): string {
  if (!str) return '';
  return str
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF\u2300-\u23FF\u2B50\uFE0F\u200D]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
