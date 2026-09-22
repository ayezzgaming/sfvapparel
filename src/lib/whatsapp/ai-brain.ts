import { sendWahaMessage, sendWahaImage, formatChatId, getWahaMessages } from './waha-client';
import { getCmsDataDb } from '@/app/actions/cmsActions';
import { getDesignsDb } from '@/app/actions/designActions';
import { getMasterPricingDb } from '@/app/actions/pricingActions';
import { calculateSublimationPrice, formatCurrency } from '@/lib/pricing-calculator';
import { 
  CmsCompanySettings, 
  CmsService, 
  QuantityTierDiscount, 
  Design 
} from '@/types/database';
import { 
  INITIAL_CMS_COMPANY_SETTINGS, 
  INITIAL_CMS_SERVICES, 
  INITIAL_QUANTITY_TIERS,
  INITIAL_ORDERS,
  INITIAL_DESIGNS,
  INITIAL_FABRIC_MATERIALS,
  INITIAL_APPAREL_CUTS
} from '../store/seed-data';

const LITELLM_URL = process.env.LITELLM_API_URL || 'http://187.127.223.53:4000';
const LITELLM_KEY = process.env.LITELLM_API_KEY || 'sfv_litellm_master_2026';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
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
  senderName?: string;
}

/**
 * Clean & Humanize WhatsApp response text
 */
