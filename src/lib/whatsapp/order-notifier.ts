import { Order } from '@/types/database';
import { sendWahaMessage } from './waha-client';
import { formatCurrency } from '@/lib/pricing-calculator';

export type InvoiceNotificationType = 
  | 'order_created' 
  | 'deposit_confirmed' 
  | 'balance_reminder' 
  | 'balance_paid'
  | 'manual_invoice';

/**
 * Sends an official, structured WhatsApp invoice & payment breakdown message to the customer
 */
export async function sendOrderInvoiceWhatsApp(
  order: Order,
  type: InvoiceNotificationType = 'manual_invoice',
  baseUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!order.customer_phone) {
      return { success: false, error: 'Nombor telefon pelanggan tidak ditemui.' };
    }

    const totalAmount = Number(order.total_amount) || 0;
    const depositAmount = Number(order.deposit_amount) || Math.round(totalAmount * 0.5 * 100) / 100;
    const balanceAmount =
      order.balance_amount !== undefined && order.balance_amount !== null && order.balance_amount > 0
        ? Number(order.balance_amount)
        : Math.max(0, Math.round((totalAmount - depositAmount) * 100) / 100);

    const isDepositPaid =
      order.payment_status === 'deposit_paid' ||
      order.payment_status === 'paid' ||
      Boolean(order.deposit_paid_at);

    const isPaidInFull = order.payment_status === 'paid' || Boolean(order.balance_paid_at);

    const invoiceNumber = `INV-${order.order_number.replace(/^SFV-?/i, '')}`;
    const orderDate = new Date(order.created_at).toLocaleDateString('ms-MY', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const host = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'https://sfvapparel.my';
    const trackingLink = `${host}/history/${order.order_number}`;

    // Size Breakdown text
    let sizeText = '';
    if (order.sizing_breakdown && Object.keys(order.sizing_breakdown).length > 0) {
      sizeText = Object.entries(order.sizing_breakdown)
        .map(([s, q]) => `${s}: ${q}`)
        .join(', ');
    }

    // Title & Header based on notification trigger type
    let headerTitle = 'INVOIS & PENGESAHAN PESANAN RASMI';
    if (type === 'deposit_confirmed') {
      headerTitle = 'PENGESAHAN BAYARAN DEPOSIT 50% (DISAHKAN)';
    } else if (type === 'balance_paid') {
      headerTitle = 'RESIT RASMI BAYARAN PENUH 100% (LUNAS)';
    } else if (type === 'balance_reminder') {
      headerTitle = 'PERINGATAN PELUNASAN BAKI 50% (SEDIA DIPOS)';
    }

    let depositStatusLabel = isDepositPaid ? '[DISAHKAN DITERIMA]' : '[MENUNGGU BAYARAN]';
    let balanceStatusLabel = isPaidInFull ? '[LUNAS SEPENUHNYA]' : '[BAYAR BILA SEDIA DIPOS]';

    const message = `*${headerTitle}*
*SFV APPAREL*
========================================
*No. Invois:* ${invoiceNumber}
*No. Pesanan:* ${order.order_number}
*Tarikh:* ${orderDate}
*Pelanggan:* ${order.customer_name}
*Telefon:* ${order.customer_phone}

*PERINCIAN ITEM & SPESIFIKASI:*
• *Rekaan:* ${order.design_title}
• *Jenis Cetakan:* ${order.print_type === 'sublimation' ? 'Sublimasi Penuh' : 'DTF Premium'}
• *Kuantiti:* ${order.total_quantity} helai ${sizeText ? `(Saiz: ${sizeText})` : ''}
• *Harga Seunit:* ${formatCurrency(order.final_unit_price || order.raw_unit_price)}
• *Alamat Pos:* ${order.shipping_address || 'Ambil di kilang'}
${order.tracking_number ? `• *No. Tracking Kurier:* ${order.tracking_number}` : ''}

*STRUKTUR BAYARAN:*
• *Jumlah Keseluruhan:* *${formatCurrency(totalAmount)}*
• *1. Deposit 50%:* *${formatCurrency(depositAmount)}* ${depositStatusLabel}
• *2. Baki Pelunasan 50%:* *${formatCurrency(balanceAmount)}* ${balanceStatusLabel}

*STATUS KILANG SEMASA:*
• Status: *${order.status ? order.status.toUpperCase().replace(/_/g, ' ') : 'DALAM PROSES'}*

========================================
*Semak Invois & Jejak Pengeluaran Langsung:*
${trackingLink}

Terima kasih atas tempahan anda bersama SFV Apparel!`;

    const res = await sendWahaMessage(order.customer_phone, message);
    return res;
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Gagal menghantar notifikasi invois WhatsApp';
    console.error('[sendOrderInvoiceWhatsApp] Error:', error);
    return { success: false, error };
  }
}

/**
 * Sends a milestone status update to the customer via WhatsApp
 */
