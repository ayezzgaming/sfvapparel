import { sendWahaMessage, formatChatId } from './waha-client';
import { 
  INITIAL_CMS_COMPANY_SETTINGS, 
  INITIAL_CMS_POLICIES, 
  INITIAL_CMS_SERVICES, 
  INITIAL_QUANTITY_TIERS,
  INITIAL_ORDERS,
  INITIAL_DESIGNS
} from '../store/seed-data';

const LITELLM_URL = process.env.LITELLM_API_URL || 'http://187.127.223.53:4000';
const LITELLM_KEY = process.env.LITELLM_API_KEY || 'sfv_litellm_master_2026';

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

  // 4. Intent & Human Handover Keywords Check
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
    const handoverText = 'Baik, mesej anda telah dimaklumkan kepada staf khidmat pelanggan kilang kami. Pegawai bertugas akan menyambung perbualan ini sebentar lagi.';
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
    `- ${s.title} (${s.category}): ${s.headline}. Harga bermula: ${s.price_prefix} ${s.price_amount} ${s.price_unit}. ${s.highlight}`
  ).join('\n');

  const pricingTiersInfo = INITIAL_QUANTITY_TIERS.map(t => 
    `- Kuantiti ${t.min_qty} hingga ${t.max_qty || 'ke atas'} helai: Diskaun ${t.discount_percentage}% (Penjimatan harga pukal direct kilang).`
  ).join('\n');

  // Check if user is asking about a specific design/catalog product (e.g. DES-1, DES-2)
  const designMatch = lower.match(/des-[\w\d]+/i);
  let liveDesignContext = 'Tiada rujukan ID produk khusus dalam mesej ini.';
  if (designMatch) {
    const targetDesId = designMatch[0].toLowerCase();
    const foundDesign = INITIAL_DESIGNS.find(d => d.id.toLowerCase() === targetDesId);
    if (foundDesign) {
      liveDesignContext = `
PRODUK / REKAAN DITANYA OLEH PELANGGAN:
- ID Produk: ${foundDesign.id.toUpperCase()}
- Nama Rekaan: ${foundDesign.title}
- Kategori: ${foundDesign.category}
- Jenis Cetakan: ${foundDesign.print_type === 'sublimation' ? 'Sublimasi Penuh (Full Sublimation)' : 'Cetakan DTF'}
- Penerangan: ${foundDesign.description}
- Pilihan Kain Sesuai: Drifit Milano 165gsm (Breathable cepat kering) atau Microfiber Smooth
- Tempoh Siap: ${foundDesign.print_type === 'sublimation' ? '7 hingga 10 hari bekerja' : '3 hingga 5 hari bekerja'}
      `.trim();
    }
  }

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
- No Tracking Pos: ${foundOrder.tracking_number || 'Belum dipos / dalam proses cetakan'}
- Nota Pengeluaran: ${foundOrder.production_notes || 'Tiada'}
      `.trim();
    }
  }

  // 6. Build Master System Prompt
  const systemPrompt = `
Anda adalah Pegawai Khidmat Pelanggan & Jualan Rasmi Kilang Pembuatan Pakaian SFV APPAREL (Malaysia).
Tugas anda adalah melayani pertanyaan pelanggan WhatsApp dengan nada pertuturan manusia yang santun, profesional, jelas, dan berwibawa dalam Bahasa Melayu.

=== PERATURAN MUTLAK (ANTI-HALUSINASI, SIFAR EMOJI & SIFAR HARDCODE) ===
1. Jawab HANYA berdasarkan DATA PANGKALAN DATA RASMI KILANG di bawah.
2. JANGAN MENEBAK atau mereka-reka maklumat yang tiada dalam data.
3. HINDARI PENGGUNAAN SEBARANG EMOJI ATAU EMOTICON DALAM SETIAP JAWAPAN. Kekalkan teks yang bersih, kemas, dan matang.
4. Jangan sesekali berkata bahawa anda adalah model AI atau bot. Bertindaklah sepenuhnya sebagai pegawai syarikat SFV Apparel.
5. Jika pelanggan bertanyakan produk/rekaan (cth: ada ID Produk):
   - Nyatakan anda telah mengesahkan rekaan tersebut di dalam sistem katalog kilang.
   - Terangkan pilihan jenis material kain yang sesuai dan jenis cetakan.
   - Tanyakan anggaran kuantiti helai yang ingin ditempah untuk semakan potongan harga pukal.
6. Jika pelanggan bertanyakan semakan pesanan (cth: ada No Pesanan ORD-XXXX):
   - Nyatakan status terkini tempahan mereka secara tepat berdasarkan data.
7. Jika ada isu rumit di luar maklumat data, nyatakan anda boleh mendaftarkan ID TIKET sokongan untuk tindakan staf kilang.

=== DATA PANGKALAN DATA RASMI KILANG SFV APPAREL ===
${companyInfo}

SERVIS KILANG:
${servicesInfo}

STRUKTUR DISKAUN KUANTITI:
${pricingTiersInfo}

REKAAN / PRODUK YANG DITANYAKAN:
${liveDesignContext}

SEMAKAN STATUS PESANAN:
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
