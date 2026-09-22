import { sendWahaMessage, sendWahaImage, formatChatId, getWahaMessages, startWahaTyping, stopWahaTyping } from './waha-client';
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
 * Clean & Humanize WhatsApp response text while preserving clean paragraph line breaks
 */
function cleanWhatsAppChat(text: string): string {
  if (!text) return '';
  let cleaned = text;

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

  // Strip all emojis and emoticons
  try {
    cleaned = cleaned.replace(new RegExp('[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]+|[\\u2600-\\u27BF]', 'g'), '');
  } catch {}

  // Format numbered lists with clean line breaks if mashed together (e.g. "1) ... 2) ...")
  cleaned = cleaned.replace(/(\d+[\.\)])\s+/g, '\n$1 ');

  // Clean dashes and excessive blank lines
  cleaned = cleaned.replace(/---+/g, '');
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

  return cleaned;
}

/**
 * Multi-Provider LLM Caller with ultra-fast Groq prioritized
 */
async function callLlmWithFallback(
  messages: { role: string; content: string }[],
  temperature: number = 0.35,
  maxTokens: number = 350
): Promise<string | null> {
  // 1. Try Groq first for ultra-fast <800ms inference
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

  // 2. Try LiteLLM Router on VPS port 4000
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

function parseMalaysianQuantity(text: string): number | null {
  const lower = text.toLowerCase();
  
  // Check for "ribu" / "k" (e.g. "100 ribu", "10 ribu", "100k", "50k")
  const kMatch = lower.match(/(\d+)\s*(k|ribu)/i);
  if (kMatch && kMatch[1]) {
    return parseInt(kMatch[1], 10) * 1000;
  }

  // Check for numbers with commas/dots (e.g. "100,000", "1.000")
  const commaMatch = lower.match(/(\d{1,3}(?:[,\.]\d{3})+)/);
  if (commaMatch && commaMatch[1]) {
    const cleanNum = commaMatch[1].replace(/[,\.]/g, '');
    const n = parseInt(cleanNum, 10);
    if (!isNaN(n)) return n;
  }

  // Check standard digits (e.g. "40 helai", "1000 pcs")
  const stdMatch = lower.match(/(\d+)\s*(helai|pcs|pasang|baju|jersi|keping)?/i);
  if (stdMatch && stdMatch[1]) {
    const n = parseInt(stdMatch[1], 10);
    if (!isNaN(n)) return n;
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

  // START TYPING INDICATOR IMMEDIATELY (Customer sees "mengetik..." on WhatsApp)
  startWahaTyping(msg.from).catch(() => {});

  // 5. Intent & Human Handover Keywords Check
  const lower = userText.toLowerCase();
  if (
    lower.includes('nak cakap staf') || 
    lower.includes('nak cakap manusia') || 
    lower.includes('cakap dengan admin') || 
    lower.includes('human agent') ||
    lower.includes('panggil admin') ||
    lower.includes('hubungi staf') ||
    lower.includes('nak orang') ||
    lower.includes('staf manusia') ||
    lower.includes('admin sebenar') ||
    lower.includes('sambung staf') ||
    lower.includes('person in charge') ||
    lower.includes('nak pic')
  ) {
    pauseContact(msg.from, 60);
    const handoverText = 'Baik bang, mesej anda telah dimaklumkan kepada staf bertugas kilang kami. Staf manusia kami akan menyambung perbualan sebentar lagi.';
    await sendWahaMessage(msg.from, handoverText);
    stopWahaTyping(msg.from).catch(() => {});
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

  // 7. Dynamic Price & Manufacturing Lead Time Calculation
  let dynamicPricingContext = '';
  const detectedQty = parseMalaysianQuantity(userText);
  if (detectedQty !== null && detectedQty > 0) {
    const defaultFabric = INITIAL_FABRIC_MATERIALS[0];
    const defaultCut = INITIAL_APPAREL_CUTS[0];
    const quote = calculateSublimationPrice({
      fabric: defaultFabric,
      cut: defaultCut,
      quantity: Math.min(detectedQty, 5000),
      tiers: quantityTiers,
    });

    const turnaround = getTurnaroundTimeline(detectedQty);

    dynamicPricingContext = `
FAKTA KIRAAN PENGELUARAN KILANG (GUNAKAN INI BILA JAWAB KUANTITI ${detectedQty.toLocaleString()} HELAI):
- Kuantiti Ditanya: ${detectedQty.toLocaleString()} helai
- TEMPOH SIAP KILANG LOGIK: ${turnaround.timeline}
- Nota Kapasiti: ${turnaround.notes}
- Harga Asal: ${formatCurrency(quote.rawUnitPrice)} sehelai
- Diskaun Diberi: ${quote.discountPercentage}% (Tier ${quote.tierLabel})
- Harga Bersih Sehelai: ${formatCurrency(quote.finalUnitPrice)}
- Anggaran Jumlah: ${formatCurrency(quote.finalUnitPrice * detectedQty)}
- Percuma: Cetakan nama, nombor pemain & logo pasukan.
    `.trim();
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

  const isOngoingConversation = conversationHistory.length > 0;

  // 10. Master System Prompt (Human Persona, Few-Shot Training, Strict Spacing & Greeting Rules)
  const systemPrompt = `Anda adalah Pembantu Khidmat Pelanggan Pintar (AI Digital Assistant) rasmi bagi Kilang Jersi SFV APPAREL (Malaysia) di WhatsApp.
Bercakaplah dengan nada mesra, bersahaja, santai seperti staf kilang tempatan (2-3 ayat sahaja). Sifar emoji.

=== PANDUAN PAUTAN RASMI LAMAN WEB SFV APPAREL (GUNAKAN DENGAN TEPAT) ===
- Katalog & Koleksi Templat Rekaan: https://sfvapparel.my/catalog
- 3D Customizer / Studio Tempahan: https://sfvapparel.my/customize
- Semak Status Pesanan & Invois: https://sfvapparel.my/history
- Laman Utama Rasmi: https://sfvapparel.my

=== PERATURAN MUTLAK GAYA BAHASA & FORMAT WHATSAPP ===
1. ${isOngoingConversation ? 'PERBUALAN INI SUDAH BERLANGSUNG: DILARANG mengucap "Salam", "Salam bang", "Hai", atau membuat pembukaan sapaan lagi. Terus jawab soalan pelanggan secara langsung.' : 'PERBUALAN BARU: Mulakan dengan sapaan ringkas seperti "Salam bang!" atau "Hai bang!"'}
2. IDENTITI BOT / AI: Jika pelanggan tanya adakah anda bot / robot / AI, JAWAB DENGAN JUJUR & MESRA. Jangan berbohong kata anda manusia 100%, tapi jangan jawab kaku seperti robot! Nyatakan anda adalah pembantu AI digital kilang yang membantu menjawab pantas info harga, katalog & status tempahan, dan tawarkan sambungan ke staf manusia jika mereka perlukan.
3. WAKTU OPERASI: Gunakan sebutan masa yang mesra (contoh: "9.00 pagi - 6.00 petang", jangan guna format jam mesin seperti "9.00-18.00"). Hari Ahad & cuti umum kilang tutup.
4. SOALAN LOKASI / ALAMAT: Jika pelanggan tanya LOKASI KILANG atau ALAMAT PERNIAGAAN, BERIKAN ALAMAT PENUH DI KAJANG SECARA TERUS DAN TEPAT dengan baris baru (ENTER). DILARANG MENYURUH PELANGGAN CARI SENDIRI DI WEBSITE!
5. PAUTAN TEPAT: Bila pelanggan tanya pasal TEMPLAT / CONTOH DESIGN / KATALOG, beri link https://sfvapparel.my/catalog. Bila pelanggan tanya nak TEMPAH / CUSTOMIZE, beri link https://sfvapparel.my/customize. Dilarang mereka-reka link lain!
6. SUSUNAN DENGAN BARIS BARU (ENTER): Jika memberikan langkah atau senarai, gunakan baris baru (ENTER) untuk setiap poin. DILARANG menggabungkan langkah dalam satu baris bersambung!
7. SIFAR EMOJI & EMOTIKON: Dilarang sama sekali meletakkan emoji atau emotikon.
8. FORMAT TEKS: Untuk tulisan tebal, guna 1 tanda bintang sahaja seperti *teks* atau *RM28.00*. Jangan guna **.

=== CONTOH DIALOG MANUSIAWI (FEW-SHOT TRAINING) ===
Pelanggan: "Apakah hari minggu buka"
Jawapan: "Hari Ahad kilang kami tutup bang. Kami beroperasi Isnin hingga Jumaat (9.00 pagi - 6.00 petang) dan Sabtu (9.00 pagi - 1.00 tengah hari).

Abang nak singgah kilang atau ada tempahan nak dibincangkan?"

Pelanggan: "Apakah ini bot ?"
Jawapan: "Betul bang, saya pembantu digital AI SFV APPAREL. Saya di sini untuk bantu jawab soalan pantas berkaitan harga, templat rekaan & info kilang 24 jam.

Kalau abang nak bercakap terus dengan staf admin manusia kami, beritahu je ya nanti saya sambungkan!"

Pelanggan: "Dimana lokasi kilang ?"
Jawapan: "Kilang kami beroperasi di Kajang, Selangor bang:

*SFV APPAREL*
No 28-1, Jalan Prima Saujana 2/D, Taman Prima Saujana, 43000 Kajang, Selangor.

Waktu operasi kami Isnin hingga Jumaat (9.00 pagi - 6.00 petang) dan Sabtu (9.00 pagi - 1.00 tengah hari). Abang nak datang bincang tempahan atau nak kami poskan sampel?"

Pelanggan: "dimana alamat bisnis ?"
Jawapan: "Alamat kilang dan premis operasi kami di:

*SFV APPAREL*
No 28-1, Jalan Prima Saujana 2/D, Taman Prima Saujana, 43000 Kajang, Selangor.

Ada sebarang tempahan jersi atau baju yang boleh kami bantu bang?"

Pelanggan: "Saya belum ada template bagaimana saya melihat template ?"
Jawapan: "Abang boleh tengok ratusan templat rekaan jersi sedia ada di katalog rasmi kami di sini:

https://sfvapparel.my/catalog

Dalam katalog tu abang boleh pilih corak sukan, e-sport, atau korporat. Ada corak yang abang dah target ke?"

Pelanggan: "macam mana nak tempah kat web tu"
Jawapan: "Langkah tempahan mudah je bang:

1. Layari https://sfvapparel.my/customize
2. Pilih corak jersi, jenis kolar & fabrik
3. Masukkan kuantiti & teruskan ke checkout deposit 50%

Atau kalau abang nak kami bantu buatkan order terus di WhatsApp pun boleh!"

Pelanggan: "Berapa harga baju"
Jawapan: "Harga jersi sublimasi penuh kilang kami bermula dari *RM28.00* sehelai siap percuma cetak nama, nombor & logo (untuk kuantiti 30 helai ke atas).

Abang nak buat anggaran untuk berapa helai ya?"

Pelanggan: "Kalau 40 helai berapa lama siap ?"
Jawapan: "Untuk 40 helai, tempoh siap standard sekitar *7 hingga 10 hari bekerja* selepas confirm design dan bayar deposit 50% bang."

Pelanggan: "kalau 1000 pcs berapa hari ?"
Jawapan: "Untuk tempahan pukal 1,000 helai, anggaran siap sekitar *3 ke 4 minggu bekerja* bang. Kami juga boleh sediakan penghantaran berperingkat (batch mingguan) jika abang perlukan sebahagian awal."

Pelanggan: "Kalau 100 ribu pcs ?"
Jawapan: "Untuk kuantiti mega 100,000 helai, pengeluaran dibuat secara berperingkat (biasanya batch 10,000 ke 15,000 helai setiap bulan mengikut barisan mesin kilang).

Untuk kuantiti tender korporat seperti ini, saya boleh sambungkan abang terus kepada Pengurus Produksi kami untuk jadual rasmi dan kontrak harga khas. Ada nama syarikat atau persatuan abang?"

Pelanggan: "Ada kain apa ya?"
Jawapan: "Kami guna kain Drifit Milano 165gsm (sejuk cepat kering) dan Microfiber Eyelet. Sangat selesa untuk sukan atau jersi skuad.

Abang nak buat baju untuk sukan apa ya?"

Pelanggan: "Boleh buat kolar tak?"
Jawapan: "Boleh bang, ada pilihan Roundneck biasa, Kolar Polo (+RM3), V-Neck, dan Raglan. Abang nak pakai jenis kolar mana?"

=== DATA RUJUKAN KILANG ===
Nama Jenama: ${companySettings.brand_name || 'SFV APPAREL'} (Pakar Jersi Sublimasi Penuh & Cetakan DTF)
Alamat Kilang: ${companySettings.address || 'No 28-1, Jalan Prima Saujana 2/D, Taman Prima Saujana, 43000 Kajang, Selangor, Malaysia'}
Waktu Operasi: ${companySettings.working_hours || 'Isnin - Jumaat: 9.00 AM - 6.00 PM | Sabtu: 9.00 AM - 1.00 PM | Ahad & Cuti Umum: Tutup'}
Kawasan Liputan: Kajang, Selangor (Khidmat pos ke seluruh Semenanjung, Sabah, Sarawak & Singapura)
Website Rasmi: https://sfvapparel.my
Katalog Rekaan: https://sfvapparel.my/catalog
Website 3D Customizer: https://sfvapparel.my/customize


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
  const rawReply = await callLlmWithFallback(messagesToSend, 0.35, 300);

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



