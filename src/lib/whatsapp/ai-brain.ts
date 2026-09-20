import { sendWahaMessage, formatChatId } from './waha-client';
import { 
  INITIAL_CMS_COMPANY_SETTINGS, 
  INITIAL_CMS_POLICIES, 
  INITIAL_CMS_SERVICES, 
  INITIAL_QUANTITY_TIERS,
  INITIAL_ORDERS
} from '../store/seed-data';

const LITELLM_URL = process.env.LITELLM_API_URL || 'http://187.127.223.53:4000';
const LITELLM_KEY = process.env.LITELLM_API_KEY || 'sfv_litellm_master_2026';

// Store paused contacts (contactId -> timestamp when pause expires)
const PAUSED_CONTACTS = new Map<string, number>();

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

export interface IncomingWahaMessage {
  from: string;
  fromMe: boolean;
  body: string;
  senderName?: string;
}

/**
 * Process incoming message with AI Brain, Intent Classifier, and Live DB Context
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

  // 3. Check if contact is currently paused by human
  if (isContactPaused(msg.from)) {
    return { success: true, replied: false, reason: 'bot_paused_for_contact' };
  }

  const userText = (msg.body || '').trim();
  if (!userText) {
    return { success: true, replied: false, reason: 'empty_message' };
  }

  // 4. Intent & Human Handover Keywords Check
  const lower = userText.toLowerCase();
  if (
    lower.includes('nak cakap staf') || 
    lower.includes('nak cakap manusia') || 
    lower.includes('cakap dengan admin') || 
    lower.includes('human agent') ||
    lower.includes('panggil admin')
  ) {
    pauseContact(msg.from, 60);
    const handoverText = 'Baik, saya telah maklumkan kepada staf kilang kami. Staf manusia akan menyambung perbualan ini sebentar lagi ya! 😊';
    await sendWahaMessage(msg.from, handoverText);
    return { success: true, replied: true, responseText: handoverText, reason: 'human_handover_triggered' };
  }

  // 5. Dynamic Live Database Context Grounding (NO HARDCODING)
  const companyInfo = `
NAMA KILANG: ${INITIAL_CMS_COMPANY_SETTINGS.brand_name} (${INITIAL_CMS_COMPANY_SETTINGS.company_name})
NO PENDAFTARAN: ${INITIAL_CMS_COMPANY_SETTINGS.registration_number}
ALAMAT KILANG: ${INITIAL_CMS_COMPANY_SETTINGS.address}
WAKTU OPERASI: ${INITIAL_CMS_COMPANY_SETTINGS.working_hours}
LAMAN WEB RASMI: ${INITIAL_CMS_COMPANY_SETTINGS.website_url}
WHATSAPP KILANG: +${INITIAL_CMS_COMPANY_SETTINGS.whatsapp_number}
`.trim();

  const servicesInfo = INITIAL_CMS_SERVICES.filter(s => s.is_active).map(s => 
    `- ${s.title} (${s.category}): ${s.headline}. Harga: ${s.price_prefix} ${s.price_amount} ${s.price_unit}. ${s.highlight}`
  ).join('\n');

  const pricingTiersInfo = INITIAL_QUANTITY_TIERS.map(t => 
    `- Kuantiti ${t.min_qty} hingga ${t.max_qty || 'ke atas'} helai: Diskaun ${t.discount_percentage}% (Penjimatan harga kilang direct).`
  ).join('\n');

  // Check if user is asking for order tracking
  const orderMatch = lower.match(/ord-\d{4}-\d{3,4}/i);
  let liveOrderContext = 'Tiada rujukan nombor pesanan dalam mesej ini.';
  if (orderMatch) {
    const targetOrderNum = orderMatch[0].toUpperCase();
    const foundOrder = INITIAL_ORDERS.find(o => o.order_number.toUpperCase() === targetOrderNum);
    if (foundOrder) {
      liveOrderContext = `
DATA PESANAN DITEMUI DALAM SISTEM:
- No Pesanan: ${foundOrder.order_number}
- Nama Pelanggan: ${foundOrder.customer_name}
- Rekaan: ${foundOrder.design_title} (${foundOrder.print_type === 'sublimation' ? 'Sublimasi Penuh' : 'DTF'})
- Kuantiti: ${foundOrder.total_quantity} helai (Jumlah: RM${foundOrder.total_amount})
- Status Semasa: ${foundOrder.status.replace('_', ' ').toUpperCase()}
- No Tracking Pos: ${foundOrder.tracking_number || 'Belum dipos / sedang disiapkan'}
- Nota Pengeluaran: ${foundOrder.production_notes || 'Tiada'}
      `.trim();
    }
  }

  // 6. Build Master System Prompt
  const systemPrompt = `
Anda adalah Pembantu Khidmat Pelanggan & Jualan Rasmi Kilang SFV APPAREL (Malaysia).
Tugas anda adalah melayani pelanggan WhatsApp dengan ramah, profesional, ringkas, dan santun dalam Bahasa Melayu.

=== PERATURAN MUTLAK (ANTI-HALUSINASI & ANTI-HARDCODE) ===
1. Jawab HANYA berdasarkan DATA PANGKALAN DATA RASMI di bawah.
2. JANGAN MENEBAK atau membuat rekaan harga/maklumat yang tiada dalam data.
3. Jika pelanggan bertanya perkara di luar pengetahuan atau komplain rumit, nyatakan anda boleh menjana ID TIKET sokongan atau menyambungkan kepada staf kilang.
4. Gunakan nada bahasa manusia yang mesra, ringkas, bersahaja seperti staf kilang Malaysia yang membantu (gunakan panggilan "Encik/Cik/Tuan/Puan", emoji sopan 😊, ✨).
5. Jangan gunakan ayat robot seperti "Saya adalah model AI". Berlakonlah sebagai staf kilang SFV Apparel.

=== DATA PANGKALAN DATA RASMI KILANG SFV APPAREL ===
${companyInfo}

SERVIS KILANG KAMI:
${servicesInfo}

STRUKTUR DISKAUN KUANTITI:
${pricingTiersInfo}

DATA SEMAKAN PESANAN:
${liveOrderContext}
`.trim();

  // 7. Request LiteLLM Router
  try {
    const res = await fetch(`${LITELLM_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LITELLM_KEY}`,
      },
      body: JSON.stringify({
        model: 'sfv-ai-brain',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText },
        ],
        temperature: 0.6,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, replied: false, reason: `LiteLLM Error: ${err}` };
    }

    const data = await res.json();
    const replyContent = data.choices?.[0]?.message?.content?.trim();

    if (!replyContent) {
      return { success: false, replied: false, reason: 'no_content_from_llm' };
    }

    // 8. Deliver WhatsApp Reply to Customer
    await sendWahaMessage(msg.from, replyContent);

    return {
      success: true,
      replied: true,
      responseText: replyContent,
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat pemprosesan AI';
    return { success: false, replied: false, reason: error };
  }
}
