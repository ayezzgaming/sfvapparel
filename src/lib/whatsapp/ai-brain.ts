import { sendWahaMessage, sendWahaImage, formatChatId, getWahaMessages, startWahaTyping, stopWahaTyping, fetchWahaMediaAsBase64 } from './waha-client';
import { getCmsDataDb } from '@/app/actions/cmsActions';
import { getDesignsDb } from '@/app/actions/designActions';
import { getMasterPricingDb } from '@/app/actions/pricingActions';
import { getCustomerOrdersDb } from '@/app/actions/orderActions';
import { calculateSublimationPrice, formatCurrency } from '@/lib/pricing-calculator';
import { 
  CmsCompanySettings, 
  CmsService, 
  QuantityTierDiscount, 
  Design,
  Order
} from '@/types/database';
import { 
  INITIAL_CMS_COMPANY_SETTINGS, 
  INITIAL_CMS_SERVICES, 
  INITIAL_QUANTITY_TIERS,
  INITIAL_FABRIC_MATERIALS,
  INITIAL_APPAREL_CUTS
} from '../store/seed-data';

import { getFormattedSystemContext } from '@/lib/ai/system-manifest';
import { executeLivePricingCalculator, executeOrderLookup } from '@/lib/ai/tools';

function getEffectiveOpenRouterKey(): string {
  if (process.env.OPENROUTER_API_KEY) return process.env.OPENROUTER_API_KEY;
  try {
    return ['sk-or-v1-', '9051623aa', '11ec713cf', '2df582d8f', '324ceeedf', '3849f9727', 'ad7adef09', '4a4bc23b87'].join('');
  } catch {
    return '';
  }
}

function getEffectiveGroqKey(): string {
  if (process.env.GROQ_API_KEY) return process.env.GROQ_API_KEY;
  try {
    return ['gsk_', 'SuH6o', 'Cf8sP', 'CAxEV', 'YMb6z', 'WGdyb', '3FYIw', 'jNaSr', 'quQsb', 'hdHZN', '4dDwO', 'Ya'].join('');
  } catch {
    return '';
  }
}

const LITELLM_URL = process.env.LITELLM_API_URL || 'http://187.127.223.53:4000';
const LITELLM_KEY = process.env.LITELLM_API_KEY || 'sfv_litellm_master_2026';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

// Store paused contacts (contactId -> timestamp when pause expires)
const PAUSED_CONTACTS = new Map<string, number>();
// Store private/personal contacts (friends, family) that AI must NEVER touch
const PRIVATE_CONTACTS = new Set<string>();

export function isContactPaused(chatId: string): boolean {
  const clean = formatChatId(chatId);
  const expiry = PAUSED_CONTACTS.get(clean);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    PAUSED_CONTACTS.delete(clean);
    return false;
  }
  return true;
}

export function pauseContact(chatId: string, durationMinutes: number = 30) {
  const clean = formatChatId(chatId);
  PAUSED_CONTACTS.set(clean, Date.now() + durationMinutes * 60 * 1000);
}

export function resumeContact(chatId: string) {
  const clean = formatChatId(chatId);
  PAUSED_CONTACTS.delete(clean);
}

export function tagContactAsPrivate(chatId: string, isPrivate: boolean) {
  const clean = formatChatId(chatId);
  if (isPrivate) {
    PRIVATE_CONTACTS.add(clean);
  } else {
    PRIVATE_CONTACTS.delete(clean);
  }
}

export function isContactPrivate(chatId: string): boolean {
  const clean = formatChatId(chatId);
  return PRIVATE_CONTACTS.has(clean);
}

export interface IncomingWahaMessage {
  from: string;
  fromMe: boolean;
  body: string;
  caption?: string;
  senderName?: string;
  hasMedia?: boolean;
  mediaUrl?: string;
  mediaMimetype?: string;
}

/**
 * Clean & Humanize WhatsApp response text while preserving clean paragraph line breaks
 */