export async function sendOrderStatusMilestoneWhatsApp(
  order: Order,
  status: string,
  trackingNumber?: string,
  courier?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!order.customer_phone) {
      return { success: false, error: 'Nombor telefon pelanggan tidak ditemui.' };
    }

    const host = process.env.NEXT_PUBLIC_APP_URL || 'https://sfvapparel.my';
    const trackingLink = `${host}/history/${order.order_number}`;

    const statusMap: Record<string, { title: string; desc: string }> = {
      pending_proof: {
        title: 'PENYEDIAAN MOCKUP REKA BENTUK',
        desc: 'Pereka grafik kami sedang menyediakan mockup jersi rasmi anda untuk semakan & pengesahan.',
      },
      proof_approved: {
        title: 'MOCKUP DISAHKAN & MASUK JADUAL KILANG',
        desc: 'Mockup rekaan telah disahkan! Pesanan anda kini memasuki jadual pencetakan kilang.',
      },
      in_printing: {
        title: 'PROSES CETAKAN SUBLIMASI / DTF DIMULAKAN',
        desc: 'Fabrik jersi anda sedang dicetak menggunakan teknologi Full Sublimation HD terkini kilang kami.',
      },
      printing: {
        title: 'PROSES CETAKAN SUBLIMASI / DTF DIMULAKAN',
        desc: 'Fabrik jersi anda sedang dicetak menggunakan teknologi Full Sublimation HD terkini kilang kami.',
      },
      heat_press: {
        title: 'PROSES PEMINDAHAN HABA (HEAT PRESS)',
        desc: 'Proses penyerapan warna haba tinggi sedang dijalankan untuk ketahanan warna optimum.',
      },
      sewing: {
        title: 'PROSES JAHITAN & KEMASAN POLA',
        desc: 'Pola kain yang siap dicetak kini dalam fasa jahitan kemas oleh tukang jahit berpengalaman.',
      },
      qc_check: {
        title: 'PEMERIKSAAN KUALITI (QC) & BUNGKUSAN',
        desc: 'Jersi anda telah siap dijahit dan sedang menjalani pemeriksaan kualiti ketat sebelum dibungkus.',
      },
      qc_packing: {
        title: 'PEMERIKSAAN KUALITI (QC) & BUNGKUSAN',
        desc: 'Jersi anda telah siap dijahit dan sedang menjalani pemeriksaan kualiti ketat sebelum dibungkus.',
      },
      ready_to_ship: {
        title: 'JERSI SIAP & SEDIA UNTUK DIPOS / DIAMBIL',
        desc: 'Tempahan jersi anda telah siap sepenuhnya! Bungkusan sedia diambil oleh kurier untuk penghantaran.',
      },
      shipped: {
        title: 'PESANAN TELAH DIHANTAR / DIPOS',
        desc: `Pesanan anda telah diserahkan kepada pihak kurier (${courier || order.shipping_courier || 'Kurier'}). Sila semak tracking number di bawah.`,
      },
      delivered: {
        title: 'PESANAN TELAH SELESAI / DITERIMA',
        desc: 'Pesanan jersi anda telah berjaya diterima. Terima kasih kerana mempercayai SFV Apparel!',
      },
      cancelled: {
        title: 'PESANAN DIBATALKAN',
        desc: 'Pesanan ini telah dibatalkan. Sila hubungi khidmat pelanggan kami jika terdapat sebarang pertanyaan.',
      },
    };

    const info = statusMap[status] || {
      title: status.toUpperCase().replace(/_/g, ' '),
      desc: 'Status pengeluaran jersi anda telah dikemas kini.',
    };

    const message = `*KEMASKINI STATUS TEMPAHAN JERSI*
*SFV APPAREL*
========================================
*No. Pesanan:* ${order.order_number}
*Pelanggan:* ${order.customer_name}
*Rekaan:* ${order.design_title} (${order.total_quantity} helai)

*STATUS TERKINI: ${info.title}*
${info.desc}

${trackingNumber ? `*Maklumat Penghantaran:*
• *Kurier:* ${courier || order.shipping_courier || 'J&T / PosLaju'}
• *No. Tracking:* *${trackingNumber}*` : ''}

========================================
*Jejak Status Terperinci Di Sini:*
${trackingLink}

Sebarang pertanyaan, anda boleh terus membalas mesej ini.`;

    return await sendWahaMessage(order.customer_phone, message);
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Gagal menghantar status WhatsApp';
    console.error('[sendOrderStatusMilestoneWhatsApp] Error:', error);
    return { success: false, error };
  }
}

/**
 * Sends a review request and repeat customer discount voucher
 */
export async function sendPostDeliveryReviewWhatsApp(
  order: Order,
  discountCode: string = 'SFVIP10'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!order.customer_phone) {
      return { success: false, error: 'Nombor telefon pelanggan tidak ditemui.' };
    }

    const host = process.env.NEXT_PUBLIC_APP_URL || 'https://sfvapparel.my';

    const message = `*TERIMA KASIH DARI SFV APPAREL!*
========================================
Hai *${order.customer_name}*,

Kami harap anda dan pasukan berpuas hati dengan kualiti jersi *${order.design_title}* (No: ${order.order_number}) yang telah diterima!

*KONGSI PENDAPAT ANDA:*
Bantuan maklum balas anda amat berharga bagi kilang kami untuk terus meningkatkan kualiti jahitan dan cetakan.

*HADIAH REPEAT ORDER (DISKAUN 10%):*
Sebagai tanda penghargaan, gunakan kod promo khas ini untuk tempahan jersi anda yang seterusnya di portal kami:
Kod Promo: *${discountCode}* (Diskaun 10%)

Layari dan reka jersi baru anda di:
${host}/customize

Terima kasih atas sokongan berterusan anda!`;

    return await sendWahaMessage(order.customer_phone, message);
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Gagal menghantar review WhatsApp';
    return { success: false, error };
  }
}