function cleanWhatsAppChat(text: string): string {
  if (!text) return '';
  let cleaned = text;

  // Remove markdown tables
  cleaned = cleaned.replace(/\|[^\n]+\|/g, '');

  // Convert markdown double bold **word** to WhatsApp single bold *word*
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '*$1*');

  // Remove raw UUIDs or internal system tokens
  cleaned = cleaned.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '');
  cleaned = cleaned.replace(/\[ID TIKET:[^\]]+\]/gi, '');
  cleaned = cleaned.replace(/ID SISTEM:[^\n]+/gi, '');

  // Strip all emojis and emoticons
  try {
    cleaned = cleaned.replace(new RegExp('[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]+|[\\u2600-\\u27BF]', 'g'), '');
  } catch {}

  // Clean multiple blank lines and dashes
  cleaned = cleaned.replace(/---+/g, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

/**
 * Multi-Provider LLM Caller with automatic fallback
 */
async function callLlmWithFallback(
  messages: { role: string; content: string }[],
  temperature: number = 0.35,
  maxTokens: number = 300
): Promise<string | null> {
  // 1. Try LiteLLM Router on VPS port 4000
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
    console.warn('[AI Brain] LiteLLM unavailable, falling back to Groq / Gemini:', err);
  }

  // 2. Try Groq (Llama 3.3 70B / Qwen)
  if (GROQ_API_KEY) {
    const groqModels = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b', 'openai/gpt-oss-20b'];
    for (const model of groqModels) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${GROQ_API_KEY}`,
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
 * Process incoming message with AI Brain, Intent Classifier, Conversation Memory, and Live DB Context
 */
export async function processAiCustomerReply(msg: IncomingWahaMessage): Promise<{ success: boolean; replied: boolean; responseText?: string; reason?: string }> {
  // 1. If message is from admin (fromMe = true), automatically PAUSE bot for this customer
  if (msg.fromMe) {
    pauseContact(msg.from, 30);
    return { success: true, replied: false, reason: 'human_admin_active_paused_bot' };
  }

  // 2. Ignore group chats and broadcast status
  if (msg.from.includes('@g.us') || msg.from.includes('status@broadcast')) {
    return { success: true, replied: false, reason: 'ignored_group_or_broadcast' };
  }

  // 3. Strictly ignore private contacts (friends/family/marked personal)
  if (isContactPrivate(msg.from)) {
    return { success: true, replied: false, reason: 'contact_marked_as_private' };
  }

  // 4. Check if contact is currently paused by human
  if (isContactPaused(msg.from)) {
    return { success: true, replied: false, reason: 'bot_paused_for_contact' };
  }

  const userText = (msg.body || '').trim();
  if (!userText) {
    return { success: true, replied: false, reason: 'empty_message' };
  }

  // 5. Intent & Human Handover Keywords Check
  const lower = userText.toLowerCase();
  if (
    lower.includes('nak cakap staf') || 
    lower.includes('nak cakap manusia') || 
    lower.includes('cakap dengan admin') || 
    lower.includes('human agent') ||
    lower.includes('panggil admin') ||
    lower.includes('hubungi staf')
  ) {
    pauseContact(msg.from, 60);
    const handoverText = 'Baik bang, mesej anda telah dimaklumkan kepada staf bertugas kilang kami. Staf kami akan menyambung perbualan sebentar lagi.';
    await sendWahaMessage(msg.from, handoverText);
    return { success: true, replied: true, responseText: handoverText, reason: 'human_handover_triggered' };
  }

  // 6. Fetch Live Database Context (with fallback to default seed data)
  let companySettings: Partial<CmsCompanySettings> = INITIAL_CMS_COMPANY_SETTINGS;
  let services: CmsService[] = INITIAL_CMS_SERVICES;
  let quantityTiers: QuantityTierDiscount[] = INITIAL_QUANTITY_TIERS;
  let designs: Design[] = INITIAL_DESIGNS;

  try {
    const [cmsRes, designsRes, pricingRes] = await Promise.allSettled([
      getCmsDataDb(),
      getDesignsDb(),
      getMasterPricingDb(),
    ]);

    if (cmsRes.status === 'fulfilled' && cmsRes.value.success && cmsRes.value.data) {
      if (cmsRes.value.data.companySettings) companySettings = cmsRes.value.data.companySettings;
      if (cmsRes.value.data.services?.length) services = cmsRes.value.data.services;
    }

    if (designsRes.status === 'fulfilled' && designsRes.value.success && designsRes.value.designs?.length) {
      designs = designsRes.value.designs;
    }

    if (pricingRes.status === 'fulfilled' && pricingRes.value.success && pricingRes.value.data?.tiers?.length) {
      quantityTiers = pricingRes.value.data.tiers;
    }
  } catch (err) {
    console.warn('[AI Brain] Fallback to seed data due to DB fetch error:', err);
  }

  // 7. Dynamic Price Calculation if quantity is mentioned in inquiry
  let dynamicPricingContext = '';
  const qtyMatch = userText.match(/(\d+)\s*(helai|pcs|pasang|baju|jersi)?/i);
  if (qtyMatch && qtyMatch[1]) {
    const qty = parseInt(qtyMatch[1], 10);
    if (qty > 0 && qty <= 5000) {
      const defaultFabric = INITIAL_FABRIC_MATERIALS[0];
      const defaultCut = INITIAL_APPAREL_CUTS[0];
      const quote = calculateSublimationPrice({
        fabric: defaultFabric,
        cut: defaultCut,
        quantity: qty,
        tiers: quantityTiers,
      });

      dynamicPricingContext = `
FAKTA KIRAAN HARGA TEPAT DARI PANGKALAN DATA (GUNAKAN INI BILA JAWAB HARGA):
- Kuantiti: ${qty} helai
- Harga Asal: ${formatCurrency(quote.rawUnitPrice)} sehelai
- Diskaun Diberi: ${quote.discountPercentage}% (Tier ${quote.tierLabel})
- Harga Tawaran Bersih: ${formatCurrency(quote.finalUnitPrice)} sehelai
- Jumlah Keseluruhan: ${formatCurrency(quote.finalTotal)}
- Deposit 50%: ${formatCurrency(Math.round(quote.finalTotal * 0.5 * 100) / 100)}
- Tempoh Siap: 7 hingga 10 hari bekerja
- Percuma: Cetakan nama, nombor pemain & logo pasukan.
      `.trim();
    }
  }

  // 8. Check if user is asking about a specific design/catalog product
  const designMatch = lower.match(/des-?[\w\d]+/i);
  let liveDesignContext = '';
  let targetDesignImage: string | null = null;
  let targetDesignTitle: string | null = null;

  if (designMatch) {
    const rawSearch = designMatch[0].toLowerCase().replace('-', '');
    const foundDesign = designs.find(d => {
      const dCode = (d.code || d.id || '').toLowerCase().replace('-', '');
      const dId = d.id.toLowerCase().replace('-', '');
      return dCode === rawSearch || dId === rawSearch || d.title.toLowerCase().includes(rawSearch);
    });

    if (foundDesign) {
      targetDesignTitle = foundDesign.title;
      targetDesignImage = (foundDesign.mockup_front_url || foundDesign.thumbnail_url)?.startsWith('http') 
        ? (foundDesign.mockup_front_url || foundDesign.thumbnail_url) 
        : null;

      liveDesignContext = `
REKAAN DITANYA:
- Kod: ${foundDesign.code || foundDesign.id} | Nama: ${foundDesign.title}
- Cetakan: ${foundDesign.print_type === 'sublimation' ? 'Sublimasi Penuh' : 'DTF'}
- Fabrik Standard: Drifit Milano 165gsm & Microfiber Eyelet (kain sukan cepat kering)
      `.trim();
    }
  }

  // 9. Fetch Recent Conversation History for Context Memory
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

  // 10. Master System Prompt (Human Persona, Few-Shot Training, Strict Concise Guardrails)
  const systemPrompt = `Anda adalah Pegawai Khidmat Pelanggan Kilang Jersi SFV APPAREL (Malaysia) di WhatsApp.
Bercakaplah seperti staf manusia sebenar di WhatsApp: ringkas, padat, mesra santai, dan terus menjawab soalan dalam 2 hingga 3 ayat sahaja. Sifar emoji.

=== PERATURAN MUTLAK GAYA BAHASA WHATSAPP ===
1. JAWAP HANYA APA YANG DITANYA: Jangan buat karangan panjang, jangan beri senarai berbutir panjang melainkan diminta, dan jangan buat jadual.
2. JANGAN DUMP MAKLUMAT SYARIKAT: Jangan sebut nombor pendaftaran syarikat, alamat penuh, atau waktu operasi melainkan pelanggan bertanya secara khusus.
3. NADA PERBUALAN NATURAL: Gunakan Bahasa Melayu santai yang biasa digunakan di WhatsApp perniagaan Malaysia (contoh: "Salam bang...", "Boleh bang, untuk...", "Ada contoh design?").
4. SIFAR EMOJI & EMOTIKON: Dilarang sama sekali meletakkan emoji dalam sebarang respons.
5. FORMAT TEKS: Untuk tulisan tebal, guna 1 tanda bintang sahaja seperti *teks* atau *RM28.00*. Jangan guna **.
6. JANGAN SEBUT ID SISTEM: Jangan sebut kod UUID, perkataan bot/AI, atau istilah teknikal sistem.

=== CONTOH DIALOG MANUSIAWI (FEW-SHOT TRAINING) ===
Pelanggan: "Berapa harga 30 helai jersi?"
Jawapan: "Salam bang, untuk 30 helai jersi sublimasi penuh siap cetak nama/nombor/logo, harga kilang kami RM28.00 sehelai (diskaun 15%). Abang dah ada contoh design ke?"

Pelanggan: "Ada kain apa ya?"
Jawapan: "Kami guna kain Drifit Milano 165gsm (sejuk cepat kering) dan Microfiber Eyelet. Sangat sesuai dan selesa untuk sukan atau jersi pasukan."

Pelanggan: "Berapa lama siap?"
Jawapan: "Tempoh siap biasanya 7 ke 10 hari bekerja selepas confirm design dan bayaran deposit 50% bang."

Pelanggan: "Boleh buat kolar tak?"
Jawapan: "Boleh bang, kami ada pilihan Roundneck, Kolar Polo (+RM3), V-Neck, dan Raglan. Abang nak guna kolar jenis mana?"

Pelanggan: "Minima order berapa helai?"
Jawapan: "Minima tempahan serendah 10 helai sahaja bang, dan kami sediakan servis percuma untuk masukkan nama, nombor dan logo pasukan."

=== DATA RUJUKAN KILANG ===
Nama Jenama: ${companySettings.brand_name || 'SFV APPAREL'} (Pakar Jersi Sublimasi & Cetakan DTF)
Website 3D Customizer: ${companySettings.website_url || 'https://sfvapparel.vercel.app/customize'}

${dynamicPricingContext}
${liveDesignContext}
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

  // 11. Execute LLM Call
  const rawReply = await callLlmWithFallback(messagesToSend, 0.35, 250);

  if (!rawReply) {
    return { success: false, replied: false, reason: 'llm_service_unavailable' };
  }

  const replyContent = cleanWhatsAppChat(rawReply);

  if (!replyContent) {
    return { success: false, replied: false, reason: 'empty_after_formatting' };
  }

  // 12. Deliver WhatsApp Reply to Customer
  if (targetDesignImage) {
    await sendWahaImage(msg.from, targetDesignImage, `Rekaan: ${targetDesignTitle || 'Katalog SFV Apparel'}`);
    await new Promise(r => setTimeout(r, 600));
  }

  await sendWahaMessage(msg.from, replyContent);

  return {
    success: true,
    replied: true,
    responseText: replyContent,
  };
}


