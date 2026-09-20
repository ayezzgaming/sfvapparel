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

export function buildWhatsAppInquiryUrl(params: WhatsAppInquiryParams): string {
  let cleanPhone = (params.phone || '6281260066616').replace(/[\s\-\+\(\)]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '60' + cleanPhone.slice(1);
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