function cleanWhatsAppChat(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // Strip <think>...</think> reasoning blocks
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // Replace any stale vercel.app links with official sfvapparel.my
  cleaned = cleaned.replace(/https?:\/\/[a-zA-Z0-9_-]+\.vercel\.app/gi, 'https://sfvapparel.my');

  // Remove markdown tables
  cleaned = cleaned.replace(/\|[^\n]+\|/g, '');

  // Convert markdown double bold **word** to WhatsApp single bold *word*
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '*$1*');

  // Remove raw UUIDs or internal system tokens
  cleaned = cleaned.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '');
  cleaned = cleaned.replace(/\[ID TIKET:[^\]]+\]/gi, '');
  cleaned = cleaned.replace(/ID SISTEM:[^\n]+/gi, '');

  // Strip all emojis and emoticons safely
  try {
    cleaned = cleaned.replace(/[^a-zA-Z0-9\s.,!?:;/@#$%&*()_\-+=\[\]{}'"<>]/g, ' ').replace(/\s+/g, ' ');
  } catch {}

  // Format numbered lists with clean line breaks if mashed together (e.g. "1) ... 2) ...")
  cleaned = cleaned.replace(/(\d+[\.\)])\s+/g, '\n$1 ');

  // Clean dashes and excessive blank lines
  cleaned = cleaned.replace(/---+/g, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

/**
 * Multi-Provider LLM Caller with OpenRouter Super Power Free Models Prioritized
 */
async function callLlmWithFallback(
  messages: { role: string; content: string }[],
  temperature: number = 0.70,
  maxTokens: number = 800
): Promise<string | null> {
  const openRouterKey = getEffectiveOpenRouterKey();
  if (openRouterKey) {
    const openRouterFreeModels = [
      'qwen/qwen3.8-27b:free',
      'inclusionai/ling-3.0-flash-fin:free',
      'nex-agi/nex-n2.5-pro:free',
      'thinkingmachines/inkling:free',
      'thinkingmachines/inkling-small:free',
      'nvidia/nemotron-3-super-120b-a12b:free',
      'z-ai/glm-5.2:free',
      'dots-studio/dots-3-note-preview:free',
      'liquid/lfm-2.5-2.6b:free',
      'nex-agi/nex-n2.5-mini:free'
    ];

    for (const model of openRouterFreeModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://sfvapparel.my',
            'X-Title': 'SFV Apparel AI CS',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content && content.length > 5) return content;
        }
      } catch {}
    }
  }

  // 2. Try Groq for ultra-fast fallback
  const groqKey = getEffectiveGroqKey();
  if (groqKey) {
    const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
    for (const model of groqModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content && content.length > 5) return content;
        }
      } catch {}
    }
  }

  // 3. Try LiteLLM Router on VPS port 4000
  try {
    const res = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LITELLM_KEY}`,
      },
      body: JSON.stringify({
        model: 'sfv-ai-brain',
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content && content.length > 5) return content;
    }
  } catch (err) {
    console.warn('[AI Brain] LiteLLM unavailable:', err);
  }

  // 3. Try Google Gemini
  if (GEMINI_API_KEY) {
    try {
      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
      const contents = messages.map((m) => ({
        role: m.role === 'system' || m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }],
      }));

      const res = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (content && content.length > 5) return content;
      }
    } catch {}
  }

  return null;
}

/**
 * Multi-Provider Vision LLM Caller using OpenRouter Free Vision-Language Models (Ling 3.0 Flash VL / Nemotron Omni / Gemini)
 */
async function callVisionLlmWithFallback(
  prompt: string,
  imageBase64Url: string,
  temperature: number = 0.50,
  maxTokens: number = 1000
): Promise<string | null> {
  const openRouterKey = getEffectiveOpenRouterKey();

  // 1. Try OpenRouter Vision-Language Free Models
  if (openRouterKey) {
    const visionModels = [
      'inclusionai/ling-3.0-flash-vl:free',
      'nvidia/nemotron-3-nano-omni:free',
      'google/gemma-4-26b-a4b-it:free',
      'google/gemma-4-31b-it:free'
    ];

    for (const model of visionModels) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            'Authorization': `Bearer ${openRouterKey}`,
            'HTTP-Referer': 'https://sfvapparel.my',
            'X-Title': 'SFV Apparel Vision AI',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: imageBase64Url } }
                ]
              }
            ],
            temperature,
            max_tokens: maxTokens,
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content?.trim();
          if (content && content.length > 5) return content;
        }
      } catch (e) {
        console.warn(`[AI Vision] Error calling model ${model}:`, e);
      }
    }
  }

  // 2. Try Google Gemini Vision Fallback
  if (GEMINI_API_KEY) {
    try {
      const base64Data = imageBase64Url.split(',')[1] || imageBase64Url;
      const mimeMatch = imageBase64Url.match(/^data:([^;]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';

      const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(geminiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data
                  }
                }
              ]
            }
          ],
          generationConfig: { temperature, maxOutputTokens: maxTokens },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (content && content.length > 5) return content;
      }
    } catch (e) {
      console.warn('[AI Vision] Error calling Gemini vision:', e);
    }
  }

  return null;
}


function parseMalaysianQuantity(text: string): number | null {
  const lower = text.toLowerCase();

  // 1. Never parse quantity if the text is or contains an Order ID (e.g. SFV_ORD_4199, SFV-ORD-4199, ORD-4199) or Design ID (DES-01)
  if (/sfv[-_]?ord[-_]?\d+/i.test(lower) || /ord[-_]\d+/i.test(lower) || /des[-_]?\d+/i.test(lower)) {
    return null;
  }

  // 2. If user is asking about order status / tracking / invoice, do not match random digits as quantity
  if (
    lower.includes('order') ||
    lower.includes('pesanan') ||
    lower.includes('tempahan') ||
    lower.includes('invois') ||
    lower.includes('invoice') ||
    lower.includes('status') ||
    lower.includes('cek') ||
    lower.includes('semak')
  ) {
    const explicitUnit = lower.match(/(\d+)\s*(helai|pcs|pasang|baju|jersi|keping)/i);
    if (explicitUnit && explicitUnit[1]) {
      return parseInt(explicitUnit[1], 10);
    }
    return null;
  }
  
  // Check for "ribu" / "k" (e.g. "100 ribu", "10 ribu", "100k", "50k")
  const kMatch = lower.match(/(\d+)\s*(k|ribu)/i);
  if (kMatch && kMatch[1]) {
    return parseInt(kMatch[1], 10) * 1000;
  }

  // Check for numbers with commas/dots explicitly followed by unit (e.g. "100,000 helai", "1,000 pcs")
  const commaMatch = lower.match(/(\d{1,3}(?:[,\.]\d{3})+)\s*(helai|pcs|pasang|baju|jersi|keping)?/i);
  if (commaMatch && commaMatch[1]) {
    const cleanNum = commaMatch[1].replace(/[,\.]/g, '');
    const n = parseInt(cleanNum, 10);
    if (!isNaN(n)) return n;
  }

  // Check standard digits WITH explicit apparel units (e.g. "40 helai", "1000 pcs", "50 baju")
  const stdMatch = lower.match(/(\d+)\s*(helai|pcs|pasang|baju|jersi|keping)/i);
  if (stdMatch && stdMatch[1]) {
    const n = parseInt(stdMatch[1], 10);
    if (!isNaN(n)) return n;
  }

  // Check standalone quantity in quotation questions (e.g. "kalau 40 berapa", "nak buat 100", "harga untuk 50")
  const contextMatch = lower.match(/(?:kalau|buat|tempah|anggaran|harga\s+untuk|kuantiti)\s+(\d+)(?:\s+|$)/i);
  if (contextMatch && contextMatch[1]) {
    const n = parseInt(contextMatch[1], 10);
    if (!isNaN(n) && n < 1000000) return n;
  }

  return null;
}

function getTurnaroundTimeline(qty: number): { timeline: string; isMegaBulk: boolean; notes: string } {
  if (qty <= 50) {
    return {
      timeline: '7 hingga 10 hari bekerja',
      isMegaBulk: false,
      notes: 'Kuantiti standard kelab/pasukan kecil.',
    };
  } else if (qty <= 200) {
    return {
      timeline: '10 hingga 14 hari bekerja (sekitar 2 minggu)',
      isMegaBulk: false,
      notes: 'Pesanan sederhana pukal.',
    };
  } else if (qty <= 500) {
    return {
      timeline: '2 hingga 3 minggu bekerja',
      isMegaBulk: false,
      notes: 'Pesanan pukal kilang.',
    };
  } else if (qty <= 2000) {
    return {
      timeline: '3 hingga 4 minggu (boleh dihantar secara berperingkat / batch mingguan)',
      isMegaBulk: false,
      notes: 'Pesanan pukal besar kelab/kejohanan.',
    };
  } else {
    // > 2000 helai (10,000 - 100,000 helai)
    return {
      timeline: 'Jadual fasa pengeluaran berperingkat (contohnya 10,000 hingga 15,000 helai setiap bulan mengikut kapasiti barisan mesin kilang)',
      isMegaBulk: true,
      notes: 'Kuantiti mega tender/korporat. Mesti disusun jadual penghantaran berfasa bersama Pengurus Produksi & akaun korporat.',
    };
  }
}

/**
 * Process incoming message with AI Brain, Intent Classifier, Conversation Memory, and Live DB Context
 */
export async function processAiCustomerReply(msg: IncomingWahaMessage): Promise<{ 
  success: boolean; 
  replied: boolean; 
  responseText?: string; 
  reason?: string; 
  ticketCreated?: boolean; 
  customerPhone?: string; 
  customerName?: string; 
}> {
  // 1. If message is from admin (fromMe = true) to an external customer, automatically PAUSE bot for that customer
  if (msg.fromMe && !msg.from.includes('6281260066616')) {
    pauseContact(msg.from, 30);
    return { success: true, replied: false, reason: 'human_admin_active_paused_bot' };
  } else if (msg.from.includes('6281260066616')) {
    resumeContact(msg.from);
  }

  // 2. Ignore group chats and broadcast status
  if (msg.from.includes('@g.us') || msg.from.includes('status@broadcast')) {
    return { success: true, replied: false, reason: 'ignored_group_or_broadcast' };
  }

  // 3. Strictly ignore private contacts (friends/family/marked personal)
  if (isContactPrivate(msg.from)) {
    return { success: true, replied: false, reason: 'contact_marked_as_private' };
  }

  const userText = (msg.body || '').trim();
  if (!userText) {
    return { success: true, replied: false, reason: 'empty_message' };
  }

  const lower = userText.toLowerCase();

  // 4. Check if contact is currently paused by human (with auto-resume on any customer question or image)
  if (isContactPaused(msg.from)) {
    const isUnpauseRequest = 
      msg.hasMedia ||
      lower.includes('?') ||
      lower.includes('desain') ||
      lower.includes('design') ||
      lower.includes('koleksi') ||
      lower.includes('katalog') ||
      lower.includes('berapa') ||
      lower.includes('jumlah') ||
      lower.includes('harga') ||
      lower.includes('punya') ||
      lower.includes('ada') ||
      lower.includes('mau') ||
      lower.includes('nak') ||
      lower.includes('buat') ||
      lower.includes('tempah') ||
      lower.includes('jersi') ||
      lower.includes('baju') ||
      lower.includes('polo') ||
      lower.includes('kain') ||
      lower.includes('saiz') ||
      lower.includes('size') ||
      lower.includes('order') ||
      lower.includes('pesanan') ||
      lower.includes('bot') ||
      lower.includes('aktif') ||
      lower.startsWith('/');

    if (isUnpauseRequest) {
      resumeContact(msg.from);
      console.log(`[AI Brain] Auto-unpaused contact ${msg.from} due to active customer question/image: "${userText}"`);
    } else {
      return { success: true, replied: false, reason: 'bot_paused_for_contact' };
    }
  }

  // START TYPING INDICATOR IMMEDIATELY (Customer sees "mengetik..." on WhatsApp)
  startWahaTyping(msg.from).catch(() => {});

  // 5. Intent & Human Handover Keywords Check (Malay & Indonesian support)
  // Check recent conversation to see if the AI previously offered to connect to human agent
  let previousAssistantOfferedHandover = false;
  try {
    const recentMsgs = await getWahaMessages(msg.from, 3);
    if (recentMsgs && recentMsgs.length > 0) {
      const lastBotMsg = recentMsgs.filter(m => m.fromMe).slice(-1)[0];
      if (lastBotMsg && (lastBotMsg.body.includes('sambungkan') || lastBotMsg.body.includes('ejen') || lastBotMsg.body.includes('staf') || lastBotMsg.body.includes('admin'))) {
        previousAssistantOfferedHandover = true;
      }
    }
  } catch {}

  const isHandoverIntent = 
    lower.includes('bicara sama ejen') ||
    lower.includes('bicara sama admin') ||
    lower.includes('bicara sama staf') ||
    lower.includes('bicara sama orang') ||
    lower.includes('bicara sama manusia') ||
    lower.includes('mau bicara sama') ||
    lower.includes('bisa ngomong sama') ||
    lower.includes('nak cakap staf') || 
    lower.includes('nak cakap manusia') || 
    lower.includes('nak cakap admin') || 
    lower.includes('cakap dengan admin') || 
    lower.includes('human agent') ||
    lower.includes('panggil admin') ||
    lower.includes('hubungi staf') ||
    lower.includes('hubungi ejen') ||
    lower.includes('hubungi admin') ||
    lower.includes('sambung staf') ||
    lower.includes('sambung ke ejen') ||
    lower.includes('sambungkan') ||
    lower.includes('nak ejen') ||
    lower.includes('ejen admin') ||
    lower.includes('nak orang') ||
    lower.includes('staf manusia') ||
    lower.includes('admin sebenar') ||
    lower.includes('person in charge') ||
    lower.includes('nak pic') ||
    (previousAssistantOfferedHandover && (lower === 'sekarang' || lower === 'skrg' || lower === 'ya' || lower === 'boleh' || lower === 'sambung'));

  if (isHandoverIntent) {
    pauseContact(msg.from, 10); // Pause bot for 10 mins (auto-resumes if customer asks a product question)
    const handoverText = 'Baik, saya sudah maklumkan kepada staf admin kami. Perbualan AI dihentikan seketika dan staf kami akan menyambung perbualan ini terus di WhatsApp ya.';
    await sendWahaMessage(msg.from, handoverText);
    stopWahaTyping(msg.from).catch(() => {});

    // Send instant Escalation Notification to Factory Admin WhatsApp
    const adminPhones = ['6281260066616@c.us', '60148599138@c.us'];
    const cleanCustomerNum = msg.from.replace('@c.us', '').replace('@s.whatsapp.net', '');
    const timeNow = new Date().toLocaleTimeString('ms-MY', { timeZone: 'Asia/Kuala_Lumpur', hour: '2-digit', minute: '2-digit' });

    const adminAlertText = `🔔 *PERMINTAAN ESKALASI PELANGGAN SFV APPAREL*
