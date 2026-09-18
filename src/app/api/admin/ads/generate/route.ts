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
    const { prompt, platform = 'meta', objective = 'whatsapp_leads', productName = 'Jersi Sublimasi', category = 'Jersi Sukan', apiKey: userApiKey } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt diperlukan' }, { status: 400 });
    }

    const geminiKey = userApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const aiResponse = await callGeminiApi(geminiKey, {
          prompt: prompt.trim(),
          platform,
          objective,
          productName,
          category,
        });

        if (aiResponse && aiResponse.length > 0) {
          return NextResponse.json({
            success: true,
            source: 'gemini-1.5-flash',
            variations: aiResponse,
          });
        }
      } catch (err: any) {
        console.warn('Gemini API call failed, falling back to heuristic AI engine:', err?.message);
      }
    }

    // Advanced Intelligent NLP Synthesizer (Fallback when API key is missing or failed)
    const synthesized = generateIntelligentCopy({
      prompt: prompt.trim(),
      platform,
      objective,
      productName,
      category,
    });

    return NextResponse.json({
      success: true,
      source: 'smart-nlp-synthesizer',
      hasApiKey: Boolean(geminiKey),
      variations: synthesized,
    });
  } catch (error: any) {
    console.error('Error in ads generation:', error);
    return NextResponse.json({ error: error.message || 'Ralat menjana copywriting' }, { status: 500 });
  }
}

async function callGeminiApi(
  apiKey: string,
  params: { prompt: string; platform: string; objective: string; productName: string; category: string }
): Promise<AiVariation[]> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  const systemPrompt = `You are an elite Performance Marketing Specialist & Direct-Response Copywriting AI for SVF APPAREL Malaysia, deeply trained in advertising algorithms, SEO search intent, and platform-specific conversion psychology:

PLATFORM ALGORITHMIC RULES:
1. GOOGLE ADS (Search & PMax SEO):
   - Optimize for high Click-Through Rate (CTR) and Quality Score.
   - Headline 1 & 2 must contain high-intent commercial keywords (e.g. "Kilang Cetak Jersi", "Baju DTF Pukal", "Jersi Futsal Kustom").
   - Primary text must address search intent, delivery guarantees, and clear CTA without fluff.
2. META ADS (Facebook & Instagram Feed/Reels):
   - First 1-2 lines MUST be a powerful thumb-stopping hook that solves a pain point or presents an irresistible offer.
   - Build desire with social proof, Drifit fabric comfort, high-resolution sublimation, and fast 7-day turnaround.
3. TIKTOK ADS (In-Feed & Spark Ads):
   - High-energy, punchy, concise phrasing tailored for Malaysian sports & community culture.
   - Focus on fast turnaround, team identity, and limited-slot urgency.
4. WHATSAPP ADS (Click-to-WhatsApp Direct Response):
   - Frictionless, warm, professional Bahasa Melayu. Prefilled message must be direct and ready for instant quotation response.

CRITICAL DESIGN & CONTENT RULES:
1. STRICTLY ZERO EMOJIS AND ZERO EMOTICONS. Never output any emojis (no 🔥, ⚡, 🏆, ✅, etc.).
2. Fluent, natural Bahasa Melayu with sharp marketing vocabulary.
3. Generate exactly 3 DISTINCT strategic conversion angles:
   - Angle 1: Tawaran, Penjimatan & Harga Terus Dari Kilang (Price/Discounts/Factory-direct)
   - Angle 2: Kualiti Material, Fabrik Drifit & Ketahanan Sublimasi (Fabric Quality/Anti-Peluh/Eksport)
   - Angle 3: Kelajuan Siap, Komitmen Tarikh & Urgensi Acara (Fast 7-day Turnaround/Event Deadline)

Output MUST be a valid JSON array of exactly 3 objects with this exact TypeScript structure:
[
  {
    "id": "var-1",
    "angleName": "Sudut Tawaran & Harga Kilang",
    "tagline": "Diskaun Kuantiti & Sebut Harga Segera",
    "headline": "Short punchy headline under 50 chars",
    "secondaryHeadline": "Sub headline highlighting USPs under 60 chars",
    "primaryText": "Persuasive 2-4 sentences explaining benefits, fabric, guarantees, and clear instruction to contact via WhatsApp or website without any emojis.",
    "callToAction": "Dapatkan Sebut Harga",
    "whatsappMessage": "Salam SVF Apparel, saya berminat dengan tempahan..."
  },
  ...
]

Return ONLY raw JSON, with no markdown fences, or with standard \`\`\`json markdown fences.`;

  const userContent = `User Brief / Campaign Clue: "${params.prompt}"
Target Product: ${params.productName} (${params.category})
Target Platform: ${params.platform}
Campaign Objective: ${params.objective}`;

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
        topP: 0.95,
        maxOutputTokens: 1500,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error status ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('No content returned by Gemini');

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

  throw new Error('Unexpected JSON format from Gemini');
}

