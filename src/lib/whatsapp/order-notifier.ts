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