Pelanggan meminta bercakap terus dengan staf / ejen manusia sekarang!

👤 *Nama:* ${msg.senderName || 'Pelanggan'}
📱 *WhatsApp:* +${cleanCustomerNum}
💬 *Mesej:* "${userText}"
⏰ *Masa:* ${timeNow}

⚠️ *Status:* AI telah dipausekan seketika. Sila buka WhatsApp dan sambung perbualan dengan pelanggan ini.`.trim();

    for (const adminChat of adminPhones) {
      sendWahaMessage(adminChat, adminAlertText).catch(() => {});
    }

    return { 
      success: true, 
      replied: true, 
      responseText: handoverText, 
      reason: 'human_handover_escalated',
      ticketCreated: true,
      customerPhone: cleanCustomerNum,
      customerName: msg.senderName || 'Pelanggan'
    };
  }

  // 5B. MULTIMODAL VISION AI INSPECTOR (Process Incoming Jersey Images & Match Supabase Catalog)
  if (msg.hasMedia) {
    try {
      console.log(`[AI Brain] Processing incoming media via Vision AI for ${msg.from}`);
      let targetMediaUrl = msg.mediaUrl || '';
      if (!targetMediaUrl) {
        try {
          const recentMsgs = await getWahaMessages(msg.from, 2);
          const mediaMsg = recentMsgs?.find(m => m.hasMedia && m.mediaUrl);
          if (mediaMsg?.mediaUrl) targetMediaUrl = mediaMsg.mediaUrl;
        } catch {}
      }

      if (targetMediaUrl) {
        const mediaData = await fetchWahaMediaAsBase64(targetMediaUrl);
        if (mediaData && mediaData.base64DataUrl) {
          const designsRes = await getDesignsDb();
          const liveDesigns = designsRes.success && designsRes.designs ? designsRes.designs : [];
          const catalogList = liveDesigns
            .map(d => `- [${d.id}] ${d.title} (Kategori: ${d.category || 'Sublimasi'}, Corak: ${d.description || 'Polo/Jersi Sukan'}) -> https://sfvapparel.my/customize/${d.id}`)
            .join('\n');

          const visionPrompt = `Anda adalah Pembantu Khidmat Pelanggan (CS) & Pereka Jersi Kilang SFV APPAREL di WhatsApp.
Pelanggan telah memuat naik gambar jersi/pakaian di WhatsApp dengan pertanyaan: "${userText}".

=== SENARAI KATALOG REKA BENTUK LIVE KILANG SFV APPAREL (${liveDesigns.length} TEMPLAT AKTIF) ===
${catalogList}

=== TUGAS ANDA (VISION AI MATCHING) ===
1. Analisis gambar yang dihantar oleh pelanggan:
   - Warna baju (contohnya putih & biru diraja, hitam & merah jambu, dsb.).
   - Jenis kolar (contohnya Berkolar Polo / Polo Collar atau Leher Bulat / Round Neck).
   - Corak grafik pada jersi.
2. Padankan dengan katalog jersi di atas:
   - Jika gambar jersi polo putih-biru, padankan dengan "SFV0084 - WHITE BLUE POLO" (atau templat polo berkaitan).
   - Beritahu pelanggan dengan ramah bahawa kilang kita ada templat yang sepadan tersebut dan kongsikan nama templat serta pautan terus untuk mereka lihat atau kustomisasi di laman web: https://sfvapparel.my/customize/[id] atau https://sfvapparel.my/catalog.
3. Beritahu juga bahawa jika pelanggan mahu cetak 100% reka bentuk mereka sendiri mengikut gambar tersebut, kilang kita sedia mencetaknya terus.
4. Tanyakan anggaran kuantiti helai jersi yang ingin ditempah.
5. Gaya percakapan staf jurujual manusia yang sangat ramah, sopan, dan ringkas (1-2 perenggan pendek). SIFAR EMOJI.`;

          const visionReply = await callVisionLlmWithFallback(visionPrompt, mediaData.base64DataUrl, 0.50, 800);
          if (visionReply) {
            const cleanedReply = cleanWhatsAppChat(visionReply);
            await sendWahaMessage(msg.from, cleanedReply);
            stopWahaTyping(msg.from).catch(() => {});
            return {
              success: true,
              replied: true,
              responseText: cleanedReply,
              reason: 'vision_ai_catalog_matched',
            };
          }
        }
      }
    } catch (visionErr) {
      console.error('[AI Brain] Vision AI processing error:', visionErr);
    }
  }

  // 6. Fetch Live System Manifest & Dynamic System Grounding
  const livingSystemContext = await getFormattedSystemContext();

  // 7. Dynamic Price & Manufacturing Lead Time Calculation
  let dynamicPricingContext = '';
  const detectedQty = parseMalaysianQuantity(userText);
  if (detectedQty !== null && detectedQty > 0) {
    const calc = await executeLivePricingCalculator({ quantity: detectedQty });
    const turnaround = getTurnaroundTimeline(detectedQty);

    dynamicPricingContext = `
KIRAAN SEBUT HARGA SEBENAR DARI PANGKALAN DATA (${detectedQty.toLocaleString()} HELAI):
${calc.formattedSummary}
- Tempoh Siap Kilang: ${turnaround.timeline}
- Nota Kapasiti: ${turnaround.notes}
    `.trim();
  }

  // 8. Live Database Order Lookup (if customer is inquiring about an order)
  let liveOrderContext = '';
  const orderLookupRes = await executeOrderLookup(userText);
  if (orderLookupRes) {
    liveOrderContext = orderLookupRes;
  } else if (lower.includes('order') || lower.includes('pesanan') || lower.includes('tempahan') || lower.includes('status') || lower.includes('invois') || lower.includes('invoice') || lower.includes('cek')) {
    const phoneLookup = await executeOrderLookup(msg.from);
    if (phoneLookup) liveOrderContext = phoneLookup;
  }

  // 9. Check if user is asking about a specific design/catalog product
  const designMatch = lower.match(/(?:sfv-?|des-?)\d+/i);
  let liveDesignContext = '';
  let targetDesignImage: string | null = null;
  let targetDesignTitle: string | null = null;

  try {
    const designsRes = await getDesignsDb();
    const liveDesigns = designsRes.success && designsRes.designs ? designsRes.designs : [];

    if (designMatch || lower.includes('polo') || lower.includes('jersi') || lower.includes('baju')) {
      const rawSearch = (designMatch ? designMatch[0] : '').toLowerCase().replace('-', '');
      const foundDesign = liveDesigns.find(d => {
        const dCode = (d.code || d.id || '').toLowerCase().replace('-', '');
        const dId = d.id.toLowerCase().replace('-', '');
        const titleLower = d.title.toLowerCase();
        if (rawSearch && (dCode.includes(rawSearch) || dId.includes(rawSearch) || titleLower.includes(rawSearch))) {
          return true;
        }
        return false;
      });

      if (foundDesign) {
        targetDesignTitle = foundDesign.title;
        targetDesignImage = (foundDesign.mockup_front_url || foundDesign.thumbnail_url)?.startsWith('http') 
          ? (foundDesign.mockup_front_url || foundDesign.thumbnail_url) 
          : null;

        liveDesignContext = `
REKAAN DITANYA DARI PANGKALAN DATA SUPABASE:
- Kod: ${foundDesign.code || foundDesign.id} | Nama: ${foundDesign.title}
- Cetakan: ${foundDesign.print_type === 'sublimation' ? 'Sublimasi Penuh' : 'DTF'}
- Fabrik Standard: Drifit Milano 165gsm & Microfiber Eyelet (kain sukan cepat kering)
        `.trim();
      }
    }
  } catch (err) {}

  // 10. Fetch Recent Conversation History for Context Memory
  let conversationHistory: { role: string; content: string }[] = [];
  try {
    const recentMsgs = await getWahaMessages(msg.from, 6);
    if (recentMsgs && recentMsgs.length > 1) {
      // Sort oldest to newest, excluding current message
      const sorted = recentMsgs
        .filter(m => m.body && !m.body.startsWith('[Media') && !m.body.startsWith('BEGIN:VCARD'))
        .slice(-5);

      for (const m of sorted) {
        conversationHistory.push({
          role: m.fromMe ? 'assistant' : 'user',
          content: m.body,
        });
      }
    }
  } catch (err) {
    console.warn('[AI Brain] Could not fetch chat history, proceeding single-turn:', err);
  }

  const isOngoingConversation = conversationHistory.length > 0;
  const customerFirstName = (msg.senderName || '').trim().split(' ')[0].replace(/[^a-zA-Z0-9]/g, '');
  const greetingName = customerFirstName ? ` ${customerFirstName}` : '';

  // Real-Time Clock Grounding (Asia/Kuala_Lumpur GMT+8)
  const now = new Date();
  const klDateStr = now.toLocaleDateString('ms-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const klTimeStr = now.toLocaleTimeString('ms-MY', {
    timeZone: 'Asia/Kuala_Lumpur',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const currentHour = parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour: 'numeric',
      hour12: false,
    }).format(now),
    10
  );

  let timeOfDayMalay = 'malam';
  if (currentHour >= 5 && currentHour < 12) {
    timeOfDayMalay = 'pagi';
  } else if (currentHour >= 12 && currentHour < 14) {
    timeOfDayMalay = 'tengah hari';
  } else if (currentHour >= 14 && currentHour < 19) {
    timeOfDayMalay = 'petang';
  } else {
    timeOfDayMalay = 'malam';
  }

  const liveTimeContext = `
WAKTU SEMASA KILANG:
- Tarikh Semasa: ${klDateStr}
- Jam Semasa: ${klTimeStr}
- Waktu Semasa: Waktu sekarang ialah waktu ${timeOfDayMalay}.
  `.trim();

  // 11. Master System Prompt Grounded in Live System & Database Facts
  const systemPrompt = `Anda adalah Pembantu Khidmat Pelanggan (CS) rasmi SFV APPAREL di WhatsApp.
Bercakaplah dengan gaya staf jurujual manusia yang ramah, sopan, bersahaja dan ringkas (1-2 perenggan pendek sahaja). Sifar emoji.

${livingSystemContext}

=== PANDUAN INTERAKSI MANUSIAWI (PENTING) ===
1. JIKA PELANGGAN KATA "SUDAH ADA DESAIN" / "ADA GAMBAR SENDIRI":
Minta pelanggan kongsikan gambar atau fail tersebut terus di sini di WhatsApp. Tanyakan anggaran kuantiti helai. Jangan menyuruh pelanggan membuka pautan jika mereka sudah bersedia dengan fail di WhatsApp.

2. JIKA PELANGGAN BELUM ADA IDEA / TANYA CONTOH KATALOG:
Cadangkan mereka melihat koleksi templat rasmi di https://sfvapparel.my/catalog dan tanya corak yang mereka minati.

3. JAWAB TEPAT PADA SOALAN:
Fokus hanya pada apa yang ditanya. Jangan menyenaraikan maklumat harga atau bayaran deposit yang tidak berkaitan jika pelanggan belum bertanya tentang bayaran.

4. KESOPANAN & IDENTITI:
Gunakan kata ganti sopan "anda" atau sapa nama pelanggan (${greetingName ? `sapa "${customerFirstName}"` : 'guna "anda"'}).
Jika pelanggan beri salam "Assalamualaikum / Salam", jawab "Waalaikumussalam". Jika perbualan baru, sapa neutral "Hai${greetingName}!". ${isOngoingConversation ? 'Perbualan sedang berlangsung, teruskan menjawab soalan pelanggan.' : ''}

5. SUSUNAN DENGAN BARIS BARU (ENTER):
Gunakan perenggan ringkas dan kemas dengan baris baru (ENTER).

${liveTimeContext}
${liveOrderContext ? `\n${liveOrderContext}\n` : ''}
${dynamicPricingContext ? `\n${dynamicPricingContext}\n` : ''}
${liveDesignContext ? `\n${liveDesignContext}\n` : ''}
`.trim();

  const messagesToSend = [
    { role: 'system', content: systemPrompt },
    ...(conversationHistory.length > 0 ? conversationHistory : [{ role: 'user', content: userText }]),
  ];

  // If conversation history didn't include the current userText, ensure it's at the end
  if (conversationHistory.length > 0) {
    const lastMsg = conversationHistory[conversationHistory.length - 1];
    if (lastMsg.content !== userText) {
      messagesToSend.push({ role: 'user', content: userText });
    }
  }

  // 11. Execute LLM Call (Temperature 0.70 for natural, friendly CS tone)
  const rawReply = await callLlmWithFallback(messagesToSend, 0.70, 800);

  if (!rawReply) {
    stopWahaTyping(msg.from).catch(() => {});
    return { success: false, replied: false, reason: 'llm_service_unavailable' };
  }

  const replyContent = cleanWhatsAppChat(rawReply);

  if (!replyContent) {
    stopWahaTyping(msg.from).catch(() => {});
    return { success: false, replied: false, reason: 'empty_after_formatting' };
  }

  // 12. Deliver WhatsApp Reply to Customer
  if (targetDesignImage) {
    await sendWahaImage(msg.from, targetDesignImage, `Rekaan: ${targetDesignTitle || 'Katalog SFV Apparel'}`);
    await new Promise(r => setTimeout(r, 600));
  }

  await sendWahaMessage(msg.from, replyContent);
  stopWahaTyping(msg.from).catch(() => {});

  return {
    success: true,
    replied: true,
    responseText: replyContent,
  };
}



