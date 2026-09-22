import { sendWahaMessage, sendWahaImage, formatChatId, getWahaMessages, startWahaTyping, stopWahaTyping } from './waha-client';
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
  maxTokens: number = 800
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

  // 5. Intent & Human Handover Keywords Check (Malay & Indonesian support)
  const lower = userText.toLowerCase();

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
    pauseContact(msg.from, 120); // Pause bot for 2 hours
    const handoverText = 'Baik bang, saya dah maklumkan kepada staf admin kami sekarang. Perbualan AI dihentikan seketika dan staf manusia kami akan sambung perbualan ini terus di WhatsApp ya.';
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

⚠️ *Status:* AI telah dipausekan secara automatik selama 2 jam. Sila buka WhatsApp dan sambung perbualan dengan pelanggan ini.`.trim();

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

  // 8. Check if user is asking about Order Status (by Order Number or Customer Phone)
  let liveOrderContext = '';
  let foundOrder: Order | null = null;

  const orderNumMatch = lower.match(/sfv[-_]?ord[-_]?\d+|ord[-_]?\d+|sfv[-_]?\d{4,}/i);
  if (orderNumMatch) {
    const rawMatched = orderNumMatch[0].toUpperCase().replace(/_/g, '-');
    const normalizedOrderNum = rawMatched.startsWith('ORD-') ? `SFV-${rawMatched}` : rawMatched;
    const digitsMatch = rawMatched.match(/\d+/);
    const digits = digitsMatch ? digitsMatch[0] : '';

    try {
      const res = await getCustomerOrdersDb(normalizedOrderNum);
      if (res.success && res.orders && res.orders.length > 0) {
        foundOrder = res.orders[0];
      } else if (digits) {
        const fallbackRes = await getCustomerOrdersDb(digits);
        if (fallbackRes.success && fallbackRes.orders && fallbackRes.orders.length > 0) {
          foundOrder = fallbackRes.orders.find(o => o.order_number.includes(digits)) || fallbackRes.orders[0];
        }
      }
    } catch (err) {
      console.warn('[AI Brain] Order DB lookup error:', err);
    }

    if (!foundOrder) {
      foundOrder = INITIAL_ORDERS.find(o => 
        o.order_number.toUpperCase().replace(/_/g, '-') === normalizedOrderNum ||
        (digits && o.order_number.includes(digits))
      ) || null;
    }
  }

  // If order not found by ID yet, check by customer WhatsApp phone if asking about order
  if (!foundOrder && (lower.includes('order') || lower.includes('pesanan') || lower.includes('tempahan') || lower.includes('status') || lower.includes('invois') || lower.includes('invoice') || lower.includes('cek'))) {
    try {
      const phoneRes = await getCustomerOrdersDb(msg.from);
      if (phoneRes.success && phoneRes.orders && phoneRes.orders.length > 0) {
        foundOrder = phoneRes.orders[0];
      }
    } catch (err) {}

    if (!foundOrder) {
      const cleanFrom = msg.from.replace(/\D/g, '');
      foundOrder = INITIAL_ORDERS.find(o => o.customer_phone.replace(/\D/g, '').includes(cleanFrom.slice(-7))) || null;
    }
  }

  if (foundOrder) {
    const statusLabels: Record<string, string> = {
      pending_proof: 'Menunggu Pengesahan Proof Mockup (Design sedia disemak pelanggan)',
      proof_approved: 'Proof Mockup Telah Diluluskan (Sedia masuk giliran cetakan)',
      printing: 'Sedang Dicetak (Fasa cetakan sublimasi kilang)',
      heat_press: 'Sedang Heat Press (Pindahan haba ke kain jersi)',
      sewing: 'Sedang Dijahit (Proses cantuman & jahitan)',
      qc_check: 'Pemeriksaan Kualiti / QC (Semakan kualiti akhir)',
      ready_to_ship: 'Sedia Untuk Dipos / Dihantar',
      delivered: 'Pesanan Telah Dihantar / Selesai',
      cancelled: 'Pesanan Dibatalkan',
    };

    const paymentLabels: Record<string, string> = {
      unpaid: 'Menunggu Bayaran Deposit 50%',
      deposit_paid: 'Deposit 50% Telah Diterima (Baki 50% belum dibayar)',
      paid: 'Telah Dibayar Penuh (Lunas)',
    };

    const sizingSummary = Object.entries(foundOrder.sizing_breakdown || {})
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([size, qty]) => `${size}:${qty}`)
      .join(', ');

    const depositVal = Number(foundOrder.deposit_amount || foundOrder.total_amount * 0.5);
    const balanceVal = Number(foundOrder.balance_amount || foundOrder.total_amount * 0.5);

    liveOrderContext = `