function cleanNoEmoji(str: string): string {
  if (!str) return '';
  return str
    .replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '')
    .trim();
}

function generateIntelligentCopy(params: {
  prompt: string;
  platform: string;
  objective: string;
  productName: string;
  category: string;
}): AiVariation[] {
  const p = params.prompt.toLowerCase();

  // Extract key clues from prompt
  const hasFutsal = p.includes('futsal') || p.includes('bola') || p.includes('liga');
  const hasCorporate = p.includes('korporat') || p.includes('syarikat') || p.includes('polo') || p.includes('pejabat');
  const hasDtf = p.includes('dtf') || p.includes('baju') || p.includes('t-shirt') || p.includes('cotton');
  const hasEsports = p.includes('esport') || p.includes('gaming') || p.includes('cyber');
  const hasExpress = p.includes('cepat') || p.includes('7 hari') || p.includes('ekspres') || p.includes('pantas') || p.includes('segera');
  const hasDiscount = p.includes('diskaun') || p.includes('murah') || p.includes('jimat') || p.includes('borong') || p.includes('%') || p.includes('rm');

  let productType = params.productName;
  if (hasCorporate) productType = 'Jersi Korporat & Acara Syarikat';
  else if (hasFutsal) productType = 'Jersi Pasukan Futsal & Bola Sepak';
  else if (hasDtf) productType = 'Cetak Baju DTF & T-Shirt Kustom';
  else if (hasEsports) productType = 'Jersi Kustom Esports & Gaming';

  const userDetails = params.prompt.trim();

  return [
    {
      id: `var-ai-1-${Date.now()}`,
      angleName: 'Sudut Harga Kilang & Penjimatan Pukal',
      tagline: 'Diskaun Kuantiti Terus Dari Kilang',
      headline: `Tawaran Cetak ${productType} Terus Dari Kilang`,
      secondaryHeadline: 'Tempahan Terus Tanpa Orang Tengah | Harga Borong',
      primaryText: `Dapatkan ${productType.toLowerCase()} berkualiti tinggi dengan penjimatan maksimum. ${userDetails}. Menggunakan fabrik berkualiti Drifit sejuk, warna cetakan tajam tidak luntur, dan siap mengikut jadual yang ditetapkan. Hubungi kami untuk sebut harga pantas.`,
      callToAction: 'Dapatkan Sebut Harga',
      whatsappMessage: `Salam SVF APPAREL, saya ingin mendapatkan sebut harga rasmi bagi ${productType.toLowerCase()} berdasarkan tawaran kilang.`,
    },
    {
      id: `var-ai-2-${Date.now()}`,
      angleName: 'Sudut Kualiti Material & Rekaan Premium',
      tagline: 'Fabrik Drifit Sejuk & Kemasan Eksport',
      headline: `${productType} Eksklusif | Fabrik Drifit Anti-Peluh`,
      secondaryHeadline: 'Percuma Khidmat Susun Atur Nama, Nombor & Logo Pasukan',
      primaryText: `Tingkatkan identiti dan imej pasukan anda dengan kualiti jahitan kemas serta resolusi cetakan warna ultra-terang dari SVF APPAREL. ${userDetails}. Material selesa dipakai sepanjang hari tanpa rasa panas.`,
      callToAction: 'Kirim Mesej WhatsApp',
      whatsappMessage: `Hai SVF APPAREL, saya berminat dengan material premium dan rekaan kustom bagi ${productType.toLowerCase()}.`,
    },
    {
      id: `var-ai-3-${Date.now()}`,
      angleName: hasExpress ? 'Sudut Jaminan Siap Pantas & Tarikh Tepat' : 'Sudut Kepantasan & Khidmat Konsultasi Percuma',
      tagline: 'Siap Pantas & Penghantaran Selamat',
      headline: `Tempah ${productType} Siap Tepat Pada Masanya`,
      secondaryHeadline: 'Penghantaran Terjamin ke Seluruh Semenanjung, Sabah & Sarawak',
      primaryText: `Perlukan pakaian kustom berkualiti untuk acara atau perlawanan anda? ${userDetails}. Kilang kami memproses setiap tempahan dengan kawalan kualiti ketat dan penghantaran selamat terus ke pintu anda.`,
      callToAction: 'Tempah Sekarang',
      whatsappMessage: `Salam SVF APPAREL, saya ingin menyemak slot masa tempahan untuk ${productType.toLowerCase()}.`,
    },
  ];
}
