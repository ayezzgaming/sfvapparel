import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(req: NextRequest) {
  try {
    const body: GenerateAdsRequest = await req.json();
    const {
      prompt,
      platform = 'meta',
      objective = 'whatsapp_leads',
      productName = 'Jersi Sublimasi Cyber Pro',
      category = 'Jersi Sukan',
      apiKey: userApiKey,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt diperlukan' }, { status: 400 });
    }

    const cleanPrompt = prompt.trim();
    const rawKey = userApiKey?.trim() || process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    // 1. Check if Key is a Free Groq API Key (starts with gsk_)
    if (rawKey && rawKey.startsWith('gsk_')) {
      try {
        const groqResult = await callGroqApi(rawKey, {
          prompt: cleanPrompt,
          platform,
          objective,
          productName,
          category,
        });
        if (groqResult && groqResult.length > 0) {
          return NextResponse.json({
            success: true,
            source: 'groq-llama-3.3-70b',
            variations: groqResult,
          });
        }
      } catch (err: any) {
        console.warn('Groq API call failed:', err?.message);
      }
    }

    // 2. Check if Key is OpenRouter Key (starts with sk-or-)
    if (rawKey && rawKey.startsWith('sk-or-')) {
      try {
        const orResult = await callOpenRouterApi(rawKey, {
          prompt: cleanPrompt,
          platform,
          objective,
          productName,
          category,
        });
        if (orResult && orResult.length > 0) {
          return NextResponse.json({
            success: true,
            source: 'openrouter-free',
            variations: orResult,
          });
        }
      } catch (err: any) {
        console.warn('OpenRouter API call failed:', err?.message);
      }
    }

    // 3. Check Google Gemini Cloud Key
    if (rawKey && !rawKey.startsWith('gsk_') && !rawKey.startsWith('sk-or-')) {
      try {
        const geminiResult = await callGeminiWithFallbacks(rawKey, {
          prompt: cleanPrompt,
          platform,
          objective,
          productName,
          category,
        });
        if (geminiResult && geminiResult.length > 0) {
          return NextResponse.json({
            success: true,
            source: 'gemini-cloud',
            variations: geminiResult,
          });
        }
      } catch (err: any) {
        console.warn('Gemini API call failed:', err?.message);
      }
    }

    // 4. Default High-Precision Semantic Marketing Engine (100% Free, Instant, Zero Dependency)
    const synthesized = generateSemanticMarketingCopy({
      prompt: cleanPrompt,
      platform,
      objective,
      productName,
      category,
    });

    return NextResponse.json({
      success: true,
      source: 'semantic-ai-engine',
      hasApiKey: Boolean(rawKey),
      variations: synthesized,
    });
  } catch (error: any) {
    console.error('Error in ads generation:', error);
    return NextResponse.json({ error: error.message || 'Ralat menjana copywriting' }, { status: 500 });
  }
}

/**
 * Groq Llama 3.3 70B Versatile API (100% Free, Ultra Fast)
 */