=== MAKLUMAT STATUS PESANAN PELANGGAN DI DALAM PANGKALAN DATA (WAJIB GUNAKAN MAKLUMAT INI) ===
- No Pesanan: #${foundOrder.order_number}
- Nama Pelanggan: ${foundOrder.customer_name || 'Pelanggan'}
- Rekaan: ${foundOrder.design_title || 'Custom Jersey'}
- Jumlah Kuantiti: ${foundOrder.total_quantity} helai ${sizingSummary ? `(Pecahan Saiz: ${sizingSummary})` : ''}
- Jumlah Nilai Pesanan: RM ${Number(foundOrder.total_amount).toFixed(2)}
- Deposit 50%: RM ${depositVal.toFixed(2)} (${paymentLabels[foundOrder.payment_status || 'unpaid'] || foundOrder.payment_status})
- Baki 50%: RM ${balanceVal.toFixed(2)}
- Status Pengeluaran Kilang Semasa: ${statusLabels[foundOrder.status] || foundOrder.status}
- Tracking Kurier: ${foundOrder.tracking_number ? `${foundOrder.shipping_courier || 'Kurier'}: ${foundOrder.tracking_number}` : 'Belum dikeluarkan (pesanan masih dalam fasa pengeluaran)'}
- Pautan Semak Butiran & Invois: https://sfvapparel.my/history
    `.trim();
  }

  // 9. Check if user is asking about a specific design/catalog product
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

  // 11. Master System Prompt (Professional Malaysian Apparel CS Standard)
  const systemPrompt = `Anda adalah Pembantu Khidmat Pelanggan Pintar (AI Customer Assistant) rasmi bagi Kilang Jersi & Pakaian SFV APPAREL (Malaysia) di WhatsApp.
Bercakaplah dengan gaya staf jurujual khidmat pelanggan Malaysia yang mesra, efisien, profesional dan bersahaja (2-3 ayat sahaja). Sifar emoji.

=== PANDUAN PAUTAN RASMI LAMAN WEB SFV APPAREL (GUNAKAN DENGAN TEPAT) ===
- Katalog & Koleksi Templat Rekaan: https://sfvapparel.my/catalog
- 3D Customizer / Studio Tempahan: https://sfvapparel.my/customize
- Semak Status Pesanan & Invois: https://sfvapparel.my/history
- Laman Utama Rasmi: https://sfvapparel.my

