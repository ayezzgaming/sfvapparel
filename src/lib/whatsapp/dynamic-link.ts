/**
 * Helper to generate standardized, professional WhatsApp Click-to-Chat links
 * Strict guidelines: Zero emojis, natural mature polite Bahasa Melayu, clear structured IDs
 */

export interface WhatsAppInquiryParams {
  phone?: string;
  type: 'general' | 'catalog' | 'customize' | 'order';
  designTitle?: string;
  designId?: string;
  category?: string;
  orderNumber?: string;
  totalQty?: number;
  fabricName?: string;
  cutName?: string;
  customNote?: string;
}

/**
 * Clean any raw phone string into pure international digits (e.g. '014-859 9138' -> '60148599138')
 */
export function cleanWhatsAppPhone(phone?: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '60' + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Build dynamic WhatsApp click-to-chat URL
 */
export function formatWhatsAppLink(phone?: string, text?: string): string {
  const clean = cleanWhatsAppPhone(phone);
  if (!clean) return '#';
  if (!text) return `https://wa.me/${clean}`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppInquiryUrl(params: WhatsAppInquiryParams): string {
  const cleanPhone = cleanWhatsAppPhone(params.phone);
  if (!cleanPhone) {
    return '#';
  }

  let text = '';

  switch (params.type) {
    case 'catalog':
      text = `Salam sejahtera pihak pengurusan SFV Apparel,

Saya berminat untuk membuat pertanyaan mengenai produk berikut:
- Nama Produk: ${params.designTitle || 'Rekaan Katalog'}
- ID Produk: ${params.designId || 'DES-1'}
- Kategori: ${params.category || 'Jersi Sukan'}

Mohon bantuan mengenai anggaran sebut harga pukal dan pilihan material kain bagi rekaan ini. Terima kasih.`;
      break;

    case 'customize':
      text = `Salam sejahtera pihak pengurusan SFV Apparel,

Saya telah memilih spesifikasi kustom di laman web rasmi:
- Nama Rekaan: ${params.designTitle || 'Jersi Kustom'}
- ID Produk: ${params.designId || 'DES-1'}
${params.cutName ? `- Jenis Potongan: ${params.cutName}\n` : ''}${params.fabricName ? `- Pilihan Kain: ${params.fabricName}\n` : ''}${params.totalQty ? `- Anggaran Kuantiti: ${params.totalQty} helai\n` : ''}
Mohon maklumkan langkah seterusnya bagi pengesahan rekaan dan sebut harga rasmi kilang. Terima kasih.`;
      break;

    case 'order':
      text = `Salam sejahtera pihak pengurusan SFV Apparel,

Saya ingin membuat semakan status terkini bagi pesanan saya:
- Nombor Pesanan: ${params.orderNumber || 'ORD-2026-001'}
${params.designTitle ? `- Rekaan: ${params.designTitle}\n` : ''}
Mohon maklumkan status produksi atau nombor penjejakan pos bagi tempahan ini. Terima kasih.`;
      break;

    case 'general':
    default:
      text = `Salam sejahtera pihak pengurusan SFV Apparel,

Saya sedang melayari laman web rasmi dan ingin membuat pertanyaan mengenai tempahan pakaian kustom terus dari kilang.

Mohon maklumkan servis dan sebut harga terkini yang disediakan. Terima kasih.`;
      break;
  }

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export interface WhatsAppCustomOrderPayload {
  phone?: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  teamName?: string;
  designTitle: string;
  designId?: string;
  technique: string;
  fabricName?: string;
  fabricPrice?: number;
  cutName?: string;
  cutAddOn?: number;
  sizingBreakdown: Record<string, number>;
  totalQty: number;
  rawUnitPrice: number;
  discountPercentage: number;
  finalUnitPrice: number;
  totalAmount: number;
  logoStatus?: string;
  rosterStatus?: string;
  notes?: string;
  shippingAddress?: string;
}

export function buildCustomOrderWhatsAppUrl(payload: WhatsAppCustomOrderPayload): string {
  const cleanPhone = cleanWhatsAppPhone(payload.phone);
  if (!cleanPhone) {
    return '#';
  }

  const activeSizes = Object.entries(payload.sizingBreakdown)
    .filter(([_, qty]) => Number(qty) > 0)
    .map(([size, qty]) => `- Saiz ${size}: ${qty} helai`)
    .join('\n');

  const text = `Salam sejahtera pihak pengurusan SFV Apparel,

Saya ingin mengesahkan tempahan kustom dengan butiran berikut:

*MAKLUMAT PESANAN:*
- No. Pesanan: ${payload.orderNumber}
- Pelanggan: ${payload.customerName} (${payload.customerPhone})
${payload.teamName ? `- Pasukan/Kelab: ${payload.teamName}\n` : ''}
*SPESIFIKASI TEMPAHAN:*
- Rekaan: ${payload.designTitle} (ID: ${payload.designId || '-'})
- Teknik Cetakan: ${payload.technique}
${payload.fabricName ? `- Fabrik: ${payload.fabricName} (RM ${payload.fabricPrice?.toFixed(2)}/helai)\n` : ''}${payload.cutName ? `- Pola Potongan: ${payload.cutName} (+RM ${payload.cutAddOn?.toFixed(2)})\n` : ''}
*PECAHAN SAIZ (${payload.totalQty} helai):*
${activeSizes || '- Tiada saiz dinyatakan'}

*SEBUT HARGA:*
- Harga Seunit: RM ${payload.finalUnitPrice.toFixed(2)}${payload.discountPercentage > 0 ? ` (Diskaun Kuantiti ${payload.discountPercentage}%)` : ''}
- Jumlah Keseluruhan: RM ${payload.totalAmount.toFixed(2)}

*STATUS LOGO & SENARAI NAMA:*
- Logo/Penaja: ${payload.logoStatus || 'Tiada fail'}
- Senarai Nama & No: ${payload.rosterStatus || 'Tiada'}
${payload.notes ? `- Nota Tambahan: ${payload.notes}\n` : ''}${payload.shippingAddress ? `- Alamat Penghantaran: ${payload.shippingAddress}\n` : ''}
Mohon pihak kilang semak dan kemaskini jadual produksi bagi pesanan ini. Terima kasih.`;

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}