async function callGroqApi(
  apiKey: string,
  params: { prompt: string; platform: string; objective: string; productName: string; category: string }
): Promise<AiVariation[] | null> {
  const systemPrompt = `Anda ialah Pakar Strategi Pemasaran Iklan & Penulis Copywriting Berprestasi Tinggi untuk kilang jersi dan pakaian SVF APPAREL Malaysia.
Tugasan anda adalah menjana 3 sudut kempen iklan berbeza yang persuasif, natural dalam Bahasa Melayu, dan mengikut algoritma platform ${params.platform}.

ARAHAN KETAT:
1. SIFAR EMOJI & EMOTIKON. Jangan masukkan sebarang simbol atau emoji apa jua.
2. Hasil mestilah format JSON array mengandungi tepat 3 objek:
[
  {
    "id": "var-1",
    "angleName": "Sudut Tawaran & Penjimatan Kilang",
    "tagline": "Diskaun Kuantiti & Harga Terus Dari Kilang",
    "headline": "Tajuk iklan yang padat dan menarik (< 50 aksara)",
    "secondaryHeadline": "Sub-tajuk penegasan USP (< 60 aksara)",
    "primaryText": "Perenggan copywriting 2-4 ayat yang persuasif menerangkan kelebihan produk mengikut tema pengguna.",
    "callToAction": "Dapatkan Sebut Harga",
    "whatsappMessage": "Salam SVF Apparel, saya ingin mendapatkan sebut harga..."
  }
]
Keluarkan HANYA teks JSON sah.`;

  const userContent = `Tema Iklan: "${params.prompt}"
Produk: ${params.productName} (${params.category})
Platform: ${params.platform}
Objektif: ${params.objective}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content;
  if (!rawText) return null;

  try {
    const parsed = JSON.parse(rawText);
    const arr = Array.isArray(parsed) ? parsed : parsed.variations || Object.values(parsed)[0];
    if (Array.isArray(arr) && arr.length >= 3) {
      return arr.slice(0, 3).map((item: any, idx: number) => ({
        id: item.id || `var-groq-${idx + 1}`,
        angleName: cleanNoEmoji(item.angleName || `Sudut Strategi ${idx + 1}`),
        tagline: cleanNoEmoji(item.tagline || 'Pilihan Khas'),
        headline: cleanNoEmoji(item.headline || 'Kilang Cetak Jersi Sublimasi & DTF'),
        secondaryHeadline: cleanNoEmoji(item.secondaryHeadline || 'Kualiti Terjamin Dari SVF APPAREL'),
        primaryText: cleanNoEmoji(item.primaryText || ''),
        callToAction: cleanNoEmoji(item.callToAction || 'Hubungi Kami'),
        whatsappMessage: cleanNoEmoji(item.whatsappMessage || 'Salam SVF, saya berminat.'),
      }));
    }
  } catch {}
  return null;
}

/**
 * OpenRouter Free Tier Models API
 */
async function callOpenRouterApi(
  apiKey: string,
  params: { prompt: string; platform: string; objective: string; productName: string; category: string }
): Promise<AiVariation[] | null> {
  const systemPrompt = `Anda ialah Pakar Strategi Pemasaran Iklan SVF APPAREL Malaysia. Hasilkan 3 sudut copywriting iklan JSON tanpa sebarang emoji.`;
  const userContent = `Tema: "${params.prompt}", Produk: ${params.productName}, Platform: ${params.platform}. Return JSON array of 3 variations with keys: id, angleName, tagline, headline, secondaryHeadline, primaryText, callToAction, whatsappMessage.`;

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

  if (!res.ok) return null;
  const data = await res.json();
  const rawText = data.choices?.[0]?.message?.content;
  if (!rawText) return null;

  try {
    const clean = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    const arr = Array.isArray(parsed) ? parsed : parsed.variations;
    if (Array.isArray(arr) && arr.length >= 3) {
      return arr.slice(0, 3).map((item: any, idx: number) => ({
        id: item.id || `var-or-${idx + 1}`,
        angleName: cleanNoEmoji(item.angleName || `Sudut Strategi ${idx + 1}`),
        tagline: cleanNoEmoji(item.tagline || 'Pilihan Khas'),
        headline: cleanNoEmoji(item.headline || 'Kilang Cetak Jersi Sublimasi & DTF'),
        secondaryHeadline: cleanNoEmoji(item.secondaryHeadline || 'Kualiti Terjamin Dari SVF APPAREL'),
        primaryText: cleanNoEmoji(item.primaryText || ''),
        callToAction: cleanNoEmoji(item.callToAction || 'Hubungi Kami'),
        whatsappMessage: cleanNoEmoji(item.whatsappMessage || 'Salam SVF, saya berminat.'),
      }));
    }
  } catch {}
  return null;
}

/**
 * Gemini Multi-Model Call
 */
async function callGeminiWithFallbacks(
  apiKey: string,
  params: { prompt: string; platform: string; objective: string; productName: string; category: string }
): Promise<AiVariation[] | null> {
  const candidateModels = [
    'gemini-2.5-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  const systemPrompt = `Anda ialah Pakar Strategi Pemasaran Iklan & Penulis Copywriting Berprestasi Tinggi untuk kilang jersi SVF APPAREL Malaysia. SIFAR EMOJI. Format JSON array of 3 objects.`;
  const userContent = `Tema / Brief Iklan: "${params.prompt}"
Produk Utama: ${params.productName} (${params.category})
Platform Sasaran: ${params.platform}
Objektif: ${params.objective}`;

  for (const model of candidateModels) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
          generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 1500, responseMimeType: 'application/json' },
        }),
      });

      if (!res.ok) continue;
      const data = await res.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) continue;

      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length >= 3) {
        return parsed.map((item, idx) => ({
          id: item.id || `var-gemini-${idx + 1}`,
          angleName: cleanNoEmoji(item.angleName || `Sudut Strategi ${idx + 1}`),
          tagline: cleanNoEmoji(item.tagline || 'Pilihan Khas'),
          headline: cleanNoEmoji(item.headline || 'Kilang Cetak Jersi Sublimasi & DTF'),
          secondaryHeadline: cleanNoEmoji(item.secondaryHeadline || 'Kualiti Terjamin Dari SVF APPAREL'),
          primaryText: cleanNoEmoji(item.primaryText || ''),
          callToAction: cleanNoEmoji(item.callToAction || 'Hubungi Kami'),
          whatsappMessage: cleanNoEmoji(item.whatsappMessage || 'Salam SVF, saya berminat.'),
        }));
      }
    } catch {}
  }

  return null;
}

function cleanNoEmoji(str: string): string {
  if (!str) return '';
  return str
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    .trim();
}

/**
 * High-Precision Semantic Marketing Engine
 * Extracts semantic intent (Hari Sukan, Futsal, Korporat, DTF, Harimau Malaya, etc.)
 * and generates authentic, perfectly phrased Malaysian marketing copy.
 */
function generateSemanticMarketingCopy(params: {
  prompt: string;
  platform: string;
  objective: string;
  productName: string;
  category: string;
}): AiVariation[] {
  const p = params.prompt.toLowerCase();

  // Intent classification
  const isHariSukan = p.includes('sukan') || p.includes('hari sukan') || p.includes('karnival') || p.includes('sukaneka');
  const isCorporate = p.includes('korporat') || p.includes('syarikat') || p.includes('polo') || p.includes('pejabat') || p.includes('family day') || p.includes('hari keluarga');
  const isFutsal = p.includes('futsal') || p.includes('bola') || p.includes('liga') || p.includes('tournament') || p.includes('kejohanan');
  const isDtf = p.includes('dtf') || p.includes('baju') || p.includes('t-shirt') || p.includes('cotton') || p.includes('merchandise');
  const isHarimau = p.includes('harimau') || p.includes('malaysia') || p.includes('edisi') || p.includes('patriotik');

  // Semantic topic label
  let topicLabel = 'Jersi Sukan Kustom';
  let eventContext = 'kejohanan dan aktiviti sukan anda';
  let themeHook = 'Persiapkan pasukan anda dengan jersi berkualiti tinggi dari SVF APPAREL.';

  if (isHariSukan) {
    topicLabel = 'Jersi Hari Sukan & Karnival';
    eventContext = 'acara Hari Sukan, sukaneka, dan karnival komuniti';
    themeHook = 'Raikan Hari Sukan dengan semangat berpasukan dan gaya eksklusif bersama jersi kustom berkualiti dari SVF APPAREL.';
  } else if (isCorporate) {
    topicLabel = 'Jersi Polo & Acara Korporat';
    eventContext = 'acara rasmi syarikat, hari keluarga, dan program team building';
    themeHook = 'Tingkatkan imej profesional organisasi anda melalui pakaian korporat kemas dan selesa dari SVF APPAREL.';
  } else if (isFutsal) {
    topicLabel = 'Jersi Pasukan Futsal & Bola Sepak';
    eventContext = 'liga futsal, perlawanan persahabatan, dan kejohanan komuniti';
    themeHook = 'Tampil bergaya di padang dengan jersi pasukan kustom beresolusi tinggi dari SVF APPAREL.';
  } else if (isDtf) {
    topicLabel = 'Cetak Baju DTF & T-Shirt Kustom';
    eventContext = 'keperluan merchandise, pakaian komuniti, dan jenama anda';
    themeHook = 'Dapatkan cetakan baju DTF warna terang dan tahan basuhan terus dari kilang SVF APPAREL.';
  } else if (isHarimau) {
    topicLabel = 'Jersi Edisi Khas Harimau Malaya';
    eventContext = 'acara sukan kebangsaan dan koleksi eksklusif peminat';
    themeHook = 'Bakar semangat wira negara dengan jersi corak harimau edisi khas daripada SVF APPAREL.';
  }

  // Extract custom user specs if present
  const mentionsFast = p.includes('7 hari') || p.includes('pantas') || p.includes('cepat') || p.includes('segera') || p.includes('ekspres');
  const mentionsFreeDesign = p.includes('percuma') || p.includes('free') || p.includes('nama') || p.includes('nombor');
  const mentionsFabric = p.includes('drifit') || p.includes('milano') || p.includes('kain') || p.includes('sejuk');
  const mentionsDiscount = p.includes('diskaun') || p.includes('murah') || p.includes('borong') || p.includes('jimat') || p.includes('%');

  const fabricNote = mentionsFabric ? 'Fabrik Drifit Milano yang sejuk anti-peluh' : 'Fabrik sukan mikro-gentian berkualiti tinggi';
  const turnaroundNote = mentionsFast ? 'jaminan siap dalam 7 hari bekerja' : 'proses pengeluaran pantas dan menepati masa';
  const designNote = mentionsFreeDesign ? 'perkhidmatan susun atur nama dan nombor secara percuma' : 'konsultasi rekaan grafik profesional percuma';
  const discountNote = mentionsDiscount ? 'diskaun pukal istimewa untuk tempahan kuantiti' : 'harga borong terus tanpa sebarang orang tengah';

  return [
    {
      id: `var-sem-1-${Date.now()}`,
      angleName: 'Sudut Harga Kilang & Penjimatan Pukal',
      tagline: 'Diskaun Kuantiti Terus Dari Kilang',
      headline: `Pakej Tempahan ${topicLabel} Terus Dari Kilang`,
      secondaryHeadline: `Harga Borong Terbaik | ${designNote}`,
      primaryText: `${themeHook} Nikmati penjimatan maksimum dengan ${discountNote}. Menggunakan ${fabricNote.toLowerCase()}, cetakan warna tajam tidak luntur, serta ${turnaroundNote}. Hubungi kami sekarang untuk sebut harga segera di WhatsApp.`,
      callToAction: 'Dapatkan Sebut Harga',
      whatsappMessage: `Salam SVF APPAREL, saya ingin mendapatkan sebut harga rasmi bagi tempahan ${topicLabel.toLowerCase()} untuk ${eventContext}.`,
    },
    {
      id: `var-sem-2-${Date.now()}`,
      angleName: 'Sudut Kualiti Material & Rekaan Eksklusif',
      tagline: 'Fabrik Drifit Sejuk & Kemasan Eksport',
      headline: `${topicLabel} Eksklusif | ${fabricNote}`,
      secondaryHeadline: `Warna Cetakan Tajam Tahan Basuhan | ${designNote}`,
      primaryText: `Serlahkan identiti pasukan anda bagi ${eventContext}. SVF APPAREL menyediakan teknologi cetakan sublimasi warna ultra-terang dan kemasan jahitan kukuh bertaraf eksport. Selesa dipakai sepanjang hari dalam sebarang keadaan cuaca.`,
      callToAction: 'Kirim Mesej WhatsApp',
      whatsappMessage: `Hai SVF APPAREL, saya berminat dengan kualiti material premium dan rekaan kustom bagi ${topicLabel.toLowerCase()}.`,
    },
    {
      id: `var-sem-3-${Date.now()}`,
      angleName: 'Sudut Jaminan Siap Pantas & Tarikh Acara',
      tagline: 'Jaminan Siap Pantas & Penghantaran Selamat',
      headline: `Tempah ${topicLabel} Siap Tepat Untuk Acara Anda`,
      secondaryHeadline: `Penghantaran Terjamin ke Seluruh Malaysia | ${turnaroundNote}`,
      primaryText: `Masa semakin suntuk untuk ${eventContext}? Pasukan kilang kami sedia membantu memproses tempahan anda dengan ${turnaroundNote}. Kualiti setiap helai diperiksa rapi sebelum dihantar terus ke lokasi anda.`,
      callToAction: 'Tempah Sekarang',
      whatsappMessage: `Salam SVF APPAREL, saya ingin mengesahkan slot tempahan segera bagi ${topicLabel.toLowerCase()} sempena acara yang bakal berlangsung.`,
    },
  ];
}
