import { sendWahaMessage, sendWahaImage, formatChatId } from './waha-client';
import { getCmsDataDb } from '@/app/actions/cmsActions';
import { getDesignsDb } from '@/app/actions/designActions';
import { getMasterPricingDb } from '@/app/actions/pricingActions';
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
    const handoverText = 'Baik, mesej anda telah dimaklumkan kepada pegawai khidmat pelanggan kilang kami. Staf bertugas akan menyambung perbualan ini sebentar lagi.';
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

  const companyInfo = `
NAMA KILANG: ${companySettings.brand_name || 'SFV APPAREL'} (${companySettings.company_name || 'SFV APPAREL SDN BHD'})
NO PENDAFTARAN: ${companySettings.registration_number || '202301048821'}
ALAMAT KILANG: ${companySettings.address || 'No. 12, Jalan Industri 3/1, Kawasan Perindustrian Rawang Perdana, 48000 Rawang, Selangor'}
WAKTU OPERASI: ${companySettings.working_hours || 'Isnin - Jumaat: 8:30 AM - 6:00 PM | Sabtu: 8:30 AM - 1:00 PM'}
LAMAN WEB RASMI: ${companySettings.website_url || 'https://sfvapparel.vercel.app'}
WHATSAPP KILANG: +${companySettings.whatsapp_number || '6281260066616'}
`.trim();

  const servicesInfo = services.filter(s => s.is_active).map(s => 
    `- ${s.title} (${s.category}): ${s.headline}. Harga bermula: ${s.price_prefix} ${s.price_amount} ${s.price_unit}. ${s.highlight}`
  ).join('\n');

  const pricingTiersInfo = quantityTiers.map(t => 
    `- Kuantiti ${t.min_qty} hingga ${t.max_qty || 'ke atas'} helai: Diskaun ${t.discount_percentage}% (Penjimatan harga pukal direct kilang).`
  ).join('\n');

  // Check if user is asking about a specific design/catalog product (e.g. DES-1, DES-01)
  const designMatch = lower.match(/des-?[\w\d]+/i);
  let liveDesignContext = 'Tiada rujukan ID produk khusus dalam mesej ini.';
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
PRODUK / REKAAN DITANYA OLEH PELANGGAN:
- Kod/ID Produk: ${foundDesign.code || foundDesign.id}
- Nama Rekaan: ${foundDesign.title}
- Kategori: ${foundDesign.category}
- Jenis Cetakan: ${foundDesign.print_type === 'sublimation' ? 'Sublimasi Penuh (Full Sublimation)' : 'Cetakan DTF'}
- Penerangan: ${foundDesign.description || 'Pakaian kustom berkualiti tinggi dari kilang SFV Apparel'}
- Pilihan Kain Sesuai: Drifit Milano 165gsm (Breathable cepat kering), Microfiber Eyelet, atau Cotton Comb 24s
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
- No Tracking Pos: ${foundOrder.tracking_number || 'Belum dipos / dalam fasa cetakan kilang'}
- Nota Pengeluaran: ${foundOrder.production_notes || 'Tiada'}
      `.trim();
    }
  }

  // 7. Build Master System Prompt
  const systemPrompt = `
Anda adalah Pegawai Khidmat Pelanggan & Jualan Rasmi Kilang Pembuatan Pakaian SFV APPAREL (Malaysia).
Tugas anda adalah melayani pertanyaan pelanggan WhatsApp dengan nada pertuturan manusia yang santun, profesional, mesra, jelas, dan berwibawa dalam Bahasa Melayu.

=== PERATURAN MUTLAK (ANTI-HALUSINASI, SIFAR EMOJI & SIFAR HARDCODE) ===
1. Jawab HANYA berdasarkan DATA PANGKALAN DATA RASMI KILANG di bawah.
2. JANGAN MENEBAK atau mereka-reka maklumat harga atau servis yang tiada dalam data.
3. HINDARI PENGGUNAAN SEBARANG EMOJI ATAU EMOTICON DALAM SETIAP JAWAPAN. Gunakan teks bersih, kemas, dan matang.
4. Jangan sesekali berkata bahawa anda adalah model AI, bot, atau program komputer. Bertindaklah sepenuhnya sebagai pegawai syarikat SFV Apparel.
5. Jika pelanggan bertanyakan produk/rekaan (cth: ada ID Produk):
   - Nyatakan anda telah mengesahkan rekaan tersebut di dalam sistem katalog kilang.
   - Terangkan pilihan jenis material kain yang sesuai dan jenis cetakan.
   - Tanyakan anggaran kuantiti helai yang ingin ditempah untuk semakan potongan harga pukal.
6. Jika pelanggan bertanyakan semakan pesanan (cth: ada No Pesanan ORD-XXXX):
   - Nyatakan status terkini tempahan mereka secara tepat berdasarkan data.
7. Jika ada isu rumit di luar maklumat data, nyatakan anda boleh mendaftarkan ID TIKET sokongan untuk tindakan pegawai teknikal kilang.

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

  // 8. Request LiteLLM Router
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
        max_tokens: 350,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return { success: false, replied: false, reason: `LiteLLM Error: ${err}` };
    }

    const data = await res.json();
    let replyContent = data.choices?.[0]?.message?.content?.trim();

    if (!replyContent) {
      return { success: false, replied: false, reason: 'no_content_from_llm' };
    }

    // Strip any residual emojis just in case LLM slipped one in
    try {
      replyContent = replyContent.replace(new RegExp('[\\uD83C-\\uDBFF\\uDC00-\\uDFFF]+|[\\u2600-\\u27BF]', 'g'), '').trim();
    } catch {
      // Fallback
    }

    // 9. Deliver WhatsApp Reply to Customer
    // If target design has a valid image mockup, send the image first or text
    if (targetDesignImage) {
      await sendWahaImage(msg.from, targetDesignImage, `Rekaan: ${targetDesignTitle || 'Katalog SFV Apparel'}`);
      // Small pause before delivering text
      await new Promise(r => setTimeout(r, 600));
    }

    await sendWahaMessage(msg.from, replyContent);

    return {
      success: true,
      replied: true,
      responseText: replyContent,
    };
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Ralat pemprosesan AI';
    console.error('[AI Brain Processing Error]', error);
    return { success: false, replied: false, reason: error };
  }
}