=== PERATURAN MUTLAK GAYA BAHASA CS MALAYSIA ===
1. TIADA ANDAIAN JANTINA (NO GENDER ASSUMPTION): DILARANG menggunakan panggilan "bang", "bro", "kak", atau "sis" secara andaian! Jika ada nama WhatsApp pelanggan (${greetingName ? `sapa "${customerFirstName}"` : 'guna "anda"'}), gunakan nama mereka atau kata ganti sopan "anda".
2. SAPAAN & AGAMA (MIRRORING SAHAJA): DILARANG memulakan sapaan berunsur agama (seperti "Assalamualaikum") secara mandiri kerana pelanggan Malaysia terdiri daripada pelbagai kaum dan agama.
- Jika pelanggan beri salam "Assalamualaikum / Salam", jawab "Waalaikumussalam".
- Jika perbualan baru, sapa secara neutral: "Hai${greetingName}!" atau "Selamat ${timeOfDayMalay}${greetingName}!".
- ${isOngoingConversation ? 'PERBUALAN INI SUDAH BERLANGSUNG: DILARANG mengulang sapaan pembukaan, terus jawab soalan pelanggan.' : ''}
3. DILARANG MENGULANG FRASA KLISÉ: JANGAN sesekali mengulang frasa "selepas confirm design dan deposit 50% dibayar" dalam setiap jawapan jika tidak ditanya syarat bayaran!
4. SOALAN KELAJUAN / ANTRIAN / URGENT ORDER (3 HARI): Nyatakan kilang ada slot "Rush Order" tertakluk kepada kekosongan barisan mesin dan tanya kuantiti serta kesediaan fail rekaan.
5. MAKLUMAT STATUS PESANAN PELANGGAN (PENTING):
- Jika maklumat pesanan pelanggan ditemui dalam blok pangkalan data (rujuk "MAKLUMAT STATUS PESANAN PELANGGAN"), WAJIB GUNAKAN MAKLUMAT SEBENAR ITU!
- Nyatakan No Pesanan (#SFV-ORD-XXXX), Nama rekaan, Kuantiti sebenar, Nilai jumlah pesanan, Status deposit/bayaran, dan Status pengeluaran kilang semasa.
- DILARANG SAMA SEKALI mengira semula sebut harga baru atau menganggap nombor pesanan sebagai kuantiti helai baju!
6. WAKTU & MASA SEMASA: Gunakan data waktu semasa kilang (${timeOfDayMalay}, ${klTimeStr}, ${klDateStr}).
7. WAKTU OPERASI: Isnin - Jumaat (9.00 pagi - 6.00 petang) dan Sabtu (9.00 pagi - 1.00 tengah hari). Hari Ahad & cuti umum kilang tutup.
8. SOALAN LOKASI / ALAMAT: Berikan alamat penuh kilang di Kajang secara terus dan tepat dengan baris baru (ENTER).
9. PAUTAN TEPAT: Berikan link rasmi https://sfvapparel.my/catalog untuk katalog, https://sfvapparel.my/customize untuk customizer, dan https://sfvapparel.my/history untuk semakan status.
10. SUSUNAN DENGAN BARIS BARU (ENTER): Gunakan baris baru (ENTER) untuk setiap poin penting.
11. SIFAR EMOJI & EMOTIKON: Dilarang sama sekali meletakkan emoji atau emotikon.
12. FORMAT TEKS: Untuk tulisan tebal, guna 1 tanda bintang sahaja seperti *teks* atau *RM28.00*. Jangan guna **.

=== CONTOH DIALOG KHIDMAT PELANGGAN INDUSTRI PAKAIAN MALAYSIA (CORPUS DATASET) ===
Pelanggan: "Berapa banyak antrian masa saat ini? Takut x siap 3 hari"
Jawapan: "Untuk tempahan segera 3 hari, kilang kami ada slot *Rush Order* bergantung kepada jumlah kuantiti dan barisan cetakan sedia ada.

Boleh saya tahu anda merancang untuk buat berapa helai dan adakah fail rekaan sudah siap? Kami boleh terus semakkan kekosongan slot ekspres sekarang."

Pelanggan: "Berapa harga jersi sehelai?"
Jawapan: "Harga jersi sublimasi penuh kilang kami bermula dari *RM28.00* sehelai siap percuma cetakan nama, nombor & logo untuk kuantiti 30 helai ke atas.

Boleh kami tahu anda merancang untuk buat anggaran berapa helai ya?"

Pelanggan: "Kalau 40 helai berapa lama siap ?"
Jawapan: "Untuk tempahan 40 helai, tempoh siap kilang biasanya sekitar *7 hingga 10 hari bekerja*. Jika ada tarikh acara khusus, kami boleh bantu susun jadual produksi."

Pelanggan: "Kain jersi ni jenis macam mana?"
Jawapan: "Fabrik standard kami menggunakan *Drifit Milano 165gsm* dan *Microfiber Eyelet*. Kedua-duanya jenis kain sukan berliang mikro yang sejuk, cepat kering, dan sangat selesa dipakai bersukan di cuaca panas.

Anda berminat untuk buat baju bagi aktiviti atau sukan apa ya?"

Pelanggan: "Boleh buat kolar tak?"
Jawapan: "Boleh, kami menyediakan pilihan *Roundneck* (leher bulat biasa), *Kolar Polo* (+RM3), *V-Neck*, dan *Raglan*. Anda lebih berminat dengan gaya kolar yang mana?"

Pelanggan: "Saya belum ada template bagaimana saya melihat template ?"
Jawapan: "Anda boleh lihat ratusan templat rekaan jersi sedia ada di katalog rasmi kami di sini:

https://sfvapparel.my/catalog

Dalam katalog tersebut anda boleh pilih corak sukan, e-sport, atau korporat. Ada corak yang anda sudah target?"

Pelanggan: "macam mana nak tempah kat web tu"
Jawapan: "Langkah tempahan mudah sahaja:

1. Layari https://sfvapparel.my/customize
2. Pilih corak jersi, jenis kolar & fabrik
3. Masukkan kuantiti & teruskan tempahan

Atau jika anda ingin kami bantu uruskan tempahan terus di WhatsApp pun boleh!"

Pelanggan: "SFV_ORD_4199" atau "Boleh semak order saya SFV-ORD-4199?"
Jawapan: "Pesanan anda *#SFV-ORD-4199* (*PINK MOTIV DESIGN*, 20 helai) berjumlah *RM620.00* kini dalam status *Menunggu Pengesahan Proof Mockup*.

Status deposit 50% (*RM310.00*) masih menunggu bayaran. Anda boleh semak butiran penuh atau muat turun invois di https://sfvapparel.my/history ya."

Pelanggan: "Dimana lokasi kilang ?"
Jawapan: "Kilang kami beroperasi di Kajang, Selangor:

*SFV APPAREL*
No 28-1, Jalan Prima Saujana 2/D, Taman Prima Saujana, 43000 Kajang, Selangor.

Waktu operasi kami Isnin hingga Jumaat (9.00 pagi - 6.00 petang) dan Sabtu (9.00 pagi - 1.00 tengah hari). Anda ingin datang melawat atau perlukan sebut harga dahulu?"

Pelanggan: "Apakah ini bot ?"
Jawapan: "Ya, saya ialah pembantu digital AI SFV APPAREL yang bertugas 24 jam untuk membantu menjawab soalan pantas mengenai harga, templat rekaan & info kilang.

Jika anda ingin berhubung terus dengan staf admin manusia kami, beritahu sahaja ya nanti saya sambungkan."

=== DATA RUJUKAN KILANG ===
Nama Jenama: ${companySettings.brand_name || 'SFV APPAREL'} (Pakar Jersi Sublimasi Penuh & Cetakan DTF)
Alamat Kilang: ${companySettings.address || 'No 28-1, Jalan Prima Saujana 2/D, Taman Prima Saujana, 43000 Kajang, Selangor, Malaysia'}
Waktu Operasi: ${companySettings.working_hours || 'Isnin - Jumaat: 9.00 AM - 6.00 PM | Sabtu: 9.00 AM - 1.00 PM | Ahad & Cuti Umum: Tutup'}
Kawasan Liputan: Kajang, Selangor (Khidmat pos ke seluruh Semenanjung, Sabah, Sarawak & Singapura)
Website Rasmi: https://sfvapparel.my
Katalog Rekaan: https://sfvapparel.my/catalog
Website 3D Customizer: https://sfvapparel.my/customize

${liveTimeContext}
${liveOrderContext}
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
  const rawReply = await callLlmWithFallback(messagesToSend, 0.35, 800);

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



